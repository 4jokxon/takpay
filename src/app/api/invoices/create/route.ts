import { NextRequest, NextResponse } from "next/server";
import { createInvoice } from "@/lib/db-invoices";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { amount, currency, memo, recipient, merchantId, expiryHours } = body;

  if (!amount || !currency || !memo || !recipient) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  if (currency !== "USDC" && currency !== "EURC") {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
  }

  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
  }

  try {
    const invoice = await createInvoice({
      amount: numAmount,
      currency,
      memo,
      recipient,
      merchantId,
      expiryHours: expiryHours ? Number(expiryHours) : undefined,
    });
    return NextResponse.json({ invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
