import { ARC_TESTNET } from "@/lib/invoices";

// ============================================================
// TakPay CCTP Integration - Cross-Chain Transfer Protocol
// ============================================================
// Uses Circle's BridgeKit for cross-chain USDC transfers.
// The actual signing happens client-side (merchant wallet),
// but routing decisions and tracking happen server-side.
// ============================================================

// Supported destination chains for cross-chain refunds
export const SUPPORTED_CHAINS = {
  arc: {
    name: "Arc Testnet",
    chainId: 5042002,
    rpcUrl: ARC_TESTNET.rpcUrl,
    bridgeKitChain: "ArcTestnet",
    isNative: true,
  },
  ethereum_sepolia: {
    name: "Ethereum Sepolia",
    chainId: 11155111,
    rpcUrl: "https://rpc.sepolia.org",
    bridgeKitChain: "EthereumSepolia",
    isNative: false,
  },
  base_sepolia: {
    name: "Base Sepolia",
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    bridgeKitChain: "BaseSepolia",
    isNative: false,
  },
  arbitrum_sepolia: {
    name: "Arbitrum Sepolia",
    chainId: 421614,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    bridgeKitChain: "ArbitrumSepolia",
    isNative: false,
  },
  polygon_amoy: {
    name: "Polygon Amoy",
    chainId: 80002,
    rpcUrl: "https://rpc-amoy.polygon.technology",
    bridgeKitChain: "PolygonAmoy",
    isNative: false,
  },
} as const;

export type SupportedChainKey = keyof typeof SUPPORTED_CHAINS;

// CCTP Transfer status tracking
export type CCTPTransferStatus =
  | "preparing"      // Agent is preparing the transfer
  | "awaiting_sign"  // Waiting for merchant to sign
  | "burning"        // USDC being burned on source chain
  | "attesting"      // Waiting for Circle attestation
  | "minting"        // USDC being minted on destination
  | "completed"      // Transfer complete
  | "failed";        // Transfer failed

export interface CCTPTransferRecord {
  id: string;
  refundRequestId: string;
  sourceChain: SupportedChainKey;
  destinationChain: SupportedChainKey;
  amount: string;
  recipientAddress: string;
  status: CCTPTransferStatus;
  burnTxHash?: string;
  mintTxHash?: string;
  attestationHash?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// ============================================================
// Route Selection Logic (server-side)
// ============================================================

export interface RouteRecommendation {
  route: "direct_arc" | "cctp_bridge" | "nanopayment";
  sourceChain: SupportedChainKey;
  destinationChain: SupportedChainKey;
  estimatedFee: string;
  estimatedTime: string;
  useForwarder: boolean;
  reasoning: string;
}

export function selectRoute(
  amount: number,
  destinationChain: SupportedChainKey
): RouteRecommendation {
  // Same-chain: direct transfer on Arc
  if (destinationChain === "arc") {
    // Nanopayments for tiny amounts
    if (amount < 0.01) {
      return {
        route: "nanopayment",
        sourceChain: "arc",
        destinationChain: "arc",
        estimatedFee: "0",
        estimatedTime: "< 1 second",
        useForwarder: false,
        reasoning: "Micro-amount: using Arc nanopayments (gas-free batched transfer).",
      };
    }
    return {
      route: "direct_arc",
      sourceChain: "arc",
      destinationChain: "arc",
      estimatedFee: "0.01",
      estimatedTime: "< 1 second",
      useForwarder: false,
      reasoning: "Same-chain transfer on Arc. Sub-second finality, minimal fee.",
    };
  }

  // Cross-chain: CCTP bridge
  // Use forwarder for smaller amounts (Circle relayer handles mint)
  const useForwarder = amount < 100;

  return {
    route: "cctp_bridge",
    sourceChain: "arc",
    destinationChain,
    estimatedFee: useForwarder ? "0.05" : "0.02",
    estimatedTime: useForwarder ? "~1-2 minutes" : "~2-5 minutes",
    useForwarder,
    reasoning: `Cross-chain via CCTP to ${SUPPORTED_CHAINS[destinationChain].name}. ${
      useForwarder
        ? "Using Circle Forwarder for automatic mint (relay fee deducted)."
        : "Manual attestation + mint for lower fees."
    }`,
  };
}

// ============================================================
// Client-side BridgeKit config generator
// ============================================================
// Returns the config needed for the frontend to execute the bridge

export interface BridgeExecutionConfig {
  sourceChain: string;
  destinationChain: string;
  amount: string;
  recipientAddress: string;
  useForwarder: boolean;
  transferSpeed: "FAST" | "SLOW";
  token: "USDC";
}

export function prepareBridgeConfig(
  amount: number,
  destinationChain: SupportedChainKey,
  recipientAddress: string
): BridgeExecutionConfig {
  const route = selectRoute(amount, destinationChain);
  const destChainInfo = SUPPORTED_CHAINS[destinationChain];

  return {
    sourceChain: "ArcTestnet",
    destinationChain: destChainInfo.bridgeKitChain,
    amount: amount.toString(),
    recipientAddress,
    useForwarder: route.useForwarder,
    transferSpeed: "FAST",
    token: "USDC",
  };
}
