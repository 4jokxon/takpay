"use client";

import Link from "next/link";
import { ARC_TESTNET, ARC_USDC, shortAddress } from "@/lib/invoices";
import { CopyButton } from "@/components/CopyButton";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

// Static demo invoice for landing page CTA - no database lookup required
const DEMO_INVOICE = {
  id: "DEMO-001",
  amount: 25.0,
  currency: "USDC",
  memo: "Demo checkout - TakPay on Arc Testnet",
  recipient: ARC_USDC?.address || "0x...",
  status: "pending" as const,
  expiresAt: null,
  paidTxHash: null,
};

export default function DemoCheckoutPage() {
  const invoice = DEMO_INVOICE;

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
        {/* Demo banner */}
        <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-center">
          <p className="text-sm text-amber-200">
            <span className="font-semibold">Demo Mode</span> - This is a preview of the TakPay checkout experience. Connect your wallet to explore the full flow.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* Left: Invoice details */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
              <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
              Demo Checkout
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

              {/* Wallet connect button */}
              <div className="mt-6">
                <ConnectWalletButton />
                <p className="mt-4 text-center text-xs text-zinc-500">
                  Connect your wallet to complete this demo payment
                </p>
              </div>

              {/* Manual payment info */}
              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="text-xs font-medium text-zinc-500">Or send manually to:</p>
                <div className="mt-2 rounded-xl bg-black/40 p-3">
                  <p className="break-all font-mono text-xs text-zinc-300">{invoice.recipient}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <CopyButton value={invoice.recipient} label="Copy address" />
                </div>
              </div>

              {/* CTA to create real invoice */}
              <div className="mt-6 border-t border-white/10 pt-6">
                <Link 
                  href="/dashboard" 
                  className="block w-full rounded-xl bg-emerald-400 py-3 text-center font-semibold text-black transition hover:bg-emerald-300"
                >
                  Create Your Own Invoice
                </Link>
                <p className="mt-2 text-center text-xs text-zinc-500">
                  Sign up to generate real payment links
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features highlight */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 grid size-10 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
              <span className="text-lg">⚡</span>
            </div>
            <h3 className="font-semibold">USDC Gas</h3>
            <p className="mt-1 text-sm text-zinc-400">Pay fees in USDC - no ETH needed</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 grid size-10 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
              <span className="text-lg">🛡️</span>
            </div>
            <h3 className="font-semibold">AI Fraud Detection</h3>
            <p className="mt-1 text-sm text-zinc-400">Every payment scored in real-time</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 grid size-10 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
              <span className="text-lg">🔄</span>
            </div>
            <h3 className="font-semibold">Cross-Chain Refunds</h3>
            <p className="mt-1 text-sm text-zinc-400">Refund to any supported chain</p>
          </div>
        </div>
      </div>
    </main>
  );
}
