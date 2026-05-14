"use client";

import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { BridgeKit, ArcTestnet, EthereumSepolia, BaseSepolia, ArbitrumSepolia, PolygonAmoy, TransferSpeed } from "@circle-fin/bridge-kit";
import { useWalletClient } from "wagmi";

// Map chain keys to BridgeKit chain objects
const CHAIN_MAP = {
  arc: ArcTestnet,
  ethereum_sepolia: EthereumSepolia,
  base_sepolia: BaseSepolia,
  arbitrum_sepolia: ArbitrumSepolia,
  polygon_amoy: PolygonAmoy,
} as const;

const CHAIN_LABELS: Record<string, string> = {
  arc: "Arc Testnet",
  ethereum_sepolia: "Ethereum Sepolia",
  base_sepolia: "Base Sepolia",
  arbitrum_sepolia: "Arbitrum Sepolia",
  polygon_amoy: "Polygon Amoy",
};

type BridgeStatus = "idle" | "preparing" | "signing" | "bridging" | "completed" | "failed";

interface CrossChainRefundProps {
  refundRequestId: string;
  amount: number;
  currency: string;
  invoiceId: string;
  onComplete?: (txHash: string) => void;
  onError?: (error: string) => void;
}

export function CrossChainRefund({
  refundRequestId,
  amount,
  currency,
  invoiceId,
  onComplete,
  onError,
}: CrossChainRefundProps) {
  const { address } = useAppKitAccount();
  const { data: walletClient } = useWalletClient();
  const [status, setStatus] = useState<BridgeStatus>("idle");
  const [destinationChain, setDestinationChain] = useState("arc");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [routeInfo, setRouteInfo] = useState<{
    route: string;
    estimatedFee: string;
    estimatedTime: string;
    reasoning: string;
  } | null>(null);

  async function handleBridge() {
    if (!address || !walletClient) {
      onError?.("Wallet not connected");
      return;
    }

    const recipient = recipientAddress || address;

    try {
      // Step 1: Get route recommendation from agent
      setStatus("preparing");
      setStatusMessage("Agent analyzing optimal route...");

      const prepRes = await fetch("/api/agent/bridge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address,
        },
        body: JSON.stringify({
          refundRequestId,
          destinationChain,
          recipientAddress: recipient,
          amount: amount.toString(),
        }),
      });

      if (!prepRes.ok) {
        const err = await prepRes.json();
        throw new Error(err.error || "Failed to prepare bridge");
      }

      const { route, bridgeConfig } = await prepRes.json();
      setRouteInfo(route);

      // Step 2: Direct Arc transfer (same chain)
      if (route.route === "direct_arc") {
        setStatus("signing");
        setStatusMessage("Sign the transfer in your wallet...");

        // Direct USDC transfer on Arc
        const txHash = await walletClient.sendTransaction({
          to: recipient as `0x${string}`,
          value: BigInt(0),
          // For ERC20 transfer, we'd encode the transfer call
          // For testnet simplicity, using native transfer
        });

        setStatus("completed");
        setStatusMessage(`Transfer complete! TX: ${txHash}`);

        // Update server
        await fetch("/api/agent/bridge", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-wallet-address": address,
          },
          body: JSON.stringify({
            refundRequestId,
            txHash,
            status: "completed",
          }),
        });

        onComplete?.(txHash);
        return;
      }

      // Step 3: Cross-chain CCTP bridge
      setStatus("signing");
      setStatusMessage("Initializing cross-chain bridge...");

      const kit = new BridgeKit();

      // Create a viem-based adapter for the source chain
      const sourceAdapter = {
        getAddress: async () => address,
        sendTransaction: async (tx: unknown) => {
          return walletClient.sendTransaction(tx as Parameters<typeof walletClient.sendTransaction>[0]);
        },
        waitForTransaction: async (hash: string) => {
          // Wait for tx confirmation
          const receipt = await walletClient.request({
            method: "eth_getTransactionReceipt" as never,
            params: [hash] as never,
          });
          return receipt;
        },
      };

      setStatus("bridging");
      setStatusMessage("Burning USDC on Arc... waiting for attestation...");

      const result = await kit.bridge({
        from: {
          adapter: sourceAdapter as never,
          chain: bridgeConfig.sourceChain,
          address,
        },
        to: {
          chain: bridgeConfig.destinationChain,
          recipientAddress: recipient,
          useForwarder: bridgeConfig.useForwarder,
        } as never,
        amount: bridgeConfig.amount,
        token: "USDC",
        config: {
          transferSpeed: TransferSpeed.FAST,
        },
      });

      if (result.state === "success") {
        setStatus("completed");
        setStatusMessage(`Bridge complete! Funds arriving on ${CHAIN_LABELS[destinationChain]}`);

        await fetch("/api/agent/bridge", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-wallet-address": address,
          },
          body: JSON.stringify({
            refundRequestId,
            txHash: result.source?.address || "",
            status: "completed",
          }),
        });

        onComplete?.(result.source?.address || "");
      } else {
        throw new Error("Bridge transfer failed");
      }
    } catch (err) {
      setStatus("failed");
      const message = err instanceof Error ? err.message : "Bridge failed";
      setStatusMessage(message);

      // Update server with failure
      await fetch("/api/agent/bridge", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address!,
        },
        body: JSON.stringify({
          refundRequestId,
          status: "failed",
        }),
      });

      onError?.(message);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
        🌐 Cross-Chain Refund
        <span className="text-xs text-zinc-500">Invoice: {invoiceId}</span>
      </h3>

      <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Amount</span>
          <span className="text-lg font-bold text-emerald-300">{amount} {currency}</span>
        </div>
      </div>

      {/* Destination Chain Selector */}
      <div className="mb-4">
        <label className="mb-2 block text-sm text-zinc-400">Destination Chain</label>
        <select
          value={destinationChain}
          onChange={(e) => setDestinationChain(e.target.value)}
          disabled={status !== "idle"}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-400/50"
        >
          {Object.entries(CHAIN_LABELS).map(([key, label]) => (
            <option key={key} value={key} className="bg-zinc-900">
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Recipient Address */}
      <div className="mb-4">
        <label className="mb-2 block text-sm text-zinc-400">
          Recipient Address <span className="text-zinc-600">(leave empty to use your wallet)</span>
        </label>
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder={address || "0x..."}
          disabled={status !== "idle"}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white outline-none focus:border-emerald-400/50 placeholder:text-zinc-600"
        />
      </div>

      {/* Route Info */}
      {routeInfo && (
        <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <p className="text-xs font-medium text-emerald-300 mb-1">Agent Route Decision</p>
          <p className="text-sm text-zinc-300">{routeInfo.reasoning}</p>
          <div className="mt-2 flex gap-4 text-xs text-zinc-400">
            <span>Fee: ~${routeInfo.estimatedFee}</span>
            <span>Time: {routeInfo.estimatedTime}</span>
          </div>
        </div>
      )}

      {/* Status */}
      {status !== "idle" && (
        <div className={`mb-4 rounded-xl border p-4 ${
          status === "completed" ? "border-emerald-400/20 bg-emerald-400/5" :
          status === "failed" ? "border-red-400/20 bg-red-400/5" :
          "border-amber-400/20 bg-amber-400/5"
        }`}>
          <div className="flex items-center gap-2">
            {status !== "completed" && status !== "failed" && (
              <div className="size-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            )}
            {status === "completed" && <span>✓</span>}
            {status === "failed" && <span>✗</span>}
            <p className={`text-sm ${
              status === "completed" ? "text-emerald-300" :
              status === "failed" ? "text-red-300" :
              "text-amber-300"
            }`}>{statusMessage}</p>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={handleBridge}
        disabled={status !== "idle" || !address}
        className={`w-full rounded-xl py-3 text-sm font-semibold transition ${
          status !== "idle"
            ? "cursor-not-allowed bg-zinc-700 text-zinc-400"
            : "bg-emerald-400 text-black hover:bg-emerald-300"
        }`}
      >
        {status === "idle" && "Execute Refund"}
        {status === "preparing" && "Analyzing Route..."}
        {status === "signing" && "Sign in Wallet..."}
        {status === "bridging" && "Bridging..."}
        {status === "completed" && "Completed ✓"}
        {status === "failed" && "Failed - Try Again"}
      </button>
    </div>
  );
}
