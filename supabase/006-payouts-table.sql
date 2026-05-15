-- Payouts table: track merchant withdrawals from TakPay pool
-- Used for balance tracking (prevent over-withdrawal)

CREATE TABLE IF NOT EXISTS payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES merchants(id),
  amount numeric NOT NULL,
  destination_address text NOT NULL,
  circle_tx_id text,
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Index for fast merchant balance lookups
CREATE INDEX IF NOT EXISTS idx_payouts_merchant_status ON payouts(merchant_id, status);

-- RLS: merchants can only see their own payouts
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own payouts"
  ON payouts FOR SELECT
  USING (merchant_id = auth.uid());
