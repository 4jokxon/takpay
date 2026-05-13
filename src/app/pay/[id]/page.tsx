import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice } from "@/lib/db-invoices";
import { ARC_TESTNET, shortAddress } from "@/lib/invoices";
import { CopyButton } from "@/components/CopyButton";
import { PayWithWallet } from "@/components/PayWithWallet";
import { VerifyManualPayment } from "@/components/VerifyManualPayment";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const paymentUri = `ethereum:${invoice.recipient}?chain_id=${ARC_TESTNET.chainId}&value=${invoice.amount}`;

  return (
    <main className="min-h-screen bg-[#04060b] text-white">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-0 size-[500px] rounded-full bg-emerald-500/8 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 size-[400px] rounded-full bg-teal-500/5 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-sm font-black text-emerald-300">T</div>
          <span className="text-lg font-semibold">TakPay</span>
        </Link>
        <Link href="/dashboard" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10">Dashboard</Link>
      </nav>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        {/* Expired state */}
        {invoice.status === "expired" && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-400/20 bg-red-400/5 p-10 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-red-400/15">
              <span className="text-3xl">⏰</span>
            </div>
            <h1 className="text-3xl font-bold text-red-200">Invoice Expired</h1>
            <p className="mt-3 text-zinc-400">This invoice is no longer accepting payments. Please request a new invoice from the merchant.</p>
            <Link href="/" className="mt-6 inline-block rounded-full bg-white/10 px-6 py-3 text-sm font-medium hover:bg-white/15">Back to Home</Link>
          </div>
        )}

        {/* Paid state */}
        {invoice.status === "paid" && (
          <div className="mx-auto max-w-lg rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-10 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-emerald-400/20">
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-emerald-200">Payment Complete</h1>
            <p className="mt-3 text-zinc-400">This invoice has been paid and verified on Arc testnet.</p>
            <Link href={`/receipt/${id}`} className="mt-6 inline-block rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black hover:bg-emerald-300">View Receipt</Link>
          </div>
        )}

        {/* Active payment */}
        {invoice.status !== "expired" && invoice.status !== "paid" && (
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            {/* Left: Invoice details */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
                <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                Awaiting Payment
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Checkout</h1>
              <p className="mt-2 text-zinc-400">Complete this payment using your wallet on Arc Testnet.</p>

              {/* Amount card */}
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Amount Due</p>
                <p className="mt-3 text-5xl font-bold">${invoice.amount.toFixed(2)} <span className="text-lg text-zinc-400">{invoice.currency}</span></p>
                <p className="mt-3 text-sm text-zinc-400">{invoice.memo}</p>
              </div>

              {/* Details */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3">
                  <span className="text-sm text-zinc-500">Network</span>
                  <span className="text-sm font-medium">{ARC_TESTNET.name}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3">
                  <span className="text-sm text-zinc-500">Recipient</span>
                  <span className="font-mono text-sm">{shortAddress(invoice.recipient)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3">
                  <span className="text-sm text-zinc-500">Gas Token</span>
                  <span className="text-sm font-medium">USDC (predictable fees)</span>
                </div>
                {invoice.expiresAt && (
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3">
                    <span className="text-sm text-zinc-500">Expires</span>
                    <span className="text-sm font-medium">{new Date(invoice.expiresAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Payment action */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">Pay with Wallet</p>
                  <p className="mt-4 text-3xl font-bold">${invoice.amount.toFixed(2)}</p>
                  <p className="mt-1 text-sm text-zinc-400">{invoice.currency} on Arc Testnet</p>
                </div>

                {/* Wallet pay button */}
                <div className="mt-6">
                  <PayWithWallet invoice={invoice} />
                </div>

                {/* Manual payment info */}
                <div className="mt-6 border-t border-white/10 pt-6">
                  <p className="text-xs font-medium text-zinc-500">Or send manually to:</p>
                  <div className="mt-2 rounded-xl bg-black/40 p-3">
                    <p className="break-all font-mono text-xs text-zinc-300">{invoice.recipient}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <CopyButton value={invoice.recipient} label="Copy address" />
                    <CopyButton value={paymentUri} label="Copy URI" />
                  </div>
                </div>

                {/* Verify manual payment */}
                <VerifyManualPayment invoiceId={id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
