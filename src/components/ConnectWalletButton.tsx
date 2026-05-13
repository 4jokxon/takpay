"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@/components/WalletProvider";

export function ConnectWalletButton({ className = "" }: { className?: string }) {
  const { connect, isConnected, address } = useWallet();
  const router = useRouter();
  const [registering, setRegistering] = useState(false);

  async function handleConnect() {
    if (isConnected && address) {
      // Already connected, go to dashboard
      router.push("/dashboard");
      return;
    }

    await connect();

    // After connect, get the address from ethereum
    const eth = (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<unknown> } }).ethereum;
    if (!eth) return;

    const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
    if (accounts.length === 0) return;

    const walletAddress = accounts[0];
    setRegistering(true);

    try {
      await fetch("/api/merchants/wallet-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    } finally {
      setRegistering(false);
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
    <button onClick={handleConnect} className={`rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black transition hover:bg-emerald-300 ${className}`}>
      {isConnected ? "Open Dashboard" : "Connect Wallet"}
    </button>
  );
}
