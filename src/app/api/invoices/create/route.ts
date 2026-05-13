import { NextRequest, NextResponse } from "next/server";
import { createInvoice } from "@/lib/db-invoices";
import { getAuthenticatedMerchant } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Auth check: only authenticated merchants can create invoices
  const merchant = await getAuthenticatedMerchant(request);
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { amount, currency, memo, recipient, expiryHours } = body;

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if (!["USDC", "EURC"].includes(currency)) {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }

  if (!recipient || !/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
    return NextResponse.json({ error: "Invalid recipient address" }, { status: 400 });
  }

  if (!memo || memo.length > 200) {
    return NextResponse.json({ error: "Memo required (max 200 chars)" }, { status: 400 });
  }

  try {
    const invoice = await createInvoice({
      amount: numAmount,
      currency,
      memo,
      recipient,
      // Use authenticated merchant's ID, not from request body
      merchantId: merchant.id,
      expiryHours: expiryHours ? Number(expiryHours) : undefined,
    });

    return NextResponse.json({ invoice });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
