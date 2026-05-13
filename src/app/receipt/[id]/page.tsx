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
  const receiptUrl = typeof window === "undefined" ? `/receipt/${id}` : `${process.env.NEXT_PUBLIC_APP_URL ?? "https://takpay.vercel.app"}/receipt/${id}`;

  if (!isPaid) {
    return (
      <main className="min-h-screen bg-[#05070d] px-6 py-8 text-white">
        <div className="mx-auto max-w-2xl">
          <nav className="mb-10 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">TakPay</Link>
            <Link href="/dashboard" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">Dashboard</Link>
          </nav>
          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8 text-center">
            <h1 className="text-2xl font-semibold text-amber-100">Receipt not available</h1>
            <p className="mt-3 text-amber-100/80">Invoice {id} is still {invoice.status}.</p>
            <Link href={`/pay/${id}`} className="mt-6 inline-block rounded-2xl bg-amber-400 px-6 py-3 font-semibold text-black">
              Open checkout
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070d] px-6 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <nav className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">TakPay</Link>
          <Link href="/dashboard" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">Dashboard</Link>
        </nav>

        <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-300 text-3xl text-black">✓</div>
          <h1 className="mt-4 text-3xl font-semibold text-emerald-100">Payment complete</h1>
          <p className="mt-2 text-emerald-100/80">This invoice has been paid and verified on Arc testnet.</p>
        </div>

        <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <span className="text-sm text-zinc-400">Invoice</span>
            <span className="font-mono font-semibold">{invoice.id}</span>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <span className="text-sm text-zinc-400">Amount</span>
            <span className="text-2xl font-semibold">{invoice.amount.toFixed(2)} {invoice.currency}</span>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <span className="text-sm text-zinc-400">Status</span>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-300">paid</span>
          </div>

          {invoice.paidAt ? (
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-sm text-zinc-400">Paid at</span>
              <span className="text-sm">{new Date(invoice.paidAt).toLocaleString()}</span>
            </div>
          ) : null}

          {payer ? (
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-sm text-zinc-400">Payer</span>
              <span className="font-mono text-sm">{shortAddress(payer)}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <span className="text-sm text-zinc-400">Recipient</span>
            <span className="font-mono text-sm">{shortAddress(invoice.recipient)}</span>
          </div>

          {txHash ? (
            <div className="flex items-center justify-between pb-4">
              <span className="text-sm text-zinc-400">Transaction</span>
              <span className="font-mono text-sm">{shortAddress(txHash)}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-6 space-y-3">
          {explorerTx ? (
            <a href={explorerTx} target="_blank" rel="noreferrer" className="block w-full rounded-2xl bg-white px-6 py-4 text-center font-semibold text-black transition hover:bg-white/90">
              View on Arcscan
            </a>
          ) : null}
          <div className="flex gap-3">
            <CopyButton value={receiptUrl} label="Copy receipt link" />
            {txHash ? <CopyButton value={txHash} label="Copy tx hash" /> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
