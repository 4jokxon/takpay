import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { verifyMessage } from "viem";

/**
 * Authenticate merchant via signed message (EIP-191).
 * 
 * Client must send:
 * - X-Wallet-Address: merchant's wallet address
 * - X-Signature: signature of message "TakPay-Auth:{timestamp}"
 * - X-Auth-Timestamp: unix timestamp (must be within 5 minutes)
 * 
 * Fallback for Supabase session auth (cookie-based) also supported.
 */

const AUTH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function getAuthenticatedMerchant(request: NextRequest) {
  const walletAddress = request.headers.get("x-wallet-address");
  const signature = request.headers.get("x-signature");
  const timestamp = request.headers.get("x-auth-timestamp");

  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return null;
  }

  // If signature provided, verify it (secure path)
  if (signature && timestamp) {
    const ts = Number(timestamp);
    const now = Date.now();

    // Reject stale or future timestamps
    if (isNaN(ts) || Math.abs(now - ts) > AUTH_WINDOW_MS) {
      return null;
    }

    const message = `TakPay-Auth:${timestamp}`;

    try {
      const valid = await verifyMessage({
        address: walletAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      if (!valid) return null;
    } catch {
      return null;
    }
  } else {
    // No signature - check if request comes from same-origin (Supabase session)
    // For API calls without signature, require Supabase auth cookie
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user } } = await getSupabaseServer().auth.getUser(token);
      if (!user) return null;
      
      // Look up merchant by user ID
      const { data: merchant } = await getSupabaseServer()
        .from("merchants")
        .select("id, wallet_address, webhook_url")
        .eq("user_id", user.id)
        .single();
      
      return merchant || null;
    }

    // Legacy: allow header-only auth ONLY from same-origin browser requests
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const isSameOrigin = origin?.includes("takpay.vercel.app") || 
                         referer?.includes("takpay.vercel.app") ||
                         origin?.includes("localhost");
    
    if (!isSameOrigin) {
      return null; // External API calls MUST provide signature
    }
  }

  // Look up merchant by wallet address
  const { data: merchant } = await getSupabaseServer()
    .from("merchants")
    .select("id, wallet_address, webhook_url")
    .ilike("wallet_address", walletAddress)
    .single();

  return merchant || null;
}
