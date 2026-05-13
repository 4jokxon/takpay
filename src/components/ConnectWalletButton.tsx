"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@/components/WalletProvider";

export function ConnectWalletButton({ className = "", redirectTo }: { className?: string; redirectTo?: string }) {
  const { connect, isConnected, address } = useWallet();
  const router = useRouter();
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");

  async function registerWallet(walletAddress: string) {
    setRegistering(true);
    try {
      await fetch("/api/merchants/wallet-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
    } catch {
      // Non-critical — dashboard will retry
    } finally {
      setRegistering(false);
    }
    if (redirectTo) {
      // Force full page reload to re-trigger useEffect with new wallet state
      window.location.href = redirectTo;
    }
  }

  async function handleConnect() {
    setError("");

    // Already connected — just register and redirect
    if (isConnected && address) {
      await registerWallet(address);
      return;
    }

    // Check if ethereum provider exists
    const eth = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!eth) {
      setError("No wallet detected. Install MetaMask or use a Web3 browser.");
      return;
    }

    try {
      await connect();
      // Small delay to let WalletProvider state update
      await new Promise((r) => setTimeout(r, 300));

      const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
      if (accounts.length === 0) {
        setError("Connection cancelled. Please try again.");
        return;
      }

      await registerWallet(accounts[0]);
    } catch {
      setError("Connection failed. Please try again.");
    }
  }

  if (registering) {
    return (
      <button disabled className={`rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black opacity-50 ${className}`}>
        Connecting...
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button onClick={handleConnect} className={`rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black transition hover:bg-emerald-300 ${className}`}>
        {isConnected ? "Open Dashboard" : "Connect Wallet"}
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
