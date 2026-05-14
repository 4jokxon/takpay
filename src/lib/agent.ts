import { getSupabaseServer } from "@/lib/supabase";

// ============================================================
// TakPay AI Agent - Payment Intelligence Engine
// ============================================================
// Rule-based decision engine for:
// 1. Fraud detection on incoming payments
// 2. Refund auto-approval/rejection
// 3. Cross-chain routing optimization
// ============================================================

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type AgentDecision = "approve" | "reject" | "flag" | "route";
export type DecisionType = "fraud_check" | "refund_approval" | "routing_optimization";

export interface FraudCheckInput {
  invoiceId: string;
  amount: number;
  currency: string;
  payerWallet: string;
  recipientWallet: string;
  txHash: string;
  merchantId?: string;
}

export interface FraudCheckResult {
  riskScore: number;
  riskLevel: RiskLevel;
  decision: AgentDecision;
  reasoning: string;
  flags: string[];
  confidence: number;
}

export interface RefundDecisionInput {
  invoiceId: string;
  amount: number;
  currency: string;
  reason: string;
  requesterWallet: string;
  merchantId: string;
  originalPaidAt: string | null;
  destinationChain?: string;
}

export interface RefundDecisionResult {
  decision: AgentDecision;
  riskScore: number;
  reasoning: string;
  confidence: number;
  suggestedRoute?: string;
}

// ============================================================
// FRAUD DETECTION ENGINE
// ============================================================

export async function analyzeFraud(input: FraudCheckInput): Promise<FraudCheckResult> {
  const startTime = Date.now();
  const flags: string[] = [];
  let riskScore = 0;

  // Rule 1: Check if payer wallet is new (no previous transactions)
  const { data: previousTx } = await getSupabaseServer()
    .from("invoices")
    .select("id")
    .eq("status", "paid")
    .or(`recipient.eq.${input.payerWallet}`)
    .limit(5);

  if (!previousTx || previousTx.length === 0) {
    riskScore += 15;
    flags.push("new_wallet: No previous transaction history");
  }

  // Rule 2: Unusually large amount for merchant
  if (input.merchantId) {
    const { data: merchantAvg } = await getSupabaseServer()
      .from("invoices")
      .select("amount")
      .eq("merchant_id", input.merchantId)
      .eq("status", "paid")
      .limit(50);

    if (merchantAvg && merchantAvg.length > 3) {
      const avg = merchantAvg.reduce((sum, inv) => sum + Number(inv.amount), 0) / merchantAvg.length;
      if (input.amount > avg * 5) {
        riskScore += 25;
        flags.push(`high_amount: ${input.amount} is ${(input.amount / avg).toFixed(1)}x merchant average (${avg.toFixed(2)})`);
      } else if (input.amount > avg * 3) {
        riskScore += 10;
        flags.push(`elevated_amount: ${input.amount} is ${(input.amount / avg).toFixed(1)}x merchant average`);
      }
    }
  }

  // Rule 3: Rapid successive payments (velocity check)
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recentTx } = await getSupabaseServer()
    .from("invoices")
    .select("id")
    .eq("status", "paid")
    .gte("paid_at", fiveMinAgo)
    .limit(10);

  if (recentTx && recentTx.length >= 5) {
    riskScore += 20;
    flags.push(`velocity: ${recentTx.length} transactions in last 5 minutes`);
  } else if (recentTx && recentTx.length >= 3) {
    riskScore += 10;
    flags.push(`moderate_velocity: ${recentTx.length} transactions in last 5 minutes`);
  }

  // Rule 4: Self-payment detection
  if (input.payerWallet.toLowerCase() === input.recipientWallet.toLowerCase()) {
    riskScore += 30;
    flags.push("self_payment: Payer and recipient are the same wallet");
  }

  // Rule 5: Round number amounts (common in testing/fraud)
  if (input.amount >= 1000 && input.amount % 100 === 0) {
    riskScore += 5;
    flags.push("round_amount: Suspiciously round number");
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  // Determine risk level and decision
  let riskLevel: RiskLevel;
  let decision: AgentDecision;

  if (riskScore >= 70) {
    riskLevel = "critical";
    decision = "reject";
  } else if (riskScore >= 50) {
    riskLevel = "high";
    decision = "flag";
  } else if (riskScore >= 25) {
    riskLevel = "medium";
    decision = "approve";
  } else {
    riskLevel = "low";
    decision = "approve";
  }

  const confidence = riskScore >= 50 ? 0.85 : riskScore >= 25 ? 0.7 : 0.9;

  const reasoning = flags.length > 0
    ? `Risk score ${riskScore}/100. Flags: ${flags.join("; ")}`
    : `Risk score ${riskScore}/100. No suspicious patterns detected.`;

  // Log decision to database
  const processingTime = Date.now() - startTime;
  await logAgentDecision({
    invoiceId: input.invoiceId,
    decisionType: "fraud_check",
    inputData: input,
    outputData: { riskScore, riskLevel, flags },
    riskScore,
    decision,
    reasoning,
    confidence,
    processingTimeMs: processingTime,
  });

  return { riskScore, riskLevel, decision, reasoning, flags, confidence };
}

