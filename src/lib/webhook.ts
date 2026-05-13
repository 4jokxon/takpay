import { getSupabaseServer } from "@/lib/supabase";

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

export async function sendWebhook(merchantId: string, payload: WebhookPayload) {
  try {
    // Get merchant webhook URL
    const { data: merchant } = await getSupabaseServer()
      .from("merchants")
      .select("webhook_url")
      .eq("id", merchantId)
      .single();

    if (!merchant?.webhook_url) return;

    // POST to webhook URL with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    await fetch(merchant.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TakPay-Event": payload.event,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
  } catch {
    // Webhook delivery is best-effort, don't block payment flow
    console.error(`Webhook delivery failed for merchant ${merchantId}`);
  }
}
