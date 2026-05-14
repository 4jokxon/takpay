-- TakPay AI Agent Schema
-- Run this in Supabase SQL Editor

-- Agent decisions log: every decision the AI agent makes
CREATE TABLE IF NOT EXISTS public.agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT REFERENCES public.invoices(id),
  decision_type TEXT NOT NULL CHECK (decision_type IN ('fraud_check', 'refund_approval', 'routing_optimization')),
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB NOT NULL DEFAULT '{}',
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  decision TEXT NOT NULL CHECK (decision IN ('approve', 'reject', 'flag', 'route')),
  reasoning TEXT,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refund requests table
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT NOT NULL REFERENCES public.invoices(id),
  merchant_id UUID REFERENCES public.merchants(id),
  requester_wallet TEXT NOT NULL,
  amount DECIMAL NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USDC' CHECK (currency IN ('USDC', 'EURC')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed')),
  agent_decision_id UUID REFERENCES public.agent_decisions(id),
  destination_chain TEXT DEFAULT 'arc' CHECK (destination_chain IN ('arc', 'ethereum', 'polygon', 'arbitrum', 'base')),
  destination_wallet TEXT,
  refund_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Agent metrics: aggregated stats for dashboard
CREATE TABLE IF NOT EXISTS public.agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_decisions INTEGER DEFAULT 0,
  fraud_flags INTEGER DEFAULT 0,
  auto_approvals INTEGER DEFAULT 0,
  auto_rejections INTEGER DEFAULT 0,
  avg_risk_score DECIMAL(5,2) DEFAULT 0,
  avg_processing_time_ms INTEGER DEFAULT 0,
  total_refunds_processed DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(merchant_id, metric_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_decisions_invoice ON public.agent_decisions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_type ON public.agent_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_created ON public.agent_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refund_requests_invoice ON public.refund_requests(invoice_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_merchant ON public.refund_requests(merchant_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_merchant_date ON public.agent_metrics(merchant_id, metric_date DESC);

-- RLS policies
ALTER TABLE public.agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_metrics ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (API routes use service role)
CREATE POLICY "service_role_agent_decisions" ON public.agent_decisions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_refund_requests" ON public.refund_requests
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_agent_metrics" ON public.agent_metrics
  FOR ALL USING (true) WITH CHECK (true);
