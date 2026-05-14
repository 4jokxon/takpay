import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedMerchant } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase";

// GET /api/agent/metrics
// Get agent performance metrics for the authenticated merchant
export async function GET(request: NextRequest) {
  const merchant = await getAuthenticatedMerchant(request);
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  // Get last 30 days of metrics
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: metrics } = await supabase
    .from("agent_metrics")
    .select("*")
    .eq("merchant_id", merchant.id)
    .gte("metric_date", thirtyDaysAgo)
    .order("metric_date", { ascending: false });

  // Get recent decisions
  const { data: recentDecisions } = await supabase
    .from("agent_decisions")
    .select("id, invoice_id, decision_type, risk_score, decision, reasoning, confidence, processing_time_ms, created_at")
    .eq("input_data->>merchantId", merchant.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get refund requests
  const { data: refunds } = await supabase
    .from("refund_requests")
    .select("id, invoice_id, amount, currency, reason, status, destination_chain, created_at, processed_at")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Aggregate totals
  const totals = (metrics || []).reduce(
    (acc, m) => ({
      totalDecisions: acc.totalDecisions + (m.total_decisions || 0),
      fraudFlags: acc.fraudFlags + (m.fraud_flags || 0),
      autoApprovals: acc.autoApprovals + (m.auto_approvals || 0),
      autoRejections: acc.autoRejections + (m.auto_rejections || 0),
    }),
    { totalDecisions: 0, fraudFlags: 0, autoApprovals: 0, autoRejections: 0 }
  );

  return NextResponse.json({
    totals,
    dailyMetrics: metrics || [],
    recentDecisions: recentDecisions || [],
    refunds: refunds || [],
  });
}
