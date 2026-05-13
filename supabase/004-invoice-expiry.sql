-- Invoice expiry: add expires_at column
-- Run this in Supabase SQL Editor

alter table public.invoices add column if not exists expires_at timestamptz;

-- Default: invoices created from now on expire in 24 hours
-- (existing invoices will have NULL = no expiry)
comment on column public.invoices.expires_at is 'When this invoice expires. NULL means no expiry.';
