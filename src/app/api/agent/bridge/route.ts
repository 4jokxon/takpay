import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedMerchant } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase";
import { selectRoute, prepareBridgeConfig, SUPPORTED_CHAINS, type SupportedChainKey } from "@/lib/cctp";

// POST /api/agent/bridge - Prepare a cross-chain transfer
// Returns the config needed for the client to execute via BridgeKit
export async function POST(request: NextRequest) {
  const merchant = await getAuthenticatedMerchant(request);
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { refundRequestId, destinationChain, recipientAddress, amount } = body;

  // Validate inputs
  if (!refundRequestId || !destinationChain || !recipientAddress || !amount) {
    return NextResponse.json(
      { error: "refundRequestId, destinationChain, recipientAddress, and amount are required" },
      { status: 400 }
    );
  }

  if (!SUPPORTED_CHAINS[destinationChain as SupportedChainKey]) {
    return NextResponse.json(
      { error: `Unsupported chain: ${destinationChain}. Supported: ${Object.keys(SUPPORTED_CHAINS).join(", ")}` },
      { status: 400 }
    );
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
    return NextResponse.json({ error: "Invalid recipient address" }, { status: 400 });
  }

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // Verify refund request exists and belongs to merchant
  const { data: refund } = await getSupabaseServer()
    .from("refund_requests")
    .select("id, status, invoice_id, amount")
    .eq("id", refundRequestId)
    .eq("merchant_id", merchant.id)
    .single();

  if (!refund) {
    return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
  }

  if (refund.status !== "approved") {
    return NextResponse.json(
      { error: `Refund must be approved before bridging. Current status: ${refund.status}` },
      { status: 400 }
    );
  }

  // Get route recommendation from agent
  const route = selectRoute(numAmount, destinationChain as SupportedChainKey);

  // Prepare bridge config for client-side execution
  const bridgeConfig = prepareBridgeConfig(
    numAmount,
    destinationChain as SupportedChainKey,
    recipientAddress
  );

  // Update refund request status to processing
  await getSupabaseServer()
    .from("refund_requests")
    .update({ status: "processing" })
    .eq("id", refundRequestId);

  return NextResponse.json({
    route,
    bridgeConfig,
    refundRequestId,
    message: route.route === "direct_arc"
      ? "Direct Arc transfer. Execute from your wallet."
      : "Cross-chain bridge prepared. Sign the transaction from your wallet to initiate CCTP transfer.",
  });
}

// PATCH /api/agent/bridge - Update transfer status after client execution
export async function PATCH(request: NextRequest) {
  const merchant = await getAuthenticatedMerchant(request);
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { refundRequestId, txHash, status } = body;

  if (!refundRequestId || !status) {
    return NextResponse.json({ error: "refundRequestId and status are required" }, { status: 400 });
  }

  const validStatuses = ["completed", "failed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be: ${validStatuses.join(", ")}` }, { status: 400 });
  }

  // Verify ownership
  const { data: refund } = await getSupabaseServer()
    .from("refund_requests")
    .select("id, merchant_id")
    .eq("id", refundRequestId)
    .eq("merchant_id", merchant.id)
    .single();

  if (!refund) {
    return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
  }

  // Update refund status
  const updates: Record<string, unknown> = {
    status,
    processed_at: new Date().toISOString(),
  };

  if (txHash) {
    updates.refund_tx_hash = txHash;
  }

  await getSupabaseServer()
    .from("refund_requests")
    .update(updates)
    .eq("id", refundRequestId);

  return NextResponse.json({
    message: `Refund ${status === "completed" ? "completed successfully" : "failed"}`,
    refundRequestId,
    txHash,
  });
}
