import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

// ============================================================
// TakPay Circle Developer-Controlled Wallet Integration
// ============================================================
// This wallet acts as TakPay's settlement pool:
// - Receives USDC from payers (via on-chain transfer to wallet address)
// - Disburses to merchants on demand (payout)
// - Provides balance visibility for the agent dashboard
// ============================================================

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY!;
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET!;
const CIRCLE_WALLET_ID = process.env.CIRCLE_WALLET_ID!;
const CIRCLE_WALLET_ADDRESS = process.env.CIRCLE_WALLET_ADDRESS!;

function getClient() {
  return initiateDeveloperControlledWalletsClient({
    apiKey: CIRCLE_API_KEY,
    entitySecret: CIRCLE_ENTITY_SECRET,
  });
}

// ============================================================
// Balance
// ============================================================

export interface WalletBalance {
  token: string;
  amount: string;
  blockchain: string;
}

export async function getWalletBalance(): Promise<WalletBalance[]> {
  const client = getClient();
  const response = await client.getWalletTokenBalance({
    id: CIRCLE_WALLET_ID,
  });

  const balances = response.data?.tokenBalances ?? [];
  return balances.map((b) => ({
    token: b.token?.symbol ?? "UNKNOWN",
    amount: b.amount ?? "0",
    blockchain: b.token?.blockchain ?? "unknown",
  }));
}

// ============================================================
// Transfer (Payout to merchant)
// ============================================================

export interface TransferResult {
  id: string;
  state: string;
  amount: string;
  destinationAddress: string;
}

// Arc Testnet native USDC token ID (from Circle API)
const ARC_USDC_TOKEN_ID = "15dc2b5d-0994-58b0-bf8c-3a0501148ee8";

export async function transferToMerchant(input: {
  destinationAddress: string;
  amount: string; // decimal string e.g. "10.50"
}): Promise<TransferResult> {
  const client = getClient();

  // Use tokenId for native USDC on Arc Testnet
  const response = await client.createTransaction({
    walletId: CIRCLE_WALLET_ID,
    tokenId: ARC_USDC_TOKEN_ID,
    destinationAddress: input.destinationAddress,
    amount: [input.amount],
    fee: {
      type: "level",
      config: { feeLevel: "MEDIUM" as const },
    },
  } as Parameters<typeof client.createTransaction>[0]);

  const data = response.data;
  if (!data) {
    throw new Error("Failed to create transfer transaction");
  }

  return {
    id: data.id,
    state: data.state,
    amount: input.amount,
    destinationAddress: input.destinationAddress,
  };
}

// ============================================================
// Transaction Status
// ============================================================

export interface TransactionStatus {
  id: string;
  state: string;
  txHash?: string;
  createDate?: string;
  updateDate?: string;
}

export async function getTransactionStatus(txId: string): Promise<TransactionStatus> {
  const client = getClient();
  const response = await client.getTransaction({ id: txId });

  const tx = response.data?.transaction;
  if (!tx) {
    throw new Error(`Transaction ${txId} not found`);
  }

  return {
    id: tx.id ?? txId,
    state: tx.state ?? "UNKNOWN",
    txHash: tx.txHash ?? undefined,
    createDate: tx.createDate ?? undefined,
    updateDate: tx.updateDate ?? undefined,
  };
}

// ============================================================
// Wallet Info (exported constants)
// ============================================================

export const TAKPAY_WALLET = {
  id: CIRCLE_WALLET_ID,
  address: CIRCLE_WALLET_ADDRESS,
} as const;
