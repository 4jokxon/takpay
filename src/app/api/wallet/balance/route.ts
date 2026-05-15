import { NextResponse } from "next/server";
import { getWalletBalance, TAKPAY_WALLET } from "@/lib/circle-wallet";

export async function GET() {
  try {
    const balances = await getWalletBalance();

    return NextResponse.json({
      wallet: {
        id: TAKPAY_WALLET.id,
        address: TAKPAY_WALLET.address,
      },
      balances,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch wallet balance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
