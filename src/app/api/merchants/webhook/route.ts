import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { merchantId, webhookUrl } = body;

  if (!merchantId) {
    return NextResponse.json({ error: "merchantId required" }, { status: 400 });
  }

  const { error } = await getSupabaseServer()
    .from("merchants")
    .update({ webhook_url: webhookUrl || null })
    .eq("id", merchantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
