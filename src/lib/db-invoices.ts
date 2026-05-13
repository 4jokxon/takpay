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
  expires_at: string | null;
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
    expiresAt: row.expires_at,
    merchantId: row.merchant_id,
  };
}

/** Check if an invoice is expired and auto-update status if needed */
async function checkAndExpire(invoice: Invoice): Promise<Invoice> {
  if (invoice.status !== "pending" && invoice.status !== "submitted") return invoice;
  if (!invoice.expiresAt) return invoice;
  if (new Date(invoice.expiresAt) > new Date()) return invoice;

  // Invoice is expired — update in DB
  try {
    const { error } = await getSupabaseServer()
      .from("invoices")
      .update({ status: "expired" })
      .eq("id", invoice.id)
      .in("status", ["pending", "submitted"]);

    if (!error) {
      return { ...invoice, status: "expired" };
    }
  } catch {
    // If update fails, still return as expired for display
  }
  return { ...invoice, status: "expired" };
}

export function newInvoiceId() {
  return `TK-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function listInvoices(merchantId?: string): Promise<{ invoices: Invoice[]; usingFallback: boolean; error?: string }> {
  try {
    let query = getSupabaseServer()
      .from("invoices")
      .select("id, amount, currency, memo, recipient, status, paid_tx_hash, paid_at, created_at, merchant_id, expires_at")
      .order("created_at", { ascending: false })
      .limit(25);

    if (merchantId) {
      query = query.eq("merchant_id", merchantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    const invoices = (data ?? []).map((row) => toInvoice(row as DbInvoice));
    // Check expiry for pending/submitted invoices
    const checked = await Promise.all(invoices.map(checkAndExpire));
    return { invoices: checked, usingFallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase is not ready yet.";
    return { invoices: demoInvoices, usingFallback: true, error: message };
  }
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  try {
    const { data, error } = await getSupabaseServer()
      .from("invoices")
      .select("id, amount, currency, memo, recipient, status, paid_tx_hash, paid_at, created_at, merchant_id, expires_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      const invoice = toInvoice(data as DbInvoice);
      return await checkAndExpire(invoice);
    }
  } catch {
    // Use seed/demo data until the Supabase schema has been installed.
  }

  return demoInvoices.find((invoice) => invoice.id === id) ?? null;
}

/** Default expiry: 24 hours from now */
const DEFAULT_EXPIRY_HOURS = 24;

export async function createInvoice(input: { amount: number; currency: "USDC" | "EURC"; memo: string; recipient: string; merchantId?: string; expiryHours?: number }) {
  const id = newInvoiceId();
  const hours = input.expiryHours ?? DEFAULT_EXPIRY_HOURS;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

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
      expires_at: expiresAt,
    })
    .select("id, amount, currency, memo, recipient, status, paid_tx_hash, paid_at, created_at, merchant_id, expires_at")
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
    .neq("status", "expired")
    .select("id, amount, currency, memo, recipient, status, paid_tx_hash, paid_at, created_at, merchant_id, expires_at")
    .single();

  if (error) throw error;
  return toInvoice(data as DbInvoice);
}

export async function markInvoicePaid(id: string, txHash: string) {
  const { data, error } = await getSupabaseServer()
    .from("invoices")
    .update({ status: "paid", paid_tx_hash: txHash, paid_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, amount, currency, memo, recipient, status, paid_tx_hash, paid_at, created_at, merchant_id, expires_at")
    .single();

  if (error) throw error;
  return toInvoice(data as DbInvoice);
}
