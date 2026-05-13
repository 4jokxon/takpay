import { demoInvoices, type Invoice, type InvoiceStatus } from "@/lib/invoices";
import { getSupabaseServer } from "@/lib/supabase";

type DbInvoice = {
  id: string;
  amount: number | string;
  currency: "USDC" | "EURC";
  memo: string;
  recipient: string;
  status: InvoiceStatus;
  paid_tx_hash: string | null;
  paid_at: string | null;
  created_at: string;
  merchant_id: string | null;
};

function toInvoice(row: DbInvoice): Invoice {
  return {
    id: row.id,
    amount: Number(row.amount),
    currency: row.currency,
    memo: row.memo,
    recipient: row.recipient,
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    paidTxHash: row.paid_tx_hash,
  };
}

export function newInvoiceId() {
  return `TK-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function listInvoices(merchantId?: string): Promise<{ invoices: Invoice[]; usingFallback: boolean; error?: string }> {
  try {
    let query = getSupabaseServer()
      .from("invoices")
      .select("id, amount, currency, memo, recipient, status, paid_tx_hash, paid_at, created_at, merchant_id")
      .order("created_at", { ascending: false })
      .limit(25);

    if (merchantId) {
      query = query.eq("merchant_id", merchantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { invoices: (data ?? []).map((row) => toInvoice(row as DbInvoice)), usingFallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase is not ready yet.";
    return { invoices: demoInvoices, usingFallback: true, error: message };
  }
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  try {
    const { data, error } = await getSupabaseServer()
      .from("invoices")
      .select("id, amount, currency, memo, recipient, status, paid_tx_hash, paid_at, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (data) return toInvoice(data as DbInvoice);
  } catch {
    // Use seed/demo data until the Supabase schema has been installed.
  }

  return demoInvoices.find((invoice) => invoice.id === id) ?? null;
}

export async function createInvoice(input: { amount: number; currency: "USDC" | "EURC"; memo: string; recipient: string; merchantId?: string }) {
  const id = newInvoiceId();
  const { data, error } = await getSupabaseServer()
    .from("invoices")
    .insert({
      id,
      amount: input.amount,
      currency: input.currency,
      memo: input.memo,
      recipient: input.recipient,
      status: "pending",
      merchant_id: input.merchantId ?? null,
    })
    .select("id, amount, currency, memo, recipient, status, paid_tx_hash, paid_at, created_at, merchant_id")
    .single();

  if (error) throw error;
  return toInvoice(data as DbInvoice);
}

export async function markInvoiceSubmitted(id: string, txHash: string) {
  const { data, error } = await getSupabaseServer()
    .from("invoices")
    .update({ status: "submitted", paid_tx_hash: txHash })
    .eq("id", id)
    .neq("status", "paid")
    .select("id, amount, currency, memo, recipient, status, paid_tx_hash, paid_at, created_at")
    .single();

  if (error) throw error;
  return toInvoice(data as DbInvoice);
}

export async function markInvoicePaid(id: string, txHash: string) {
  const { data, error } = await getSupabaseServer()
    .from("invoices")
    .update({ status: "paid", paid_tx_hash: txHash, paid_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, amount, currency, memo, recipient, status, paid_tx_hash, paid_at, created_at")
    .single();

  if (error) throw error;
  return toInvoice(data as DbInvoice);
}
