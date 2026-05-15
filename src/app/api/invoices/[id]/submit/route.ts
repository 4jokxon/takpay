import { NextResponse } from "next/server";
import { getInvoice, markInvoiceSubmitted } from "@/lib/db-invoices";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { txHash?: string };

    if (!body.txHash || !/^0x[a-fA-F0-9]{64}$/.test(body.txHash)) {
      return NextResponse.json({ error: "Invalid transaction hash" }, { status: 400 });
    }

    // Check invoice exists and is in valid state
    const invoice = await getInvoice(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
    }
    if (invoice.status === "expired") {
      return NextResponse.json({ error: "Invoice expired" }, { status: 400 });
    }

    // Replay prevention: check if txHash already used
    const { data: existing } = await getSupabaseServer()
      .from("invoices")
      .select("id")
      .eq("paid_tx_hash", body.txHash)
      .neq("id", id)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({ error: "This transaction hash is already used by another invoice" }, { status: 400 });
    }

    const updated = await markInvoiceSubmitted(id, body.txHash);
    return NextResponse.json({ invoice: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to mark invoice submitted";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
