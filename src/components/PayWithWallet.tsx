"use client";

import { useEffect, useMemo, useState } from "react";
import { ARC_TESTNET, ARC_USDC, type Invoice, shortAddress } from "@/lib/invoices";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const TRANSFER_SELECTOR = "0xa9059cbb";

function padAddress(address: string) {
  return address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

function amountToUsdcUnits(amount: number) {
  return BigInt(Math.round(amount * 10 ** ARC_USDC.decimals));
}

function padUint(value: bigint) {
  return value.toString(16).padStart(64, "0");
}

function buildTransferCalldata(to: string, amount: number) {
  return `${TRANSFER_SELECTOR}${padAddress(to)}${padUint(amountToUsdcUnits(amount))}`;
}

function txStatusKey(invoiceId: string) {
  return `takpay:${invoiceId}:paidTx`;
}

export function PayWithWallet({ invoice }: { invoice: Invoice }) {
  const [account, setAccount] = useState<string>("");
  const [chainId, setChainId] = useState<string>("");
  const [txHash, setTxHash] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(txStatusKey(invoice.id)) ?? "";
  });
  const [status, setStatus] = useState<"idle" | "connecting" | "switching" | "sending" | "confirming" | "paid" | "error">(() => {
    if (typeof window === "undefined") return "idle";
    return window.localStorage.getItem(txStatusKey(invoice.id)) ? "paid" : "idle";
  });
  const [message, setMessage] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem(txStatusKey(invoice.id))) {
      return "Payment detected on this browser. Invoice marked paid.";
    }
    return "Connect your wallet to pay with Arc testnet USDC.";
  });

  const explorerTx = useMemo(() => (txHash ? `${ARC_TESTNET.explorerUrl}/tx/${txHash}` : ""), [txHash]);
  const isArc = chainId.toLowerCase() === ARC_TESTNET.chainIdHex;

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const next = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : "";
      setAccount(next);
    };
    const handleChainChanged = (nextChainId: unknown) => {
      if (typeof nextChainId === "string") setChainId(nextChainId);
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    void window.ethereum.request({ method: "eth_accounts" }).then(handleAccountsChanged).catch(() => null);
    void window.ethereum.request({ method: "eth_chainId" }).then(handleChainChanged).catch(() => null);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus("error");
      setMessage("No injected wallet found. Install MetaMask, Rabby, or another EVM wallet.");
      return;
    }

    setStatus("connecting");
    setMessage("Requesting wallet connection...");
    const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
    setAccount(accounts[0] ?? "");
    const currentChain = (await window.ethereum.request({ method: "eth_chainId" })) as string;
    setChainId(currentChain);
    setStatus("idle");
    setMessage("Wallet connected. Switch to Arc testnet to continue.");
  }

  async function switchToArc() {
    if (!window.ethereum) return;
    setStatus("switching");
    setMessage("Switching wallet to Arc testnet...");

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_TESTNET.chainIdHex }],
      });
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? (error as { code?: number }).code : undefined;
      if (code !== 4902) throw error;
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ARC_TESTNET.chainIdHex,
            chainName: ARC_TESTNET.name,
            nativeCurrency: ARC_TESTNET.nativeCurrency,
            rpcUrls: [ARC_TESTNET.rpcUrl],
            blockExplorerUrls: [ARC_TESTNET.explorerUrl],
          },
        ],
      });
    }

    setChainId(ARC_TESTNET.chainIdHex);
    setStatus("idle");
    setMessage("Arc testnet selected. Ready to send USDC.");
  }

  async function pay() {
    if (!window.ethereum) return;
    if (!account) {
      await connectWallet();
      return;
    }
    if (!isArc) {
      await switchToArc();
      return;
    }

    try {
      setStatus("sending");
      setMessage(`Sending ${invoice.amount.toFixed(2)} ${invoice.currency} to ${shortAddress(invoice.recipient)}...`);

      const hash = (await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: account,
            to: ARC_USDC.address,
            data: buildTransferCalldata(invoice.recipient, invoice.amount),
          },
        ],
      })) as string;

      setTxHash(hash);
      setStatus("confirming");
      setMessage("Transaction submitted. Waiting for Arc finality...");

      for (let i = 0; i < 20; i += 1) {
        const receipt = (await window.ethereum.request({
          method: "eth_getTransactionReceipt",
          params: [hash],
        })) as { status?: string } | null;

        if (receipt?.status === "0x1") {
          window.localStorage.setItem(txStatusKey(invoice.id), hash);
          setStatus("paid");
          setMessage("Payment confirmed. Invoice marked paid.");
          return;
        }
        if (receipt?.status === "0x0") throw new Error("Transaction reverted");
        await new Promise((resolve) => window.setTimeout(resolve, 800));
      }

      setStatus("confirming");
      setMessage("Transaction submitted but receipt is still pending. Check explorer.");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Payment cancelled or failed.";
      setStatus("error");
      setMessage(reason);
    }
  }

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
        <div className="flex items-center justify-between gap-4">
          <span>Wallet</span>
          <span className="font-mono text-zinc-100">{account ? shortAddress(account) : "Not connected"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <span>Network</span>
          <span className={isArc ? "text-emerald-300" : "text-amber-300"}>{isArc ? ARC_TESTNET.name : chainId || "Unknown"}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={account ? (isArc ? pay : switchToArc) : connectWallet}
        disabled={["connecting", "switching", "sending", "confirming"].includes(status)}
        className="w-full rounded-2xl bg-emerald-400 py-4 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {!account
          ? "Connect wallet"
          : !isArc
            ? "Switch to Arc testnet"
            : status === "paid"
              ? "Paid"
              : status === "sending" || status === "confirming"
                ? "Processing..."
                : "Pay with wallet"}
      </button>

      <p className={`text-center text-sm ${status === "error" ? "text-red-300" : status === "paid" ? "text-emerald-300" : "text-zinc-500"}`}>{message}</p>
      {explorerTx ? (
        <a className="block text-center text-sm text-sky-300 hover:text-sky-200" href={explorerTx} target="_blank" rel="noreferrer">
          View transaction on Arcscan
        </a>
      ) : null}
    </div>
  );
}