// ============================================================
// REFUND DECISION ENGINE
// ============================================================

export async function analyzeRefund(input: RefundDecisionInput): Promise<RefundDecisionResult> {
  const startTime = Date.now();
  let riskScore = 0;
  const reasons: string[] = [];

  // Rule 1: Time since payment (refunds within 1 hour are more likely legit)
  if (input.originalPaidAt) {
    const hoursSincePaid = (Date.now() - new Date(input.originalPaidAt).getTime()) / (1000 * 60 * 60);
    if (hoursSincePaid < 1) {
      riskScore -= 10; // Lower risk, likely legit
      reasons.push("Recent payment (< 1 hour ago)");
    } else if (hoursSincePaid > 72) {
      riskScore += 20;
      reasons.push(`Late refund request (${hoursSincePaid.toFixed(0)} hours after payment)`);
    }
  }

  // Rule 2: Refund amount vs original (partial refunds are less suspicious)
  // For now we only support full refunds, but track this for future
  reasons.push(`Full refund of ${input.amount} ${input.currency}`);

  // Rule 3: Merchant refund history
  const { data: merchantRefunds } = await getSupabaseServer()
    .from("refund_requests")
    .select("id, status")
    .eq("merchant_id", input.merchantId)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (merchantRefunds) {
    const refundCount = merchantRefunds.length;
    if (refundCount > 20) {
      riskScore += 25;
      reasons.push(`High refund volume: ${refundCount} refunds in 30 days`);
    } else if (refundCount > 10) {
      riskScore += 10;
      reasons.push(`Moderate refund volume: ${refundCount} refunds in 30 days`);
    }
  }

  // Rule 4: Cross-chain refund adds complexity/risk
  if (input.destinationChain && input.destinationChain !== "arc") {
    riskScore += 10;
    reasons.push(`Cross-chain refund to ${input.destinationChain}`);
  }

  // Rule 5: Small amounts auto-approve threshold
  if (input.amount <= 5) {
    riskScore -= 15;
    reasons.push("Small amount (auto-approve threshold)");
  }

  // Normalize risk score
  riskScore = Math.max(0, Math.min(100, riskScore));

  // Decision logic
  let decision: AgentDecision;
  if (riskScore <= 20) {
    decision = "approve";
  } else if (riskScore <= 50) {
    decision = "flag"; // Needs manual review
  } else {
    decision = "reject";
  }

  const confidence = riskScore <= 20 ? 0.9 : riskScore <= 50 ? 0.7 : 0.8;
  const reasoning = `Refund risk score ${riskScore}/100. ${reasons.join(". ")}`;

  // Determine optimal route
  const suggestedRoute = input.destinationChain === "arc" || !input.destinationChain
    ? "direct_arc"
    : "cctp_bridge";

  // Log decision
  const processingTime = Date.now() - startTime;
  await logAgentDecision({
    invoiceId: input.invoiceId,
    decisionType: "refund_approval",
    inputData: input,
    outputData: { riskScore, decision, suggestedRoute },
    riskScore,
    decision,
    reasoning,
    confidence,
    processingTimeMs: processingTime,
  });

  return { decision, riskScore, reasoning, confidence, suggestedRoute };
}

// ============================================================
// ROUTING OPTIMIZATION
// ============================================================

export interface RoutingInput {
  amount: number;
  currency: string;
  sourceChain: string;
  destinationChain: string;
}

