# TakPay

Crosschain invoices and checkout on Arc.

TakPay is a crypto-native payment-link platform for USDC-native invoices on Arc testnet. Merchants can sign up, create invoices, share checkout links, and track payments — all settled on Arc with sub-second finality.

**Live:** https://takpay.vercel.app

## Features

- Dark crypto-native landing page
- Merchant auth (email/password via Supabase Auth)
- Merchant dashboard — scoped to your own invoices
- Create invoices with custom amount, currency, memo, recipient
- Public checkout route: `/pay/[id]`
- Arc testnet EVM wallet connection
- ERC-20 USDC balance check + transfer
- Transaction verification + auto status update
- Receipt page with tx proof
- Row-level security (merchants only see their own data)

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Chain:** Arc Testnet (chain ID 5042002)
- **Deploy:** Vercel

## Setup

### 1. Clone & install

```bash
git clone https://github.com/4jokxon/takpay.git
cd takpay
npm install
cp .env.example .env.local
```

### 2. Environment variables

```
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only — never expose in client code.

### 3. Database migrations

Run these in order in Supabase SQL Editor:

1. `supabase/schema.sql` — invoices table + base RLS
2. `supabase/002-merchants.sql` — merchants table, merchant_id on invoices, updated RLS

### 4. Supabase Auth config

In Supabase Dashboard → Authentication → Settings:
- Email auth: enabled
- Confirm email: disable for testnet dev (optional)

### 5. Run

```bash
npm run dev
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/signup` | Merchant registration |
| `/login` | Merchant sign in |
| `/dashboard` | Protected merchant dashboard |
| `/pay/[id]` | Public checkout page |
| `/receipt/[id]` | Payment receipt |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/invoices/[id]/submit` | POST | Submit tx hash for verification |
| `/api/invoices/[id]/pay` | POST | Mark invoice as paid (after verification) |
| `/api/merchants/register` | POST | Create merchant profile on signup |

## Quality checks

```bash
npm run lint
npm run build
```

## Roadmap

- [x] Invoice creation + payment flow
- [x] Merchant auth + dashboard scoping
- [ ] Webhook notifications (notify merchant on payment)
- [ ] Invoice expiry (auto-expire after X hours)
- [ ] Crosschain payments via Reown AppKit
- [ ] Refund flow
- [ ] Better mobile responsive + loading states
