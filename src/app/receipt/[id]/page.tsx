import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice } from "@/lib/db-invoices";
import { ARC_TESTNET, shortAddress } from "@/lib/invoices";
import { CopyButton } from "@/components/CopyButton";

export const dynamic = "force-dynamic";

type RpcTx = {
  from?: string;
  to?: string;
  input?: string;
  blockNumber?: string;
};

async function fetchTxData(txHash: string): Promise<RpcTx | null> {
  try {
    const response = await fetch(ARC_TESTNET.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionByHash", params: [txHash] }),
      next: { revalidate: 60 },
    });
    const json = await response.json();
    return json.result ?? null;
  } catch {
    return null;
  }
}

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) return notFound();

  const isPaid = invoice.status === "paid";
  const txHash = invoice.paidTxHash;
  const txData = isPaid && txHash ? await fetchTxData(txHash) : null;
  const payer = txData?.from;
  const explorerTx = txHash ? `${ARC_TESTNET.explorerUrl}/tx/${txHash}` : "";
  const receiptUrl = `https://takpay.vercel.app/receipt/${id}`;

  if (!isPaid) {
    return (
      <main className="min-h-screen bg-[#04060b] text-white">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-40 -top-40 size-[500px] rounded-full bg-emerald-500/8 blur-[120px]" />
        </div>
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-sm font-black text-emerald-300">T</div>
            <span className="text-lg font-semibold">TakPay</span>
          </Link>
          <Link href="/dashboard" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10">Dashboard</Link>
        </nav>
        <div className="relative z-10 mx-auto max-w-lg px-6 py-12">
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-10 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-amber-400/15">
              <span className="text-3xl">⏳</span>
            </div>
            <h1 className="text-3xl font-bold text-amber-200">Receipt Not Available</h1>
            <p className="mt-3 text-zinc-400">Invoice {id} is still {invoice.status}. Receipt will be available after payment.</p>
            <Link href={`/pay/${id}`} className="mt-6 inline-block rounded-full bg-amber-400 px-6 py-3 font-semibold text-black hover:bg-amber-300">
              Open Checkout
            </Link>
          </div>
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
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-sm font-black text-emerald-300">T</div>
          <span className="text-lg font-semibold">TakPay</span>
        </Link>
        <Link href="/dashboard" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10">Dashboard</Link>
      </nav>

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-8">
        {/* Success banner */}
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-8 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-emerald-400/20 text-3xl text-emerald-300">✓</div>
          <h1 className="text-3xl font-bold">Payment Complete</h1>
          <p className="mt-2 text-zinc-400">Verified on Arc Testnet. Settlement confirmed.</p>
        </div>

        {/* Receipt details */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">Receipt Details</p>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-zinc-500">Invoice ID</span>
              <span className="font-mono text-sm font-medium">{invoice.id}</span>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-zinc-500">Amount</span>
              <span className="text-2xl font-bold">${invoice.amount.toFixed(2)} <span className="text-sm text-zinc-400">{invoice.currency}</span></span>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-zinc-500">Status</span>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-medium text-emerald-300">Paid</span>
            </div>

            {invoice.paidAt && (
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-sm text-zinc-500">Paid At</span>
                <span className="text-sm">{new Date(invoice.paidAt).toLocaleString()}</span>
              </div>
            )}

            {payer && (
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-sm text-zinc-500">Payer</span>
                <span className="font-mono text-sm">{shortAddress(payer)}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-zinc-500">Recipient</span>
              <span className="font-mono text-sm">{shortAddress(invoice.recipient)}</span>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-zinc-500">Network</span>
              <span className="text-sm">{ARC_TESTNET.name}</span>
            </div>

            {txHash && (
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm text-zinc-500">Transaction</span>
                <span className="font-mono text-sm">{shortAddress(txHash)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {explorerTx && (
            <a href={explorerTx} target="_blank" rel="noreferrer" className="block w-full rounded-xl bg-emerald-400 py-4 text-center font-semibold text-black transition hover:bg-emerald-300">
              View on ArcScan
            </a>
          )}
          <div className="flex gap-3">
            <CopyButton value={receiptUrl} label="Copy receipt link" />
            {txHash && <CopyButton value={txHash} label="Copy tx hash" />}
          </div>
        </div>
      </div>
    </main>
  );
}
