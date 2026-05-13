"use client";

import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { type ReactNode } from "react";

// Arc Testnet chain definition
const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
} as const;

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

const metadata = {
  name: "TakPay",
  description: "Crosschain invoices on Arc",
  url: "https://takpay.vercel.app",
  icons: ["https://takpay.vercel.app/favicon.ico"],
};

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [arcTestnet],
});

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [arcTestnet],
  metadata,
  features: {
    analytics: false,
  },
});

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
