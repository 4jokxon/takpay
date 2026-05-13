-- Merchants table (linked to Supabase auth.users)
create table if not exists public.merchants (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  business_name text not null default '',
  wallet_address text not null check (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  created_at timestamptz not null default now()
);

create index if not exists merchants_email_idx on public.merchants (email);

alter table public.merchants enable row level security;

-- Merchants can only read/update their own row
drop policy if exists "merchants_select_own" on public.merchants;
create policy "merchants_select_own" on public.merchants
  for select using (auth.uid() = id);

drop policy if exists "merchants_insert_own" on public.merchants;
create policy "merchants_insert_own" on public.merchants
  for insert with check (auth.uid() = id);

drop policy if exists "merchants_update_own" on public.merchants;
create policy "merchants_update_own" on public.merchants
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Add merchant_id to invoices
alter table public.invoices add column if not exists merchant_id uuid references public.merchants(id);
create index if not exists invoices_merchant_id_idx on public.invoices (merchant_id);

-- Update RLS policies for invoices
-- Public can still read (for payment pages), but only merchant can insert/update their own
drop policy if exists "public can read invoices" on public.invoices;
create policy "public_read_invoices" on public.invoices
  for select using (true);

drop policy if exists "anon cannot insert invoices" on public.invoices;
drop policy if exists "anon cannot update invoices" on public.invoices;

-- Authenticated merchants can insert invoices with their own merchant_id
drop policy if exists "merchant_insert_invoices" on public.invoices;
create policy "merchant_insert_invoices" on public.invoices
  for insert to authenticated
  with check (merchant_id = auth.uid());

-- Authenticated merchants can update their own invoices
drop policy if exists "merchant_update_invoices" on public.invoices;
create policy "merchant_update_invoices" on public.invoices
  for update to authenticated
  using (merchant_id = auth.uid())
  with check (merchant_id = auth.uid());

-- Service role can still do everything (for payment verification API)
drop policy if exists "service_role_all" on public.invoices;
create policy "service_role_all" on public.invoices
  for all to service_role
  using (true)
  with check (true);
