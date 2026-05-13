-- Security fixes: add webhook_secret, unique constraint on paid_tx_hash
-- Run this in Supabase SQL Editor

-- Webhook HMAC signing secret per merchant
alter table public.merchants add column if not exists webhook_secret text;

-- Prevent tx hash replay: same tx can't pay multiple invoices
create unique index if not exists idx_invoices_paid_tx_hash 
  on public.invoices (paid_tx_hash) 
  where paid_tx_hash is not null;
