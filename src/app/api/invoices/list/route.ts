import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getAuthenticatedMerchant } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Auth check: only authenticated merchants can list their invoices
  const merchant = await getAuthenticatedMerchant(request);
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  // Get invoices for authenticated merchant only
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, amount, currency, memo, recipient, status, expires_at, created_at")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }

  return NextResponse.json({ invoices: invoices ?? [] });
}
