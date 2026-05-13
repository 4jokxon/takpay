import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, email, businessName, walletAddress } = body;

  if (!userId || !email || !walletAddress) {
    return NextResponse.json({ error: "Missing required fields", received: { userId: !!userId, email: !!email, walletAddress: !!walletAddress } }, { status: 400 });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  const { error } = await supabase.from("merchants").insert({
    id: userId,
    email,
    business_name: businessName || "",
    wallet_address: walletAddress,
  });

  if (error) {
    console.error("[merchants/register] Insert error:", error);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
