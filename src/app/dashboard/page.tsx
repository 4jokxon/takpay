"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { SignOutButton } from "@/components/SignOutButton";
import { CopyButton } from "@/components/CopyButton";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

type Invoice = {
  id: string;
  amount: number;
  currency: string;
  memo: string;
  recipient: string;
  status: string;
  expires_at: string | null;
};

function shortAddress(address: string) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function invoiceUrl(id: string) {
  if (typeof window === "undefined") return `/pay/${id}`;
  return `${window.location.origin}/pay/${id}`;
}

export default function Dashboard() {
  const { address: walletAddress, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantWallet, setMerchantWallet] = useState("");
  const [authMode, setAuthMode] = useState<"wallet" | "email" | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [tab, setTab] = useState<"create" | "invoices">("create");
  const router = useRouter();

  // Live preview state
  const [previewAmount, setPreviewAmount] = useState("10.00");
  const [previewCurrency, setPreviewCurrency] = useState("USDC");
  const [previewMemo, setPreviewMemo] = useState("Payment");
  const [previewExpiry, setPreviewExpiry] = useState("24");

  useEffect(() => {
    async function init() {
      if (isConnected && walletAddress) {
        setLoading(true);
        const res = await fetch("/api/merchants/wallet-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress }),
        });
        if (res.ok) {
          const data = await res.json();
          setMerchantId(data.merchant?.id || "");
          setMerchantWallet(walletAddress);
          setAuthMode("wallet");
          await loadInvoices(walletAddress);
          return;
        }
        setLoading(false);
        return;
      }

      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setLoading(true);
        setUserEmail(user.email || "");
        setAuthMode("email");
        const { data } = await (supabase.from("merchants") as any)
          .select("id, wallet_address")
          .eq("id", user.id)
          .single();
        if (data) {
          setMerchantId(data.id);
          setMerchantWallet(data.wallet_address || "");
        }
        await loadInvoicesByMerchantId(user.id);
        return;
      }

      setLoading(false);
    }

    init();
  }, [isConnected, walletAddress]);

  async function loadInvoices(wallet: string) {
    const res = await fetch(`/api/invoices/list?wallet=${wallet}`);
    if (res.ok) {
      const data = await res.json();
      setInvoices(data.invoices || []);
    }
    setLoading(false);
  }

  async function loadInvoicesByMerchantId(id: string) {
    const supabase = getSupabaseBrowser();
    const { data } = await (supabase.from("invoices") as any)
      .select("id, amount, currency, memo, recipient, status, expires_at")
      .eq("merchant_id", id)
      .order("created_at", { ascending: false })
      .limit(25);
    setInvoices(data ?? []);
    setLoading(false);
  }

  async function handleCreateInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const currency = formData.get("currency") as string;
    const memo = formData.get("memo") as string;
    const recipient = formData.get("recipient") as string;
    const expiryHours = Number(formData.get("expiryHours") || 24);

    const res = await fetch("/api/invoices/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency, memo, recipient, merchantId, expiryHours }),
    });

    if (res.ok) {
      const { invoice } = await res.json();
      router.push(`/pay/${invoice.id}`);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04060b] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <p className="text-zinc-400">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (!authMode) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04060b] px-6 text-white">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-40 -top-40 size-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        </div>
        <div className="relative text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-sm text-emerald-200">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Merchant Portal
          </div>
          <h1 className="text-4xl font-bold">Connect to TakPay</h1>
          <p className="mt-3 text-zinc-400">Connect your wallet to access the merchant dashboard.</p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <ConnectWalletButton />
            <Link href="/login" className="text-sm text-zinc-400 hover:text-emerald-300">or sign in with email</Link>
          </div>
        </div>
      </main>
    );
  }

  const paidCount = invoices.filter(i => i.status === "paid").length;
  const pendingCount = invoices.filter(i => i.status === "pending").length;

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
          </Link>
          <div className="flex items-center gap-4">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">Arc Testnet</span>
            <span className="text-sm text-zinc-400">
              {authMode === "wallet" ? shortAddress(merchantWallet) : userEmail}
            </span>
            {authMode === "email" ? <SignOutButton /> : (
              <button onClick={() => open()} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10">Wallet</button>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Merchant Profile Card */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-xl font-bold text-emerald-300">
                {merchantWallet ? merchantWallet.slice(2, 4).toUpperCase() : "?"}
              </div>
              <div>
                <p className="font-semibold">Merchant Wallet</p>
                <p className="font-mono text-sm text-zinc-400">{merchantWallet || "Not set"}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
                <p className="text-lg font-bold text-emerald-300">{invoices.length}</p>
                <p className="text-xs text-zinc-500">Total</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
                <p className="text-lg font-bold text-emerald-300">{paidCount}</p>
                <p className="text-xs text-zinc-500">Paid</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
                <p className="text-lg font-bold text-amber-300">{pendingCount}</p>
                <p className="text-xs text-zinc-500">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button onClick={() => setTab("create")} className={`rounded-full px-5 py-2 text-sm font-medium transition ${tab === "create" ? "bg-emerald-400 text-black" : "border border-white/10 text-zinc-400 hover:bg-white/5"}`}>
            Create Payment
          </button>
          <button onClick={() => setTab("invoices")} className={`rounded-full px-5 py-2 text-sm font-medium transition ${tab === "invoices" ? "bg-emerald-400 text-black" : "border border-white/10 text-zinc-400 hover:bg-white/5"}`}>
            My Invoices ({invoices.length})
          </button>
        </div>

        {/* Create Payment Tab */}
        {tab === "create" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            {/* Form */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">Payment Parameters</p>
                <h2 className="mt-2 text-2xl font-bold">Create Payment Link</h2>
                <p className="mt-1 text-sm text-zinc-400">Generate a checkout link for your customer.</p>
              </div>
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-sm text-zinc-300">Amount
                    <input name="amount" type="number" step="0.000001" min="0.000001" defaultValue="10.00" required
                      onChange={(e) => setPreviewAmount(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-400/50" />
                  </label>
                  <label className="block text-sm text-zinc-300">Currency
                    <select name="currency" defaultValue="USDC"
                      onChange={(e) => setPreviewCurrency(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-400/50">
                      <option value="USDC">USDC (6 dec)</option>
                      <option value="EURC">EURC (6 dec)</option>
                    </select>
                  </label>
                </div>
                <label className="block text-sm text-zinc-300">Description / Memo
                  <input name="memo" defaultValue="Payment" required
                    onChange={(e) => setPreviewMemo(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-400/50" />
                </label>
                <label className="block text-sm text-zinc-300">Recipient Wallet
                  <input name="recipient" defaultValue={merchantWallet} required pattern="^0x[a-fA-F0-9]{40}$"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-xs text-white outline-none focus:border-emerald-400/50" />
                </label>
                <label className="block text-sm text-zinc-300">Session Expiry
                  <select name="expiryHours" defaultValue="24"
                    onChange={(e) => setPreviewExpiry(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-400/50">
                    <option value="1">1 Hour</option>
                    <option value="6">6 Hours</option>
                    <option value="24">24 Hours (Default)</option>
                    <option value="72">3 Days</option>
                    <option value="168">7 Days</option>
                  </select>
                </label>
                <button type="submit" className="w-full rounded-xl bg-emerald-400 py-4 font-semibold text-black transition hover:bg-emerald-300">
                  Generate Smart Endpoint
                </button>
              </form>
            </div>

            {/* Live Preview */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Live Preview</p>
              <h2 className="mt-2 text-2xl font-bold">Checkout Preview</h2>
              <p className="mt-1 text-sm text-zinc-400">This is what your payer will see.</p>

              {/* Preview card */}
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 p-6">
                <div className="flex items-center gap-2 text-sm text-emerald-300">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  TakPay Checkout
                </div>
                <p className="mt-4 text-4xl font-bold">${previewAmount || "0.00"} <span className="text-lg text-zinc-400">{previewCurrency}</span></p>
                <p className="mt-2 text-sm text-zinc-400">{previewMemo || "No description"}</p>
                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Recipient</span>
                    <span className="font-mono text-xs text-zinc-300">{shortAddress(merchantWallet)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-zinc-500">Network</span>
                    <span className="text-zinc-300">Arc Testnet</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-zinc-500">Expires</span>
                    <span className="text-zinc-300">{previewExpiry}h</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-zinc-500">Settlement</span>
                    <span className="text-emerald-300">Direct P2P (0% fee)</span>
                  </div>
                </div>
                <div className="mt-6 rounded-xl bg-emerald-400/20 py-3 text-center text-sm font-medium text-emerald-200">
                  Connect Wallet to Pay
                </div>
              </div>

              {/* Endpoint info */}
              <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-medium text-zinc-500">Payment Endpoint URL</p>
                <p className="mt-2 break-all font-mono text-xs text-zinc-300">https://takpay.vercel.app/pay/&#123;invoice_id&#125;</p>
                <p className="mt-3 text-xs text-zinc-500">Link generated after submission.</p>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {tab === "invoices" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Payment History</p>
                <h2 className="mt-2 text-2xl font-bold">My Invoices</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">{invoices.length} total</span>
            </div>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-sm font-medium">{invoice.id}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          invoice.status === "paid" ? "bg-emerald-400/15 text-emerald-300" :
                          invoice.status === "expired" ? "bg-red-400/15 text-red-300" :
                          "bg-amber-400/15 text-amber-300"
                        }`}>{invoice.status}</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold">${invoice.amount.toFixed(2)} <span className="text-sm text-zinc-400">{invoice.currency}</span></p>
                      <p className="mt-1 text-sm text-zinc-500">{invoice.memo} • {shortAddress(invoice.recipient)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-300" href={invoice.status === "paid" ? `/receipt/${invoice.id}` : `/pay/${invoice.id}`}>
                        {invoice.status === "paid" ? "Receipt" : "Open"}
                      </Link>
                      <CopyButton value={invoiceUrl(invoice.id)} label="Copy" />
                    </div>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                  <p className="text-zinc-500">No invoices yet.</p>
                  <button onClick={() => setTab("create")} className="mt-3 text-sm text-emerald-400 hover:underline">Create your first payment link →</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
