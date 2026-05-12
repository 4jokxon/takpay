create extension if not exists pgcrypto;

create table if not exists public.invoices (
  id text primary key,
  amount numeric(18,6) not null check (amount > 0),
  currency text not null check (currency in ('USDC','EURC')),
  memo text not null default '',
  recipient text not null,
  status text not null default 'pending' check (status in ('pending','submitted','paid','expired')),
  paid_tx_hash text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.invoices drop constraint if exists invoices_status_check;
  alter table public.invoices add constraint invoices_status_check check (status in ('pending','submitted','paid','expired'));
end $$;

create index if not exists invoices_created_at_idx on public.invoices (created_at desc);
create index if not exists invoices_status_idx on public.invoices (status);

alter table public.invoices enable row level security;

drop policy if exists "public can read invoices" on public.invoices;
create policy "public can read invoices"
on public.invoices
for select
using (true);

drop policy if exists "anon cannot insert invoices" on public.invoices;
create policy "anon cannot insert invoices"
on public.invoices
for insert
to anon
with check (false);

drop policy if exists "anon cannot update invoices" on public.invoices;
create policy "anon cannot update invoices"
on public.invoices
for update
to anon
using (false)
with check (false);