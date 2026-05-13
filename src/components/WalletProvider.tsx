"use client";

import { type ReactNode } from "react";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const WALLET_STORAGE_KEY = "takpay_wallet_address";

type WalletContextType = {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

function getEthereum() {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  // On mount: check localStorage first, then verify with MetaMask
  useEffect(() => {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (stored) {
      setAddress(stored);
      // Verify it's still connected (non-blocking)
      const eth = getEthereum();
      if (eth) {
        eth.request({ method: "eth_accounts" }).then((accounts) => {
          const accs = accounts as string[];
          if (accs.length > 0) {
            // Update to current account (might have switched)
            const current = accs[0].toLowerCase();
            if (current !== stored.toLowerCase()) {
              setAddress(current);
              localStorage.setItem(WALLET_STORAGE_KEY, current);
            }
          }
          // If no accounts, keep stored address — user might just need to unlock MetaMask
        }).catch(() => {});
      }
    } else {
      // No stored address, try passive check
      const eth = getEthereum();
      if (eth) {
        eth.request({ method: "eth_accounts" }).then((accounts) => {
          const accs = accounts as string[];
          if (accs.length > 0) {
            setAddress(accs[0]);
            localStorage.setItem(WALLET_STORAGE_KEY, accs[0]);
          }
        }).catch(() => {});
      }
    }
  }, []);

  const connect = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    if (accounts.length > 0) {
      setAddress(accounts[0]);
      localStorage.setItem(WALLET_STORAGE_KEY, accounts[0]);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem(WALLET_STORAGE_KEY);
  }, []);

  return (
    <WalletContext.Provider value={{ address, isConnected: !!address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}
