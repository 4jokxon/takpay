import { NextRequest, NextResponse } from "next/server";
import { getWalletBalance, TAKPAY_WALLET } from "@/lib/circle-wallet";
import { getAuthenticatedMerchant } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Require authentication - don't expose pool balance publicly
  const merchant = await getAuthenticatedMerchant(request);
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const balances = await getWalletBalance();

    return NextResponse.json({
      wallet: {
        address: TAKPAY_WALLET.address,
      },
      balances,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch wallet balance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
