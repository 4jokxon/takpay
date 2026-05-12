import Link from "next/link";
import { createInvoiceAction } from "@/app/dashboard/actions";
import { CopyButton } from "@/components/CopyButton";
import { listInvoices } from "@/lib/db-invoices";
import { demoInvoices, invoiceUrl, shortAddress } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { invoices, usingFallback, error } = await listInvoices();
  const defaultRecipient = invoices[0]?.recipient ?? demoInvoices[0].recipient;

  return (
    <main className="min-h-screen bg-[#05070d] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">TakPay</Link>
          <Link href="/pay/TK-1001" className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black">Demo checkout</Link>
        </nav>

        {usingFallback ? (
          <div className="mb-6 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
            Supabase schema belum aktif, jadi dashboard masih menampilkan fallback demo. Jalankan SQL di <code className="font-mono">supabase/schema.sql</code>. Detail: {error}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">New invoice</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Create a payment link</h1>
            <p className="mt-3 text-zinc-400">Create real Supabase-backed invoices, then share a public checkout link.</p>
            <form action={createInvoiceAction} className="mt-8 space-y-4">
              <label className="block text-sm text-zinc-300">Amount
                <input name="amount" type="number" step="0.000001" min="0.000001" defaultValue="0.10" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-300" />
              </label>
              <label className="block text-sm text-zinc-300">Currency
                <select name="currency" defaultValue="USDC" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-300">
                  <option value="USDC">USDC</option>
                  <option value="EURC">EURC</option>
                </select>
              </label>
              <label className="block text-sm text-zinc-300">Memo
                <input name="memo" defaultValue="Testnet checkout demo" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-300" />
              </label>
              <label className="block text-sm text-zinc-300">Recipient wallet
                <input name="recipient" defaultValue={defaultRecipient} required pattern="^0x[a-fA-F0-9]{40}$" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none focus:border-emerald-300" />
              </label>
              <button type="submit" disabled={usingFallback} className="w-full rounded-2xl bg-emerald-400 py-4 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50">Generate link</button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Invoices</p>
                <h2 className="mt-2 text-2xl font-semibold">Recent links</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-400">Arc testnet</span>
            </div>
            <div className="mt-6 space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">{invoice.id}</p>
                        <span className={`rounded-full px-2 py-1 text-xs ${invoice.status === "paid" ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"}`}>{invoice.status}</span>
                      </div>
                      <p className="mt-2 text-2xl font-semibold">${invoice.amount.toFixed(2)} {invoice.currency}</p>
                      <p className="mt-1 text-sm text-zinc-400">{invoice.memo} • {shortAddress(invoice.recipient)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link className="rounded-full bg-white px-3 py-2 text-sm font-medium text-black" href={`/pay/${invoice.id}`}>Open</Link>
                      <CopyButton value={invoiceUrl(invoice.id)} label="Copy link" />
                    </div>
                  </div>
                </div>
              ))}
              {invoices.length === 0 ? <p className="rounded-3xl border border-white/10 bg-black/20 p-5 text-zinc-400">No invoices yet. Create your first payment link.</p> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
