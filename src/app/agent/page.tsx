"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

type AgentDecision = {
  id: string;
  invoice_id: string;
  decision_type: string;
  risk_score: number;
  decision: string;
  reasoning: string;
  confidence: number;
  processing_time_ms: number;
  created_at: string;
};

type RefundRequest = {
  id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  destination_chain: string;
  created_at: string;
  processed_at: string | null;
};

type Totals = {
  totalDecisions: number;
  fraudFlags: number;
  autoApprovals: number;
  autoRejections: number;
};

function riskColor(score: number) {
  if (score >= 70) return "text-red-400";
  if (score >= 50) return "text-orange-400";
  if (score >= 25) return "text-amber-400";
  return "text-emerald-400";
}

function riskBg(score: number) {
  if (score >= 70) return "bg-red-400/10 border-red-400/20";
  if (score >= 50) return "bg-orange-400/10 border-orange-400/20";
  if (score >= 25) return "bg-amber-400/10 border-amber-400/20";
  return "bg-emerald-400/10 border-emerald-400/20";
}

function decisionBadge(decision: string) {
  switch (decision) {
    case "approve":
      return "bg-emerald-400/10 text-emerald-300 border-emerald-400/20";
    case "reject":
      return "bg-red-400/10 text-red-300 border-red-400/20";
    case "flag":
      return "bg-amber-400/10 text-amber-300 border-amber-400/20";
    case "route":
      return "bg-blue-400/10 text-blue-300 border-blue-400/20";
    default:
      return "bg-zinc-400/10 text-zinc-300 border-zinc-400/20";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "approved":
    case "completed":
      return "bg-emerald-400/10 text-emerald-300 border-emerald-400/20";
    case "rejected":
    case "failed":
      return "bg-red-400/10 text-red-300 border-red-400/20";
    case "pending":
    case "processing":
      return "bg-amber-400/10 text-amber-300 border-amber-400/20";
    default:
      return "bg-zinc-400/10 text-zinc-300 border-zinc-400/20";
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AgentDashboard() {
  const { address: walletAddress, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const [totals, setTotals] = useState<Totals>({ totalDecisions: 0, fraudFlags: 0, autoApprovals: 0, autoRejections: 0 });
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "decisions" | "refunds">("overview");

  useEffect(() => {
    if (!isConnected || !walletAddress) {
      setLoading(false);
      return;
    }

    async function loadMetrics() {
      try {
        const res = await fetch("/api/agent/metrics", {
          headers: { "x-wallet-address": walletAddress! },
        });
        if (res.ok) {
          const data = await res.json();
          setTotals(data.totals);
          setDecisions(data.recentDecisions || []);
          setRefunds(data.refunds || []);
        }
      } catch (err) {
        console.error("Failed to load agent metrics:", err);
      }
      setLoading(false);
    }

    loadMetrics();
  }, [isConnected, walletAddress]);

  if (!isConnected) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04060b] px-6 text-white">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-40 -top-40 size-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        </div>
        <div className="relative text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-sm text-emerald-200">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            AI Agent Dashboard
          </div>
          <h1 className="text-4xl font-bold">TakPay AI Agent</h1>
          <p className="mt-3 text-zinc-400">Connect your wallet to view agent intelligence metrics.</p>
          <div className="mt-8">
            <ConnectWalletButton />
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04060b] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <p className="text-zinc-400">Loading agent intelligence...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#04060b] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 size-[500px] rounded-full bg-emerald-500/8 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 size-[400px] rounded-full bg-teal-500/5 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-sm font-black text-emerald-300">T</div>
            <span className="text-lg font-semibold">TakPay</span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">AI Agent</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-emerald-300">Dashboard</Link>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">Arc Testnet</span>
            <button onClick={() => open()} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10">Wallet</button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">AI Agent Intelligence</h1>
          <p className="mt-2 text-zinc-400">Real-time fraud detection, refund decisions, and payment routing optimization.</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
            <p className="text-sm text-zinc-500">Total Decisions</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">{totals.totalDecisions}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
            <p className="text-sm text-zinc-500">Auto-Approved</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">{totals.autoApprovals}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
            <p className="text-sm text-zinc-500">Fraud Flags</p>
            <p className="mt-1 text-2xl font-bold text-amber-300">{totals.fraudFlags}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
            <p className="text-sm text-zinc-500">Rejections</p>
            <p className="mt-1 text-2xl font-bold text-red-300">{totals.autoRejections}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button onClick={() => setTab("overview")} className={`rounded-full px-5 py-2 text-sm font-medium transition ${tab === "overview" ? "bg-emerald-400 text-black" : "border border-white/10 text-zinc-400 hover:bg-white/5"}`}>
            Overview
          </button>
          <button onClick={() => setTab("decisions")} className={`rounded-full px-5 py-2 text-sm font-medium transition ${tab === "decisions" ? "bg-emerald-400 text-black" : "border border-white/10 text-zinc-400 hover:bg-white/5"}`}>
            Decisions ({decisions.length})
          </button>
          <button onClick={() => setTab("refunds")} className={`rounded-full px-5 py-2 text-sm font-medium transition ${tab === "refunds" ? "bg-emerald-400 text-black" : "border border-white/10 text-zinc-400 hover:bg-white/5"}`}>
            Refunds ({refunds.length})
          </button>
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Agent Capabilities */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
              <h3 className="mb-4 text-lg font-semibold">Agent Capabilities</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid size-8 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300 text-sm">🛡️</div>
                  <div>
                    <p className="font-medium">Fraud Detection</p>
                    <p className="text-sm text-zinc-400">Real-time risk scoring on every payment. Velocity checks, amount anomalies, self-payment detection.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid size-8 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300 text-sm">🔄</div>
                  <div>
                    <p className="font-medium">Refund Intelligence</p>
                    <p className="text-sm text-zinc-400">Auto-approve or flag refund requests based on merchant history, timing, and amount patterns.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid size-8 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300 text-sm">🌐</div>
                  <div>
                    <p className="font-medium">Cross-Chain Routing</p>
                    <p className="text-sm text-zinc-400">Optimal path selection via Circle CCTP. Direct Arc, bridge, or nanopayments based on amount and destination.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
              <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
              {decisions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 text-4xl">🤖</div>
                  <p className="text-zinc-400">No agent decisions yet.</p>
                  <p className="mt-1 text-sm text-zinc-500">The agent will start making decisions when payments come in.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {decisions.slice(0, 5).map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg border px-2 py-1 text-xs font-medium ${decisionBadge(d.decision)}`}>
                          {d.decision}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{d.decision_type.replace("_", " ")}</p>
                          <p className="text-xs text-zinc-500">{d.invoice_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${riskColor(d.risk_score)}`}>{d.risk_score}/100</p>
                        <p className="text-xs text-zinc-500">{timeAgo(d.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Decisions Tab */}
        {tab === "decisions" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
            <h3 className="mb-4 text-lg font-semibold">All Agent Decisions</h3>
            {decisions.length === 0 ? (
              <p className="text-center text-zinc-400 py-8">No decisions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {decisions.map((d) => (
                  <div key={d.id} className={`rounded-xl border p-4 ${riskBg(d.risk_score)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${decisionBadge(d.decision)}`}>
                          {d.decision.toUpperCase()}
                        </span>
                        <span className="text-sm text-zinc-400">{d.decision_type.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${riskColor(d.risk_score)}`}>Risk: {d.risk_score}/100</span>
                        <span className="text-xs text-zinc-500">{d.processing_time_ms}ms</span>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300">{d.reasoning}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                      <span>Invoice: {d.invoice_id}</span>
                      <span>Confidence: {(d.confidence * 100).toFixed(0)}%</span>
                      <span>{timeAgo(d.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Refunds Tab */}
        {tab === "refunds" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
            <h3 className="mb-4 text-lg font-semibold">Refund Requests</h3>
            {refunds.length === 0 ? (
              <p className="text-center text-zinc-400 py-8">No refund requests yet.</p>
            ) : (
              <div className="space-y-3">
                {refunds.map((r) => (
                  <div key={r.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusBadge(r.status)}`}>
                          {r.status.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium">{r.amount} {r.currency}</span>
                      </div>
                      <span className="text-xs text-zinc-500">{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="text-sm text-zinc-300">{r.reason}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                      <span>Invoice: {r.invoice_id}</span>
                      <span>Chain: {r.destination_chain}</span>
                      {r.processed_at && <span>Processed: {timeAgo(r.processed_at)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
