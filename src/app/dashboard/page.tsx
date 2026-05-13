"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { SignOutButton } from "@/components/SignOutButton";
import { CopyButton } from "@/components/CopyButton";
import type { User } from "@supabase/supabase-js";

type Invoice = {
  id: string;
  amount: number;
  currency: string;
  memo: string;
  recipient: string;
  status: string;
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
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Fetch merchant profile for wallet address
      (supabase.from("merchants") as any)
        .select("wallet_address")
        .eq("id", user.id)
        .single()
        .then(({ data }: any) => {
          if (data?.wallet_address) setWalletAddress(data.wallet_address);
        });

      // Fetch invoices for this merchant
      (supabase.from("invoices") as any)
        .select("id, amount, currency, memo, recipient, status")
        .eq("merchant_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25)
        .then(({ data }: any) => {
          setInvoices(data ?? []);
          setLoading(false);
        });
    });
  }, [router]);

  async function handleCreateInvoice(formData: FormData) {
    if (!user) return;

    const amount = Number(formData.get("amount"));
    const currency = formData.get("currency") as string;
    const memo = formData.get("memo") as string;
    const recipient = formData.get("recipient") as string;

    const res = await fetch("/api/invoices/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency, memo, recipient, merchantId: user.id }),
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

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#05070d] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">TakPay</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user.email}</span>
            <SignOutButton />
          </div>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">New invoice</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Create a payment link</h1>
            <p className="mt-3 text-zinc-400">Create invoices linked to your merchant account.</p>
            <form action={handleCreateInvoice} className="mt-8 space-y-4">
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
                <input name="recipient" defaultValue={walletAddress} required pattern="^0x[a-fA-F0-9]{40}$" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none focus:border-emerald-300" />
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
                        <span className={`rounded-full px-2 py-1 text-xs ${invoice.status === "paid" ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"}`}>{invoice.status}</span>
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
