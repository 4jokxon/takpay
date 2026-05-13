"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@/components/WalletProvider";

export function ConnectWalletButton({ className = "" }: { className?: string }) {
  const { connect, isConnected, address } = useWallet();
  const router = useRouter();
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    setError("");

    if (isConnected && address) {
      // Already connected, register/auth and go to dashboard
      setRegistering(true);
      try {
        await fetch("/api/merchants/wallet-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: address }),
        });
        router.push("/dashboard");
        router.refresh();
      } catch {
        router.push("/dashboard");
      } finally {
        setRegistering(false);
      }
      return;
    }

    // Check if ethereum provider exists
    const eth = (window as unknown as { ethereum?: unknown }).ethereum;
    if (!eth) {
      setError("No wallet detected. Install MetaMask or use a Web3 browser.");
      return;
    }

    try {
      await connect();

      // After connect, get the address
      const accounts = (await (eth as { request: (args: { method: string }) => Promise<unknown> }).request({ method: "eth_accounts" })) as string[];
      if (accounts.length === 0) {
        setError("Connection cancelled. Please try again.");
        return;
      }

      const walletAddress = accounts[0];
      setRegistering(true);

      await fetch("/api/merchants/wallet-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Connection failed. Please try again.");
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
    <div className="flex flex-col items-center gap-2">
      <button onClick={handleConnect} className={`rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black transition hover:bg-emerald-300 ${className}`}>
        {isConnected ? "Open Dashboard" : "Connect Wallet"}
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
