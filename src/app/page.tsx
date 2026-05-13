import Link from "next/link";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

const stats = [
  { label: "Settlement", value: "< 1 sec", desc: "Arc finality" },
  { label: "Gas Token", value: "USDC", desc: "Predictable fees" },
  { label: "Wallets", value: "Multi", desc: "MetaMask, WC, Coinbase" },
];

const steps = [
  {
    num: "01",
    title: "Connect Wallet",
    desc: "Link your self-custodial wallet. Your wallet is your identity — no email, no password, no database.",
    icon: "🔗",
  },
  {
    num: "02",
    title: "Create Invoice",
    desc: "Set amount, currency, memo, and expiry. Get a shareable checkout link instantly.",
    icon: "📄",
  },
  {
    num: "03",
    title: "Get Paid",
    desc: "Payer opens the link, connects wallet, pays in USDC. Settlement on Arc in under 1 second.",
    icon: "⚡",
  },
];

const features = [
  { title: "Auto Expiry", desc: "Invoices expire after configurable time. No stale payment links.", icon: "⏰" },
  { title: "Multi-Wallet", desc: "MetaMask, WalletConnect, Coinbase Wallet, Phantom — all supported via Reown.", icon: "👛" },
  { title: "Merchant Dashboard", desc: "Track all invoices, statuses, and payment history in one place.", icon: "📊" },
  { title: "On-Chain Receipts", desc: "Every payment verified on-chain with transaction hash proof.", icon: "🔒" },
  { title: "USDC Native", desc: "Built for stablecoin payments. No volatile gas tokens.", icon: "💵" },
  { title: "Instant Settlement", desc: "Arc Network sub-second finality. No waiting for confirmations.", icon: "🚀" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#04060b] text-white">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 size-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 size-[500px] rounded-full bg-teal-500/8 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 size-[400px] rounded-full bg-emerald-400/5 blur-[80px]" />
      </div>

      {/* Nav */}
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

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-10 lg:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-sm text-emerald-200">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Live on Arc Testnet
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-[-0.03em] md:text-7xl">
            Accept <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">USDC payments</span> with a link.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            TakPay lets merchants create crypto-native invoices, share a checkout link, and settle payments on Arc Network with sub-second finality. No backend needed.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ConnectWalletButton className="shadow-[0_0_50px_#34d39944]" />
            <Link href="/pay/TK-1001" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10">View Demo Checkout</Link>
          </div>
        </div>

        {/* Stats */}
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

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">How it works</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Payments in 3 Steps</h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">No smart contract deployment. No backend infrastructure. Just connect, create, and get paid.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.num} className="group rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.03]">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-2xl">
                {step.icon}
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">{step.num}</p>
              <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">Features</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Built for Merchants</h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">Everything you need to accept stablecoin payments without the complexity.</p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition hover:border-emerald-400/20">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-4 font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/10 to-teal-400/5 p-12 text-center backdrop-blur-sm md:p-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Start Accepting USDC Today.</h2>
          <p className="mx-auto mt-4 max-w-lg text-zinc-400">Connect your wallet, create your first invoice in seconds. Zero setup cost, zero monthly fees.</p>
          <div className="mt-8">
            <ConnectWalletButton className="shadow-[0_0_60px_#34d39955]" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mx-auto max-w-7xl border-t border-white/10 px-6 py-10 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-sm font-black text-emerald-300">T</div>
            <span className="font-semibold">TakPay</span>
            <span className="text-sm text-zinc-500">• Crosschain invoices on Arc</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/pay/TK-1001" className="hover:text-white">Demo</Link>
            <a href="https://github.com/4jokxon/takpay" target="_blank" rel="noopener" className="hover:text-white">GitHub</a>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-zinc-600">Built on Arc Network • Powered by Circle USDC</p>
      </footer>
    </main>
  );
}
