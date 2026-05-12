import Link from "next/link";
import { notFound } from "next/navigation";
import { ARC_TESTNET, demoInvoices, shortAddress } from "@/lib/invoices";
import { CopyButton } from "@/components/CopyButton";
import { PayWithWallet } from "@/components/PayWithWallet";

function QrPlaceholder() {
  return (
    <div className="grid size-full grid-cols-7 gap-1">
      {Array.from({ length: 49 }).map((_, i) => {
        const finder = i < 16 || (i % 7 > 4 && Math.floor(i / 7) < 3) || (i % 7 < 2 && Math.floor(i / 7) > 4);
        const dark = finder || i % 5 === 0 || i % 11 === 0;
        return <span key={i} className={`${dark ? "bg-black" : "bg-zinc-200"} rounded-[2px]`} />;
      })}
    </div>
  );
}

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = demoInvoices.find((item) => item.id === id);
  if (!invoice) notFound();

  const paymentUri = `ethereum:${invoice.recipient}?chain_id=${ARC_TESTNET.chainId}&value=${invoice.amount}`;

  return (
    <main className="min-h-screen bg-[#05070d] px-6 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col">
        <nav className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 font-black text-emerald-300">T</div>
            <span className="font-semibold">TakPay</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">Dashboard</Link>
        </nav>

        <section className="grid flex-1 items-center gap-8 lg:grid-cols-[.95fr_1.05fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Checkout link</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight">Pay invoice {invoice.id}</h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-zinc-400">Choose Arc testnet, scan the QR, or connect a wallet in the next implementation phase. This MVP demonstrates the checkout UX and payment metadata.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Network</p>
                <p className="mt-2 font-semibold">{ARC_TESTNET.name}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Gas</p>
                <p className="mt-2 font-semibold">USDC native</p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#0b0f19] p-6">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-sm ${invoice.status === "paid" ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"}`}>{invoice.status}</span>
                <CopyButton value={paymentUri} label="Copy URI" />
              </div>
              <div className="mt-8 text-center">
                <p className="text-6xl font-semibold tracking-tight">${invoice.amount.toFixed(2)}</p>
                <p className="mt-2 text-zinc-400">{invoice.amount.toFixed(2)} {invoice.currency}</p>
                <p className="mt-2 text-sm text-zinc-500">{invoice.memo}</p>
              </div>
              <div className="mx-auto mt-8 grid size-56 place-items-center rounded-3xl bg-white p-5 text-black">
                <QrPlaceholder />
              </div>
              <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Recipient</p>
                  <p className="mt-2 font-mono text-sm text-zinc-200">{shortAddress(invoice.recipient)}</p>
                </div>
                <div className="flex gap-2">
                  <CopyButton value={invoice.recipient} label="Copy address" />
                  <CopyButton value={paymentUri} label="Copy payment URI" />
                </div>
              </div>
              <PayWithWallet invoice={invoice} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
