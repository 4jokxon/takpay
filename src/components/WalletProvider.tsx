"use client";

import { type ReactNode } from "react";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

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

  // Check if already connected on mount
  useEffect(() => {
    const eth = getEthereum();
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((accounts) => {
      const accs = accounts as string[];
      if (accs.length > 0) setAddress(accs[0]);
    }).catch(() => {});
  }, []);

  const connect = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    if (accounts.length > 0) setAddress(accounts[0]);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider value={{ address, isConnected: !!address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}
