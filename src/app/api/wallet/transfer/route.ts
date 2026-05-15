import { NextRequest, NextResponse } from "next/server";
import { transferToMerchant } from "@/lib/circle-wallet";
import { getAuthenticatedMerchant } from "@/lib/auth";

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

  try {
    const result = await transferToMerchant({
      destinationAddress,
      amount: numAmount.toString(),
    });

    return NextResponse.json({
      message: "Payout initiated",
      transfer: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
