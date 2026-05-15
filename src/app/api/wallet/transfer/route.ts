import { NextRequest, NextResponse } from "next/server";
import { transferToMerchant } from "@/lib/circle-wallet";
import { getAuthenticatedMerchant } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  // Only authenticated merchants can request payouts
  const merchant = await getAuthenticatedMerchant(request);
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { amount, destinationAddress } = body;

  // Validate amount
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // Validate address
  if (!destinationAddress || !/^0x[a-fA-F0-9]{40}$/.test(destinationAddress)) {
    return NextResponse.json({ error: "Invalid destination address" }, { status: 400 });
  }

  // Balance check: merchant can only withdraw what they've earned
  // Sum of paid invoices for this merchant
  const { data: earnedData } = await getSupabaseServer()
    .from("invoices")
    .select("amount")
    .eq("merchant_id", merchant.id)
    .eq("status", "paid");

  const totalEarned = (earnedData ?? []).reduce((sum, inv) => sum + Number(inv.amount), 0);

  // Sum of previous payouts for this merchant
  const { data: payoutData } = await getSupabaseServer()
    .from("payouts")
    .select("amount")
    .eq("merchant_id", merchant.id)
    .in("status", ["initiated", "completed"]);

  const totalPaidOut = (payoutData ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  const availableBalance = totalEarned - totalPaidOut;

  if (numAmount > availableBalance) {
    return NextResponse.json({
      error: `Insufficient balance. Available: ${availableBalance.toFixed(2)} USDC, requested: ${numAmount}`,
      availableBalance,
    }, { status: 400 });
  }

  try {
    const result = await transferToMerchant({
      destinationAddress,
      amount: numAmount.toString(),
    });

    // Record payout
    await getSupabaseServer()
      .from("payouts")
      .insert({
        merchant_id: merchant.id,
        amount: numAmount,
        destination_address: destinationAddress,
        circle_tx_id: result.id,
        status: "initiated",
      });

    return NextResponse.json({
      message: "Payout initiated",
      transfer: result,
      remainingBalance: availableBalance - numAmount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