export interface RoutingResult {
  recommendedRoute: string;
  estimatedFee: number;
  estimatedTime: string;
  reasoning: string;
}

export function optimizeRouting(input: RoutingInput): RoutingResult {
  // Arc native: cheapest and fastest
  if (input.sourceChain === "arc" && input.destinationChain === "arc") {
    return {
      recommendedRoute: "direct_arc",
      estimatedFee: 0.01,
      estimatedTime: "< 1 second",
      reasoning: "Direct Arc transfer. Sub-second finality, ~$0.01 fee.",
    };
  }

  // Cross-chain via CCTP
  if (input.destinationChain !== "arc") {
    const fee = input.amount < 10 ? 0.05 : 0.01 * input.amount * 0.001; // ~0.1% for cross-chain
    return {
      recommendedRoute: "cctp_bridge",
      estimatedFee: Math.max(0.05, fee),
      estimatedTime: "~2-5 minutes",
      reasoning: `Cross-chain via Circle CCTP to ${input.destinationChain}. USDC burned on Arc, minted on destination.`,
    };
  }

  // Nanopayments for tiny amounts
  if (input.amount < 0.01) {
    return {
      recommendedRoute: "nanopayment",
      estimatedFee: 0,
      estimatedTime: "< 1 second",
      reasoning: "Nanopayment: gas-free batched USDC transfer for micro-amounts.",
    };
  }

  return {
    recommendedRoute: "direct_arc",
    estimatedFee: 0.01,
    estimatedTime: "< 1 second",
    reasoning: "Default Arc direct transfer.",
  };
}

// ============================================================
// HELPER: Log decision to database
// ============================================================

async function logAgentDecision(params: {
  invoiceId: string;
  decisionType: DecisionType;
  inputData: unknown;
  outputData: unknown;
  riskScore: number;
  decision: AgentDecision;
  reasoning: string;
  confidence: number;
  processingTimeMs: number;
}) {
  try {
    await getSupabaseServer()
      .from("agent_decisions")
      .insert({
        invoice_id: params.invoiceId,
        decision_type: params.decisionType,
        input_data: params.inputData,
        output_data: params.outputData,
        risk_score: params.riskScore,
        decision: params.decision,
        reasoning: params.reasoning,
        confidence: params.confidence,
        processing_time_ms: params.processingTimeMs,
      });
  } catch (err) {
    // Non-blocking: don't fail the main flow if logging fails
    console.error("[Agent] Failed to log decision:", err);
  }
}

// ============================================================
// HELPER: Update daily metrics
// ============================================================

export async function updateAgentMetrics(merchantId: string, decision: AgentDecision, riskScore: number, processingTimeMs: number) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const supabase = getSupabaseServer();

    // Upsert daily metrics
    const { data: existing } = await supabase
      .from("agent_metrics")
      .select("*")
      .eq("merchant_id", merchantId)
      .eq("metric_date", today)
      .single();

    if (existing) {
      const updates: Record<string, number> = {
        total_decisions: (existing.total_decisions || 0) + 1,
        avg_risk_score: ((existing.avg_risk_score || 0) * (existing.total_decisions || 0) + riskScore) / ((existing.total_decisions || 0) + 1),
        avg_processing_time_ms: ((existing.avg_processing_time_ms || 0) * (existing.total_decisions || 0) + processingTimeMs) / ((existing.total_decisions || 0) + 1),
      };

      if (decision === "flag" || decision === "reject") updates.fraud_flags = (existing.fraud_flags || 0) + 1;
      if (decision === "approve") updates.auto_approvals = (existing.auto_approvals || 0) + 1;
      if (decision === "reject") updates.auto_rejections = (existing.auto_rejections || 0) + 1;

      await supabase
        .from("agent_metrics")
        .update(updates)
        .eq("id", existing.id);
    } else {
      await supabase
        .from("agent_metrics")
        .insert({
          merchant_id: merchantId,
          metric_date: today,
          total_decisions: 1,
          fraud_flags: decision === "flag" || decision === "reject" ? 1 : 0,
          auto_approvals: decision === "approve" ? 1 : 0,
          auto_rejections: decision === "reject" ? 1 : 0,
          avg_risk_score: riskScore,
          avg_processing_time_ms: processingTimeMs,
        });
    }
  } catch (err) {
    console.error("[Agent] Failed to update metrics:", err);
  }
}
