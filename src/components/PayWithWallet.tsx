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

function buildBalanceOfCalldata(account: string) {
  return `0x70a08231${padAddress(account)}`;
}

function formatUsdc(units: bigint) {
  const divisor = BigInt(10 ** ARC_USDC.decimals);
  const whole = units / divisor;
  const fraction = units % divisor;
  const fractionText = fraction.toString().padStart(ARC_USDC.decimals, "0").replace(/0+$/, "");
  return fractionText ? `${whole}.${fractionText}` : whole.toString();
}

function humanWalletError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "Payment cancelled or failed.");
  if (message.toLowerCase().includes("user rejected")) return "Payment cancelled in wallet.";
  if (message.toLowerCase().includes("exceeds balance")) return "Insufficient USDC balance for this invoice.";
  if (message.toLowerCase().includes("reverted")) return "Transaction reverted. Check USDC balance and recipient details.";
  return message;
}

function txStatusKey(invoiceId: string) {
  return `takpay:${invoiceId}:paidTx`;
}

export function PayWithWallet({ invoice }: { invoice: Invoice }) {
  const [account, setAccount] = useState<string>("");
  const [chainId, setChainId] = useState<string>("");
  const [balance, setBalance] = useState<bigint | null>(null);
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
      setBalance(null);
    };
    const handleChainChanged = (nextChainId: unknown) => {
      if (typeof nextChainId === "string") setChainId(nextChainId);
      setBalance(null);
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

  async function refreshBalance(nextAccount = account) {
    if (!window.ethereum || !nextAccount || !isArc) {
      setBalance(null);
      return null;
    }

    const result = (await window.ethereum.request({
      method: "eth_call",
      params: [
        {
          to: ARC_USDC.address,
          data: buildBalanceOfCalldata(nextAccount),
        },
        "latest",
      ],
    })) as string;

    const nextBalance = BigInt(result);
    setBalance(nextBalance);
    return nextBalance;
  }

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
    setMessage(currentChain.toLowerCase() === ARC_TESTNET.chainIdHex ? "Wallet connected. Ready to check balance and pay." : "Wallet connected. Switch to Arc testnet to continue.");
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

  useEffect(() => {
    if (!account || !isArc || !window.ethereum) return;

    let cancelled = false;
    void (async () => {
      try {
        const result = (await window.ethereum?.request({
          method: "eth_call",
          params: [
            {
              to: ARC_USDC.address,
              data: buildBalanceOfCalldata(account),
            },
            "latest",
          ],
        })) as string | undefined;
        if (!cancelled && result) setBalance(BigInt(result));
      } catch {
        if (!cancelled) setBalance(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account, isArc]);

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
      setMessage("Checking USDC balance...");
      const currentBalance = await refreshBalance(account);
      const requiredAmount = amountToUsdcUnits(invoice.amount);

      if (currentBalance !== null && currentBalance < requiredAmount) {
        setStatus("error");
        setMessage(`Insufficient USDC balance. Need ${invoice.amount.toFixed(2)} USDC, you have ${formatUsdc(currentBalance)} USDC.`);
        return;
      }

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
          await fetch(`/api/invoices/${invoice.id}/pay`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ txHash: hash }),
          }).catch(() => null);
          setStatus("paid");
          setMessage("Payment confirmed. Invoice marked paid.");
          return;
        }
        if (receipt?.status === "0x0") throw new Error("Transaction reverted. The most common cause is insufficient ERC-20 USDC balance.");
        await new Promise((resolve) => window.setTimeout(resolve, 800));
      }

      setStatus("confirming");
      setMessage("Transaction submitted but receipt is still pending. Check explorer.");
    } catch (error) {
      setStatus("error");
      setMessage(humanWalletError(error));
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
        <div className="mt-2 flex items-center justify-between gap-4">
          <span>USDC balance</span>
          <span className="font-mono text-zinc-100">{balance === null ? "—" : `${formatUsdc(balance)} USDC`}</span>
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
