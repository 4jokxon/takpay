import { ARC_TESTNET, ARC_USDC, type Invoice } from "@/lib/invoices";

const TRANSFER_SELECTOR = "0xa9059cbb";

type RpcResponse<T> = { result?: T; error?: { message?: string } };
type RpcTx = {
  hash: string;
  chainId?: string;
  from: string;
  to: string | null;
  input: string;
  blockNumber: string | null;
};
type RpcReceipt = {
  transactionHash: string;
  status: string;
  to: string | null;
  blockNumber: string | null;
};

async function rpc<T>(method: string, params: unknown[]): Promise<T | null> {
  const response = await fetch(ARC_TESTNET.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Arc RPC ${method} failed with HTTP ${response.status}`);
  const body = (await response.json()) as RpcResponse<T | null>;
  if (body.error) throw new Error(body.error.message ?? `Arc RPC ${method} error`);
  return body.result ?? null;
}

function normalize(value: string) {
  return value.toLowerCase();
}

function expectedAmountUnits(amount: number) {
  return BigInt(Math.round(amount * 10 ** ARC_USDC.decimals));
}

function decodeTransferInput(input: string) {
  const clean = input.toLowerCase();
  if (!clean.startsWith(TRANSFER_SELECTOR)) throw new Error("Transaction is not an ERC-20 transfer call.");

  const recipientWord = clean.slice(10, 74);
  const amountWord = clean.slice(74, 138);
  if (recipientWord.length !== 64 || amountWord.length !== 64) throw new Error("Malformed ERC-20 transfer calldata.");

  return {
    recipient: `0x${recipientWord.slice(24)}`,
    amountUnits: BigInt(`0x${amountWord}`),
  };
}

export async function verifyArcPayment(invoice: Invoice, txHash: string) {
  const [tx, receipt] = await Promise.all([
    rpc<RpcTx>("eth_getTransactionByHash", [txHash]),
    rpc<RpcReceipt>("eth_getTransactionReceipt", [txHash]),
  ]);

  if (!tx) return { ok: false as const, status: "missing", reason: "Transaction was not found on Arc RPC yet." };
  if (!receipt) return { ok: false as const, status: "pending", reason: "Transaction receipt is still pending." };
  if (receipt.status !== "0x1") return { ok: false as const, status: "failed", reason: "Transaction receipt status is failed." };

  const txTo = tx.to ? normalize(tx.to) : "";
  const receiptTo = receipt.to ? normalize(receipt.to) : "";
  const usdc = normalize(ARC_USDC.address);

  if (txTo !== usdc || receiptTo !== usdc) {
    return { ok: false as const, status: "invalid", reason: "Transaction did not interact with Arc USDC contract." };
  }

  const decoded = decodeTransferInput(tx.input);
  if (normalize(decoded.recipient) !== normalize(invoice.recipient)) {
    return { ok: false as const, status: "invalid", reason: "Transaction recipient does not match invoice recipient." };
  }

  const expected = expectedAmountUnits(invoice.amount);
  if (decoded.amountUnits < expected) {
    return { ok: false as const, status: "invalid", reason: `Transaction amount is too small. Expected at least ${expected.toString()} USDC base units.` };
  }

  return {
    ok: true as const,
    status: "paid" as const,
    txHash,
    from: tx.from,
    recipient: decoded.recipient,
    amountUnits: decoded.amountUnits.toString(),
    blockNumber: receipt.blockNumber,
  };
}
