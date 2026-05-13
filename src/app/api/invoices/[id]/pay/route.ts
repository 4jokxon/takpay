import { NextResponse } from "next/server";
import { getInvoice, markInvoicePaid, markInvoiceSubmitted } from "@/lib/db-invoices";
import { verifyArcPayment } from "@/lib/verify-payment";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { txHash?: string };

    if (!body.txHash || !/^0x[a-fA-F0-9]{64}$/.test(body.txHash)) {
      return NextResponse.json({ error: "Invalid transaction hash" }, { status: 400 });
    }

    const invoice = await getInvoice(id);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.status === "paid" && invoice.paidTxHash === body.txHash) return NextResponse.json({ invoice, verified: true });

    const verification = await verifyArcPayment(invoice, body.txHash);

    if (!verification.ok) {
      if (verification.status === "pending" || verification.status === "missing") {
        await markInvoiceSubmitted(id, body.txHash).catch(() => null);
        return NextResponse.json({ status: verification.status, reason: verification.reason }, { status: 202 });
      }

      return NextResponse.json({ status: verification.status, error: verification.reason }, { status: 400 });
    }

    const paidInvoice = await markInvoicePaid(id, body.txHash);
    return NextResponse.json({ invoice: paidInvoice, verified: verification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify and mark invoice paid";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
