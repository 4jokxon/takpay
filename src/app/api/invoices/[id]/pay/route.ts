import { NextResponse } from "next/server";
import { getInvoice, markInvoicePaid, markInvoiceSubmitted } from "@/lib/db-invoices";
import { verifyArcPayment } from "@/lib/verify-payment";
import { transferToMerchant } from "@/lib/circle-wallet";
import { getSupabaseServer } from "@/lib/supabase";

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

    if (invoice.status === "expired") {
      return NextResponse.json({ error: "Invoice expired" }, { status: 400 });
    }

    // Replay prevention: check if txHash already used by another invoice
    const { data: existingInvoice } = await getSupabaseServer()
      .from("invoices")
      .select("id")
      .eq("paid_tx_hash", body.txHash)
      .neq("id", id)
      .limit(1)
      .single();

    if (existingInvoice) {
      return NextResponse.json({ error: "This transaction has already been used for another invoice" }, { status: 400 });
    }

    const verification = await verifyArcPayment(invoice, body.txHash);

    if (!verification.ok) {
      if (verification.status === "pending" || verification.status === "missing") {
        await markInvoiceSubmitted(id, body.txHash).catch(() => null);
        return NextResponse.json({ status: verification.status, reason: verification.reason }, { status: 202 });
      }

      return NextResponse.json({ status: verification.status, error: verification.reason }, { status: 400 });
    }

    const paidInvoice = await markInvoicePaid(id, body.txHash);

    // Auto-settle: transfer USDC from TakPay pool to merchant wallet
    let settlement = null;
    if (paidInvoice.merchantWallet) {
      try {
        settlement = await transferToMerchant({
          destinationAddress: paidInvoice.merchantWallet,
          amount: paidInvoice.amount.toString(),
        });
      } catch (err) {
        // Log but don't block - merchant can retry via manual payout
        console.error("[settlement-error]", id, err instanceof Error ? err.message : err);
      }
    }

    return NextResponse.json({ invoice: paidInvoice, verified: verification, settlement });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify and mark invoice paid";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
