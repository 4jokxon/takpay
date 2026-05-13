import { NextRequest, NextResponse } from "next/server";
import { getInvoice, markInvoiceSubmitted, markInvoicePaid } from "@/lib/db-invoices";
import { ARC_TESTNET } from "@/lib/invoices";

// Verify a transaction on-chain and mark invoice as paid
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { txHash } = body;

  if (!txHash || !txHash.startsWith("0x")) {
    return NextResponse.json({ error: "Invalid transaction hash" }, { status: 400 });
  }

  const invoice = await getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json({ message: "Already paid", invoice });
  }

  if (invoice.status === "expired") {
    return NextResponse.json({ error: "Invoice expired" }, { status: 400 });
  }

  // Fetch transaction from Arc RPC
  let tx: { from?: string; to?: string; input?: string; value?: string; blockNumber?: string } | null = null;
  try {
    const res = await fetch(ARC_TESTNET.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionByHash", params: [txHash] }),
    });
    const json = await res.json();
    tx = json.result ?? null;
  } catch {
    return NextResponse.json({ error: "Failed to fetch transaction from RPC" }, { status: 502 });
  }

  if (!tx) {
    return NextResponse.json({ error: "Transaction not found on-chain. It may still be pending." }, { status: 404 });
  }

  // Check if tx is confirmed (has blockNumber)
  if (!tx.blockNumber) {
    // Mark as submitted but not yet confirmed
    await markInvoiceSubmitted(id, txHash);
    return NextResponse.json({ message: "Transaction pending confirmation", status: "submitted" });
  }

  // Verify recipient matches (check `to` field or parse ERC20 transfer input)
  const recipientLower = invoice.recipient.toLowerCase();
  let verified = false;

  // Case 1: Direct transfer (native token)
  if (tx.to?.toLowerCase() === recipientLower) {
    verified = true;
  }

  // Case 2: ERC20 transfer (to is token contract, recipient is in input data)
  if (!verified && tx.input && tx.input.length >= 138) {
    // ERC20 transfer(address,uint256) selector: 0xa9059cbb
    const selector = tx.input.slice(0, 10);
    if (selector === "0xa9059cbb") {
      const toAddress = "0x" + tx.input.slice(34, 74);
      if (toAddress.toLowerCase() === recipientLower) {
        verified = true;
      }
    }
  }

  if (!verified) {
    return NextResponse.json({ 
      error: "Transaction recipient does not match invoice. Expected: " + invoice.recipient,
      txTo: tx.to,
    }, { status: 400 });
  }

  // Mark as paid
  await markInvoicePaid(id, txHash);

  return NextResponse.json({ message: "Payment verified", status: "paid" });
}
