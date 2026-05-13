import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getAuthenticatedMerchant } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Auth check: only the merchant can update their own webhook
  const merchant = await getAuthenticatedMerchant(request);
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { webhookUrl } = body;

  // Validate webhook URL (SSRF protection)
  if (webhookUrl) {
    try {
      const url = new URL(webhookUrl);
      if (url.protocol !== "https:") {
        return NextResponse.json({ error: "Webhook URL must use HTTPS" }, { status: 400 });
      }
      // Block private/internal IPs
      const hostname = url.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172.") || hostname === "169.254.169.254") {
        return NextResponse.json({ error: "Webhook URL cannot point to internal addresses" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }
  }

  const { error } = await getSupabaseServer()
    .from("merchants")
    .update({ webhook_url: webhookUrl || null })
    .eq("id", merchant.id);

  if (error) {
    return NextResponse.json({ error: "Failed to save webhook" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
