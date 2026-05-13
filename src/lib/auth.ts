import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * Verify that the request comes from an authenticated merchant.
 * Checks the X-Wallet-Address header against the merchants table.
 * 
 * For MVP: we trust the wallet address header since the wallet-auth
 * endpoint already registered the merchant. In production, this should
 * use signed messages or session tokens.
 * 
 * Returns merchant data or null if not authenticated.
 */
export async function getAuthenticatedMerchant(request: NextRequest) {
  const walletAddress = request.headers.get("x-wallet-address");
  
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return null;
  }

  const { data: merchant } = await getSupabaseServer()
    .from("merchants")
    .select("id, wallet_address, webhook_url")
    .eq("wallet_address", walletAddress.toLowerCase())
    .single();

  if (!merchant) {
    // Try case-insensitive match
    const { data: merchantAlt } = await getSupabaseServer()
      .from("merchants")
      .select("id, wallet_address, webhook_url")
      .ilike("wallet_address", walletAddress)
      .single();
    return merchantAlt || null;
  }

  return merchant;
}
