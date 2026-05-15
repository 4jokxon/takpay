import { NextRequest, NextResponse } from "next/server";
import { getInvoice, markInvoiceSubmitted, markInvoicePaid } from "@/lib/db-invoices";
import { ARC_TESTNET, ARC_USDC } from "@/lib/invoices";
import { sendWebhook } from "@/lib/webhook";
import { getSupabaseServer } from "@/lib/supabase";
import { analyzeFraud, updateAgentMetrics } from "@/lib/agent";
import { transferToMerchant } from "@/lib/circle-wallet";

// Known USDC/EURC contract addresses on Arc Testnet
const VALID_TOKEN_CONTRACTS: Record<string, string[]> = {
  USDC: [ARC_USDC?.address?.toLowerCase?.() || ""].filter(Boolean),
  EURC: [], // Add EURC contract when available
};

// Verify a transaction on-chain and mark invoice as paid
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { txHash } = body;

  // Validate tx hash format (must be 66 chars: 0x + 64 hex)
  if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return NextResponse.json({ error: "Invalid transaction hash format" }, { status: 400 });
  }

  const invoice = await getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json({ message: "Already paid" });
  }

  if (invoice.status === "expired") {
    return NextResponse.json({ error: "Invoice expired" }, { status: 400 });
  }

  // FIX: Check if this txHash is already used by another invoice (replay prevention)
  const { data: existingInvoice } = await getSupabaseServer()
    .from("invoices")
    .select("id")
    .eq("paid_tx_hash", txHash)
    .neq("id", id)
    .limit(1)
    .single();

  if (existingInvoice) {
    return NextResponse.json({ error: "This transaction has already been used for another invoice" }, { status: 400 });
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
    return NextResponse.json({ error: "Failed to verify transaction" }, { status: 502 });
  }

  if (!tx) {
    return NextResponse.json({ error: "Transaction not found on-chain" }, { status: 404 });
  }

  // Check if tx is confirmed (has blockNumber)
  if (!tx.blockNumber) {
    await markInvoiceSubmitted(id, txHash);
    return NextResponse.json({ message: "Transaction pending confirmation", status: "submitted" });
  }

  // Verify recipient and amount
  const recipientLower = invoice.recipient.toLowerCase();
  let verified = false;
  let verifiedAmount = 0;

  // Case 1: Direct native transfer
  if (tx.to?.toLowerCase() === recipientLower && tx.value) {
    verified = true;
    // Convert hex wei to number (Arc uses 18 decimals for native USDC)
    verifiedAmount = Number(BigInt(tx.value) * BigInt(1000000) / BigInt("1000000000000000000")) / 1e6;
  }

  // Case 2: ERC20 transfer(address,uint256) - selector 0xa9059cbb
  if (!verified && tx.input && tx.input.length >= 138) {
    const selector = tx.input.slice(0, 10);
    if (selector === "0xa9059cbb") {
      const toAddress = "0x" + tx.input.slice(34, 74);
      if (toAddress.toLowerCase() === recipientLower) {
        // FIX: Verify token contract is legit
        const tokenContract = tx.to?.toLowerCase() || "";
        const validContracts = VALID_TOKEN_CONTRACTS[invoice.currency] || [];
        
        // If we have known contracts, verify. If empty list (not configured), allow any.
        if (validContracts.length === 0 || validContracts.includes(tokenContract)) {
          verified = true;
          // Parse amount from calldata (uint256, 6 decimals for USDC/EURC)
          const amountHex = "0x" + tx.input.slice(74, 138);
          verifiedAmount = Number(BigInt(amountHex)) / 1e6;
        } else {
          return NextResponse.json({ error: "Unrecognized token contract" }, { status: 400 });
        }
      }
    }
  }

  if (!verified) {
    return NextResponse.json({ error: "Transaction recipient does not match invoice" }, { status: 400 });
  }

  // FIX: Verify amount (allow small tolerance for rounding, but must be >= 99% of invoice amount)
  const minAcceptable = invoice.amount * 0.99;
  if (verifiedAmount < minAcceptable) {
    return NextResponse.json({ 
      error: `Amount too small. Invoice requires ${invoice.amount} ${invoice.currency}, transaction contains ${verifiedAmount.toFixed(6)}` 
    }, { status: 400 });
  }

  // AI Agent: Run fraud analysis (non-blocking, best-effort)
  let fraudResult = null;
  try {
    fraudResult = await analyzeFraud({
      invoiceId: id,
      amount: invoice.amount,
      currency: invoice.currency,
      payerWallet: tx.from || "unknown",
      recipientWallet: invoice.recipient,
      txHash,
      merchantId: invoice.merchantId || undefined,
    });

    // If critical risk, block the payment
    if (fraudResult.decision === "reject") {
      return NextResponse.json({
        error: "Payment flagged by fraud detection agent",
        riskScore: fraudResult.riskScore,
        reasoning: fraudResult.reasoning,
      }, { status: 403 });
    }

    // Update metrics if merchant exists
    if (invoice.merchantId) {
      updateAgentMetrics(invoice.merchantId, fraudResult.decision, fraudResult.riskScore, 0);
    }
  } catch {
    // Don't block payment if agent fails
  }

  // FIX: Atomic update with status check (race condition prevention)
  const { data: updated, error: updateError } = await getSupabaseServer()
    .from("invoices")
    .update({ 
      status: "paid", 
      paid_tx_hash: txHash, 
      paid_at: new Date().toISOString() 
    })
    .eq("id", id)
    .in("status", ["pending", "submitted"])
    .select("id")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Invoice already processed or not found" }, { status: 409 });
  }

  // Send webhook notification (best-effort, non-blocking)
  if (invoice.merchantId) {
    sendWebhook(invoice.merchantId, {
      event: "invoice.paid",
      invoice_id: id,
      amount: invoice.amount,
      currency: invoice.currency,
      memo: invoice.memo,
      recipient: invoice.recipient,
      tx_hash: txHash,
      paid_at: new Date().toISOString(),
    });
  }

  // Auto-settle: transfer USDC from TakPay pool to merchant wallet (best-effort)
  let settlement = null;
  if (invoice.merchantWallet) {
    try {
      settlement = await transferToMerchant({
        destinationAddress: invoice.merchantWallet,
        amount: invoice.amount.toString(),
      });
    } catch (err) {
      // Log settlement errors - don't block payment confirmation
      console.error("[settlement-error]", id, err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ message: "Payment verified", status: "paid", settlement });
}
