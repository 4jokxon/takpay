import Link from "next/link";
import { demoInvoices, invoiceUrl, shortAddress } from "@/lib/invoices";
import { CopyButton } from "@/components/CopyButton";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#05070d] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">TakPay</Link>
          <Link href="/pay/TK-1001" className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black">Demo checkout</Link>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">New invoice</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Create a payment link</h1>
            <p className="mt-3 text-zinc-400">MVP demo form. Next phase will persist invoices to Supabase and monitor Arc testnet payments.</p>
            <form className="mt-8 space-y-4">
              <label className="block text-sm text-zinc-300">Amount
                <input defaultValue="50" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-300" />
              </label>
              <label className="block text-sm text-zinc-300">Memo
                <input defaultValue="Design sprint deposit" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-300" />
              </label>
              <label className="block text-sm text-zinc-300">Recipient wallet
                <input defaultValue={demoInvoices[0].recipient} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none focus:border-emerald-300" />
              </label>
              <button type="button" className="w-full rounded-2xl bg-emerald-400 py-4 font-semibold text-black">Generate link</button>
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
              {demoInvoices.map((invoice) => (
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
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
