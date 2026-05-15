import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedMerchant } from "@/lib/auth";
import { analyzeRefund, optimizeRouting, updateAgentMetrics } from "@/lib/agent";
import { getInvoice } from "@/lib/db-invoices";
import { getSupabaseServer } from "@/lib/supabase";

// POST /api/agent/refund
// Request a refund - agent decides whether to auto-approve
export async function POST(request: NextRequest) {
  const merchant = await getAuthenticatedMerchant(request);
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { invoiceId, reason, destinationChain, destinationWallet } = body;

  if (!invoiceId || !reason) {
    return NextResponse.json({ error: "invoiceId and reason are required" }, { status: 400 });
  }

  // Get invoice
  const invoice = await getInvoice(invoiceId);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Must be paid to refund
  if (invoice.status !== "paid") {
    return NextResponse.json({ error: "Only paid invoices can be refunded" }, { status: 400 });
  }

  // Verify ownership - must have merchantId
  if (!invoice.merchantId || invoice.merchantId !== merchant.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Run refund decision engine
  const refundResult = await analyzeRefund({
    invoiceId,
    amount: invoice.amount,
    currency: invoice.currency,
    reason,
    requesterWallet: merchant.wallet_address,
    merchantId: merchant.id,
    originalPaidAt: invoice.paidAt || null,
    destinationChain: destinationChain || "arc",
  });

  // Get routing recommendation
  const routing = optimizeRouting({
    amount: invoice.amount,
    currency: invoice.currency,
    sourceChain: "arc",
    destinationChain: destinationChain || "arc",
  });

  // Create refund request record
  const { data: refundRequest, error } = await getSupabaseServer()
    .from("refund_requests")
    .insert({
      invoice_id: invoiceId,
      merchant_id: merchant.id,
      requester_wallet: merchant.wallet_address,
      amount: invoice.amount,
      currency: invoice.currency,
      reason,
      status: refundResult.decision === "approve" ? "approved" : "pending",
      destination_chain: destinationChain || "arc",
      destination_wallet: destinationWallet || invoice.recipient,
    })
    .select("id, status, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create refund request" }, { status: 500 });
  }

  // Update metrics
  await updateAgentMetrics(merchant.id, refundResult.decision, refundResult.riskScore, 0);

  return NextResponse.json({
    refund: {
      id: refundRequest.id,
      status: refundRequest.status,
      createdAt: refundRequest.created_at,
    },
    agentDecision: {
      decision: refundResult.decision,
      riskScore: refundResult.riskScore,
      reasoning: refundResult.reasoning,
      confidence: refundResult.confidence,
      suggestedRoute: refundResult.suggestedRoute,
    },
    routing: {
      recommendedRoute: routing.recommendedRoute,
      estimatedFee: routing.estimatedFee,
      estimatedTime: routing.estimatedTime,
      reasoning: routing.reasoning,
    },
  });
}
