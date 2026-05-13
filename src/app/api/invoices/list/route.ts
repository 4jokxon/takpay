import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");

  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  // Find merchant by wallet address
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("wallet_address", wallet)
    .maybeSingle();

  if (!merchant) {
    return NextResponse.json({ invoices: [] });
  }

  // Get invoices for this merchant
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, amount, currency, memo, recipient, status, expires_at, created_at")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoices: invoices ?? [] });
}
