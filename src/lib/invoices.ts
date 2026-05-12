export type InvoiceStatus = "pending" | "paid" | "expired";

export type Invoice = {
  id: string;
  amount: number;
  currency: "USDC" | "EURC";
  memo: string;
  recipient: string;
  status: InvoiceStatus;
  createdAt: string;
};

export const ARC_TESTNET = {
  name: "Arc Testnet",
  chainId: 5042002,
  chainIdHex: "0x4cef52",
  rpcUrl: "https://rpc.testnet.arc.network",
  explorerUrl: "https://testnet.arcscan.app",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
};

export const ARC_USDC = {
  address: "0x3600000000000000000000000000000000000000",
  decimals: 6,
};

export const demoInvoices: Invoice[] = [
  {
    id: "TK-1001",
    amount: 0.1,
    currency: "USDC",
    memo: "Testnet checkout demo",
    recipient: "0xcEe2244B58Af2C8ddCa97A4aED0b819C5Fcb6910",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "TK-1002",
    amount: 125,
    currency: "USDC",
    memo: "Frontend implementation milestone",
    recipient: "0xcEe2244B58Af2C8ddCa97A4aED0b819C5Fcb6910",
    status: "paid",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function shortAddress(address: string) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function invoiceUrl(id: string) {
  if (typeof window === "undefined") return `/pay/${id}`;
  return `${window.location.origin}/pay/${id}`;
}
