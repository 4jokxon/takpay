import Link from "next/link";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

const stats = [
  { label: "Settlement", value: "< 1 sec", desc: "Arc finality" },
  { label: "Risk Layer", value: "AI", desc: "Per-payment scoring" },
  { label: "Ops", value: "API", desc: "Webhooks + receipts" },
];

const steps = [
  {
    num: "01",
    title: "Generate a smart checkout",
    desc: "Create an invoice with amount, currency, memo, expiry, and settlement wallet. TakPay turns it into a shareable checkout endpoint.",
    icon: "01",
  },
  {
    num: "02",
    title: "Payer completes it on Arc",
    desc: "The payer connects a wallet, switches to Arc Testnet, and pays stablecoin rails with predictable USDC-denominated fees.",
    icon: "02",
  },
  {
    num: "03",
    title: "Agent handles payment ops",
    desc: "TakPay verifies the transaction, scores risk, emits webhooks, stores receipts, and prepares settlement or refund actions.",
    icon: "03",
  },
];

const features = [
  { title: "Agent-assisted risk scoring", desc: "Every payment can be analyzed for amount anomalies, velocity patterns, self-payments, and refund risk before settlement ops continue.", icon: "AI" },
  { title: "Settlement pool workflow", desc: "Payments can route through a TakPay settlement wallet, then move to merchant payout wallets with Circle Developer-Controlled Wallets.", icon: "OP" },
  { title: "Webhook-first operations", desc: "Merchants get payment lifecycle events for paid invoices, submitted transactions, receipts, and future refund or dispute flows.", icon: "API" },
  { title: "Static demo plus real invoices", desc: "A reliable demo checkout is always available, while authenticated merchants can generate live database-backed payment links.", icon: "UX" },
  { title: "On-chain receipts", desc: "Each completed payment keeps a transaction hash, status, amount, recipient, and timestamp for audit-friendly proof of payment.", icon: "TX" },
  { title: "Cross-chain refund path", desc: "Refund operations are designed as programmable payment ops, including chain-aware routing and bridge execution from the agent dashboard.", icon: "RF" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#04060b] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 size-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 size-[500px] rounded-full bg-teal-500/8 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 size-[400px] rounded-full bg-emerald-400/5 blur-[80px]" />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-lg font-black text-emerald-300">T</div>
          <span className="text-lg font-semibold tracking-tight">TakPay</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10">Dashboard</Link>
          <ConnectWalletButton className="px-4 py-2 text-sm" />
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-10 lg:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-sm text-emerald-200">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Agent-assisted stablecoin checkout on Arc
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-[-0.04em] md:text-7xl">
            Stablecoin payment links that also run <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">payment ops</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
            TakPay is not just a USDC checkout link. It is a programmable merchant payment layer for Arc: invoices, wallet checkout, transaction verification, AI risk decisions, webhooks, receipts, settlement, and refund workflows in one flow.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ConnectWalletButton className="shadow-[0_0_50px_#34d39944]" />
            <Link href="/demo" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10">View Demo Checkout</Link>
          </div>
          <p className="mt-4 text-sm text-zinc-500">Built for hackathon demos and real merchant ops: reliable demo route, live invoices, and API-first payment lifecycle.</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-emerald-300">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-white">{stat.label}</p>
              <p className="mt-1 text-xs text-zinc-500">{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">What makes it different</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">From checkout link to payment operating layer</h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">Most Arc demos stop at accepting a payment. TakPay continues after the transaction: verification, risk, notifications, receipts, settlement, and refunds.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.num} className="group rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.03]">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 font-bold text-emerald-300">
                {step.icon}
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">{step.num}</p>
              <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">Core modules</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Built for programmable merchant ops</h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">TakPay positions Arc as the stablecoin rail underneath a merchant workflow, not just another one-off payment page.</p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition hover:border-emerald-400/20">
              <span className="inline-flex rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300">{f.icon}</span>
              <h3 className="mt-4 font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/10 to-teal-400/5 p-12 text-center backdrop-blur-sm md:p-16">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-300">Hackathon-ready demo</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">Show the full payment lifecycle, not only the payment button.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">Start from the static demo checkout, then create a real invoice from the dashboard and show how TakPay turns Arc stablecoin payments into merchant operations.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/demo" className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black shadow-[0_0_60px_#34d39955] transition hover:bg-emerald-300">Open Demo</Link>
            <Link href="/dashboard" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10">Create Invoice</Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-7xl border-t border-white/10 px-6 py-10 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-sm font-black text-emerald-300">T</div>
            <span className="font-semibold">TakPay</span>
            <span className="text-sm text-zinc-500">- Payment ops for stablecoin merchants on Arc</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/demo" className="hover:text-white">Demo</Link>
            <a href="https://github.com/4jokxon/takpay" target="_blank" rel="noopener" className="hover:text-white">GitHub</a>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-zinc-600">Built on Arc Network - powered by Circle USDC and programmable merchant workflows</p>
      </footer>
    </main>
  );
}
