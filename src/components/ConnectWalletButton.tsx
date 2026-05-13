"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConnectWalletButton({ className = "" }: { className?: string }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const router = useRouter();
  const [registering, setRegistering] = useState(false);

  async function handleClick() {
    if (isConnected && address) {
      // Already connected — register and go to dashboard
      setRegistering(true);
      try {
        await fetch("/api/merchants/wallet-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: address }),
        });
      } catch {
        // Non-critical
      }
      setRegistering(false);
      router.push("/dashboard");
      return;
    }
    // Open Reown AppKit modal
    open();
  }

  if (registering) {
    return (
      <button disabled className={`rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black opacity-50 ${className}`}>
        Connecting...
      </button>
    );
  }

  return (
    <button onClick={handleClick} className={`rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black transition hover:bg-emerald-300 ${className}`}>
      {isConnected ? "Open Dashboard" : "Connect Wallet"}
    </button>
  );
}
