"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ConnectWalletButton({ className = "" }: { className?: string }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const router = useRouter();
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (isConnected && address && !registering) {
      // Auto-register merchant profile if wallet connected
      setRegistering(true);
      registerWalletMerchant(address).then(() => {
        router.push("/dashboard");
      }).catch(() => {
        // If registration fails (already exists), still go to dashboard
        router.push("/dashboard");
      }).finally(() => setRegistering(false));
    }
  }, [isConnected, address, router, registering]);

  function handleConnect() {
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
    <button onClick={handleConnect} className={`rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black transition hover:bg-emerald-300 ${className}`}>
      Connect Wallet
    </button>
  );
}

async function registerWalletMerchant(walletAddress: string) {
  const res = await fetch("/api/merchants/wallet-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  if (!res.ok) {
    const data = await res.json();
    // "already_exists" is fine — means merchant already registered
    if (data.code !== "already_exists") {
      throw new Error(data.error || "Registration failed");
    }
  }
  return res.json();
}
