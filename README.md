# TakPay

Crosschain stablecoin payment platform on Arc Network.

TakPay is a crypto-native payment processor for USDC invoices on Arc testnet. Merchants create payment links, customers pay via wallet connect, and funds are automatically settled through Circle's Developer-Controlled Wallet infrastructure.

**Live:** https://takpay.vercel.app  
**Repo:** https://github.com/4jokxon/takpay

## Features

### Payment Flow
- Merchant creates invoice with amount, currency, memo
- Payer receives checkout link (`/pay/[id]`)
- Payment goes to TakPay settlement pool (Circle wallet)
- On-chain verification triggers auto-settlement to merchant wallet
- Receipt page with tx proof (`/receipt/[id]`)

### AI Payment Intelligence Agent
- Real-time fraud detection with risk scoring (0-100)
- Auto-approve/reject based on velocity checks, amount anomalies, self-payment detection
- Cross-chain refund routing via CCTP (Circle Cross-Chain Transfer Protocol)
- Agent dashboard with metrics and decision log (`/agent`)

### Circle Integration
- Developer-Controlled Wallet as settlement pool
- Automatic USDC disbursement to merchants after payment verification
- Balance tracking with payout entitlement enforcement
- Cross-chain transfers via BridgeKit (Arc, Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Polygon Amoy)

### Security
- EIP-191 signature verification for API authentication
- Supabase session + same-origin fallback auth
- Replay prevention on payment submission
- Balance/entitlement check on withdrawals (merchants can only withdraw earned amounts)
- Row-level security (merchants only see their own data)
- Fraud detection blocks critical-risk payments (score 70+)

### Merchant Tools
- Email/password auth via Supabase
- Dashboard scoped to merchant's invoices
- Invoice expiry (auto-expire after 24 hours)
- Webhook notifications on payment events
- Manual payout requests via API

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Wallet:** Reown AppKit + wagmi + viem
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Settlement:** Circle Developer-Controlled Wallets SDK
- **Cross-chain:** Circle BridgeKit (CCTP)
- **Chain:** Arc Testnet (chain ID 5042002, USDC-native)
- **Deploy:** Vercel

## Architecture

```
Payer -> /pay/[id] -> Wallet Connect -> Transfer USDC to Pool
                                              |
                                    On-chain verification
                                              |
                                    Fraud detection (AI agent)
                                              |
                                    Auto-settle to merchant wallet
                                       (Circle SDK transfer)
```

## Setup

### 1. Clone and install

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
CIRCLE_API_KEY=your-circle-api-key
CIRCLE_ENTITY_SECRET=your-entity-secret
CIRCLE_WALLET_ID=your-wallet-id
CIRCLE_WALLET_ADDRESS=your-wallet-address
NEXT_PUBLIC_REOWN_PROJECT_ID=your-reown-project-id
```

### 3. Database migrations

Run in order in Supabase SQL Editor:

1. `supabase/schema.sql` - invoices table + base RLS
2. `supabase/002-merchants.sql` - merchants table, merchant_id, updated RLS
3. `supabase/004-invoice-expiry.sql` - expires_at column
4. `supabase/005-merchant-wallet.sql` - merchant_wallet column for settlement
5. `supabase/006-payouts-table.sql` - payouts tracking table
6. `supabase/agent-schema.sql` - AI agent decisions, refund requests, metrics

### 4. Run

```bash
npm run dev
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/signup` | Merchant registration |
| `/login` | Merchant sign in |
| `/dashboard` | Merchant dashboard (invoices, create, payout) |
| `/pay/[id]` | Public checkout page |
| `/receipt/[id]` | Payment receipt with tx proof |
| `/agent` | AI Payment Intelligence dashboard |

## API Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/invoices/create` | POST | Merchant | Create new invoice |
| `/api/invoices/list` | GET | Merchant | List merchant's invoices |
| `/api/invoices/[id]/submit` | POST | Public | Submit tx hash (with replay check) |
| `/api/invoices/[id]/pay` | POST | Public | Verify payment + auto-settle |
| `/api/invoices/[id]/verify` | POST | Public | Alternative verify + fraud check + settle |
| `/api/wallet/balance` | GET | Merchant | Pool wallet balance |
| `/api/wallet/transfer` | POST | Merchant | Request payout (with balance check) |
| `/api/wallet/transaction/[id]` | GET | Public | Check Circle transfer status |
| `/api/agent/analyze` | POST | Merchant | Run fraud analysis on invoice |
| `/api/agent/refund` | POST | Merchant | Request AI-powered refund |
| `/api/agent/bridge` | POST/PATCH | Merchant | Cross-chain CCTP transfer |
| `/api/agent/metrics` | GET | Merchant | Agent performance metrics |
| `/api/merchants/register` | POST | Public | Create merchant on signup |
| `/api/merchants/wallet-auth` | POST | Public | Wallet-based auth |
| `/api/merchants/webhook` | POST | Merchant | Configure webhook URL |

## Hackathon Criteria (Agora)

- **30% Agentic Sophistication:** AI makes real decisions (fraud scoring, refund approval, route optimization)
- **30% Traction:** Live product with working payment flow
- **20% Circle Tool Usage:** Developer-Controlled Wallets, BridgeKit, CCTP, Forwarder, Arc Testnet
- **20% Innovation:** AI-powered payment intelligence + auto-settlement + cross-chain refunds

## Quality checks

```bash
npm run lint
npm run build
```
