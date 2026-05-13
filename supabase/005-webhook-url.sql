-- Webhook support: add webhook_url to merchants
-- Run this in Supabase SQL Editor

alter table public.merchants add column if not exists webhook_url text;
comment on column public.merchants.webhook_url is 'URL to POST payment notifications to';
