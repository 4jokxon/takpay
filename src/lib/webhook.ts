import { getSupabaseServer } from "@/lib/supabase";
import { createHmac, randomBytes } from "crypto";

type WebhookPayload = {
  event: "invoice.paid" | "invoice.expired";
  invoice_id: string;
  amount: number;
  currency: string;
  memo: string;
  recipient: string;
  tx_hash?: string;
  paid_at?: string;
};

/**
 * Generate a webhook secret for a merchant (called once on first webhook setup)
 */
export function generateWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Compute HMAC-SHA256 signature for webhook payload
 */
function signPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export async function sendWebhook(merchantId: string, payload: WebhookPayload) {
  try {
    const { data: merchant } = await getSupabaseServer()
      .from("merchants")
      .select("webhook_url, webhook_secret")
      .eq("id", merchantId)
      .single();

    if (!merchant?.webhook_url) return;

    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-TakPay-Event": payload.event,
    };

    // Sign payload if merchant has a webhook secret
    if (merchant.webhook_secret) {
      headers["X-TakPay-Signature"] = signPayload(merchant.webhook_secret, body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    await fetch(merchant.webhook_url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);
  } catch {
    // Webhook delivery is best-effort
    console.error(`Webhook delivery failed for merchant ${merchantId}`);
  }
}
