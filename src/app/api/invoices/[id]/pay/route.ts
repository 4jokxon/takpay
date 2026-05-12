import { NextResponse } from "next/server";
import { markInvoicePaid } from "@/lib/db-invoices";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { txHash?: string };

    if (!body.txHash || !/^0x[a-fA-F0-9]{64}$/.test(body.txHash)) {
      return NextResponse.json({ error: "Invalid transaction hash" }, { status: 400 });
    }

    const invoice = await markInvoicePaid(id, body.txHash);
    return NextResponse.json({ invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to mark invoice paid";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
