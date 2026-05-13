import Link from "next/link";
import { ARC_TESTNET, demoInvoices, shortAddress } from "@/lib/invoices";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

const stats = [
  { label: "Settlement", value: "sub-second" },
  { label: "Gas token", value: "USDC" },
  { label: "Mode", value: "Arc testnet" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#05070d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22c55e33,transparent_30%),radial-gradient(circle_at_80%_20%,#38bdf833,transparent_25%),linear-gradient(180deg,#05070d,#09090b)]" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-lg font-black text-emerald-300">T</div>
            <div>
              <p className="text-lg font-semibold tracking-tight">TakPay</p>
              <p className="text-xs text-zinc-400">Crosschain invoices on Arc</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/15">Email login</Link>
            <ConnectWalletButton className="px-4 py-2 text-sm" redirectTo="/dashboard" />
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
              <span className="size-2 rounded-full bg-emerald-300" /> Built for {ARC_TESTNET.name}
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-[-0.04em] text-white md:text-7xl">
              Payment links for USDC-native internet business.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Connect your wallet, create invoices, share checkout links. Settle payments on Arc with sub-second finality and predictable USDC fees.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ConnectWalletButton className="shadow-[0_0_40px_#34d39955]" redirectTo="/dashboard" />
              <Link href="/pay/TK-1001" className="rounded-full border border-white/10 bg-white/10 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/15">View demo checkout</Link>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">{stat.label}</dt>
                  <dd className="mt-2 text-lg font-semibold">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#0b0f19] p-6">
              <div className="flex items-center justify-between text-sm text-zinc-400">
                <span>Pending</span>
                <span>•••</span>
              </div>
              <div className="mt-8 text-center">
                <p className="text-6xl font-semibold tracking-tight">$50.00</p>
                <p className="mt-2 text-zinc-400">50.00 USDC</p>
              </div>
              <div className="mx-auto mt-8 grid size-52 place-items-center rounded-3xl bg-white p-4 text-black">
                <div className="grid size-full grid-cols-5 gap-1">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <span key={i} className={`${i % 3 === 0 || i % 7 === 0 ? "bg-black" : "bg-zinc-200"} rounded-sm`} />
                  ))}
                </div>
              </div>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">To</p>
                <p className="mt-2 font-mono text-sm text-zinc-200">{shortAddress(demoInvoices[0].recipient)}</p>
              </div>
              <Link href="/pay/TK-1001" className="mt-5 block rounded-2xl bg-emerald-400 py-4 text-center font-semibold text-black transition hover:bg-emerald-300">Pay with wallet</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
