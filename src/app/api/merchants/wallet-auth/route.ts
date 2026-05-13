import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { walletAddress } = body;

  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  // Check if merchant already exists with this wallet
  const { data: existing } = await supabase
    .from("merchants")
    .select("id, wallet_address")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, merchant: existing, code: "already_exists" });
  }

  // Create new merchant with wallet as identity (no Supabase Auth needed)
  const merchantId = crypto.randomUUID();
  const { data, error } = await supabase.from("merchants").insert({
    id: merchantId,
    email: `${walletAddress.toLowerCase()}@wallet.takpay`,
    business_name: "",
    wallet_address: walletAddress,
  }).select("id, wallet_address").single();

  if (error) {
    console.error("[wallet-auth] Insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, merchant: data });
}
