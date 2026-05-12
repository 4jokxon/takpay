# TakPay

Crosschain invoices and checkout on Arc.

TakPay is a crypto-native payment-link MVP for USDC-native invoices on Arc testnet. It includes a marketing page, invoice dashboard, Supabase-backed invoice storage, and public checkout pages inspired by modern Web3 payment flows.

## Current MVP

- Dark crypto-native landing page
- Supabase-backed invoice dashboard
- Public checkout route: `/pay/[id]`
- Arc testnet metadata
- Injected EVM wallet connection
- Add/switch Arc testnet in wallet
- ERC-20 USDC balance check
- Send Arc USDC via ERC-20 transfer
- Poll transaction receipt and mark invoice paid locally + server-side
- Copyable recipient address and payment URI

## Supabase setup

1. Open your Supabase project SQL Editor.
2. Paste and run `supabase/schema.sql`.
3. Set the values from `.env.example` locally and in Vercel.

Server-only secret: `SUPABASE_SERVICE_ROLE_KEY` must never be committed or exposed in client code.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Quality checks

```bash
npm run lint
npm run build
```

## Next phases

- Verify tx details server-side before marking invoice paid
- Add webhook/receipt system
- Add Arc App Kit crosschain routing
- Add merchant auth and multi-merchant dashboards
