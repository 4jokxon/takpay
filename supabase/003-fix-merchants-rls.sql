-- Fix: allow service_role full access to merchants table
-- Run this in Supabase SQL Editor

drop policy if exists "service_role_merchants_all" on public.merchants;
create policy "service_role_merchants_all" on public.merchants
  for all to service_role
  using (true)
  with check (true);
