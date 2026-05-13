"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useWallet } from "@/components/WalletProvider";
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
  const { address: walletAddress, isConnected, disconnect } = useWallet();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantWallet, setMerchantWallet] = useState("");
  const [authMode, setAuthMode] = useState<"wallet" | "email" | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function init() {
      // Try wallet auth first
      if (isConnected && walletAddress) {
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
      }

      // Fallback to Supabase email auth
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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

      // Not authenticated
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
      <main className="flex min-h-screen items-center justify-center bg-[#05070d] text-white">
        <p className="text-zinc-400">Loading dashboard...</p>
      </main>
    );
  }

  if (!authMode) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070d] px-6 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Connect to TakPay</h1>
          <p className="mt-3 text-zinc-400">Connect your wallet or sign in to access your dashboard.</p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <ConnectWalletButton />
            <Link href="/login" className="text-sm text-zinc-400 hover:text-emerald-300">or sign in with email</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070d] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">TakPay</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              {authMode === "wallet" ? shortAddress(merchantWallet) : userEmail}
            </span>
            {authMode === "email" ? <SignOutButton /> : (
              <button onClick={disconnect} className="rounded-full border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10">Disconnect</button>
            )}
          </div>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">New invoice</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Create a payment link</h1>
            <p className="mt-3 text-zinc-400">Create invoices linked to your wallet.</p>
            <form onSubmit={handleCreateInvoice} className="mt-8 space-y-4">
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
                <input name="recipient" defaultValue={merchantWallet} required pattern="^0x[a-fA-F0-9]{40}$" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none focus:border-emerald-300" />
              </label>
              <label className="block text-sm text-zinc-300">Expires in (hours)
                <input name="expiryHours" type="number" min="1" max="720" defaultValue="24" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-300" />
              </label>
              <button type="submit" className="w-full rounded-2xl bg-emerald-400 py-4 font-semibold text-black">Generate link</button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">My Invoices</p>
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
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          invoice.status === "paid" ? "bg-emerald-400/15 text-emerald-300" :
                          invoice.status === "expired" ? "bg-red-400/15 text-red-300" :
                          "bg-amber-400/15 text-amber-300"
                        }`}>{invoice.status}</span>
                      </div>
                      <p className="mt-2 text-2xl font-semibold">${invoice.amount.toFixed(2)} {invoice.currency}</p>
                      <p className="mt-1 text-sm text-zinc-400">{invoice.memo} • {shortAddress(invoice.recipient)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link className="rounded-full bg-white px-3 py-2 text-sm font-medium text-black" href={invoice.status === "paid" ? `/receipt/${invoice.id}` : `/pay/${invoice.id}`}>{invoice.status === "paid" ? "Receipt" : "Open"}</Link>
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
