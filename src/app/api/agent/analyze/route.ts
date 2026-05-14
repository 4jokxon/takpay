import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedMerchant } from "@/lib/auth";
import { analyzeFraud, updateAgentMetrics } from "@/lib/agent";
import { getInvoice } from "@/lib/db-invoices";

// POST /api/agent/analyze
// Run fraud analysis on a payment/invoice
export async function POST(request: NextRequest) {
  const merchant = await getAuthenticatedMerchant(request);
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { invoiceId, payerWallet, txHash } = body;

  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
  }

  // Get invoice details
  const invoice = await getInvoice(invoiceId);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Verify invoice belongs to this merchant
  if (invoice.merchantId && invoice.merchantId !== merchant.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Run fraud analysis
  const result = await analyzeFraud({
    invoiceId,
    amount: invoice.amount,
    currency: invoice.currency,
    payerWallet: payerWallet || "unknown",
    recipientWallet: invoice.recipient,
    txHash: txHash || "",
    merchantId: merchant.id,
  });

  // Update daily metrics
  await updateAgentMetrics(merchant.id, result.decision, result.riskScore, 0);

  return NextResponse.json({
    analysis: {
      invoiceId,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      decision: result.decision,
      reasoning: result.reasoning,
      flags: result.flags,
      confidence: result.confidence,
    },
  });
}
