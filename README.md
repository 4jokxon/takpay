# TakPay

Crosschain invoices and checkout on Arc.

TakPay is a crypto-native payment-link MVP for USDC-native invoices on Arc testnet. It includes a marketing page, invoice dashboard, and public checkout page inspired by modern Web3 payment flows.

## Current MVP

- Dark crypto-native landing page
- Demo invoice dashboard
- Public checkout route: `/pay/TK-1001`
- Arc testnet metadata
- Copyable recipient address and payment URI
- Demo invoice state: pending/paid

## Next phases

- Persist invoices in Supabase/Postgres
- Add wallet connect with wagmi/viem
- Send USDC on Arc testnet
- Monitor transactions and mark invoices paid
- Add Arc App Kit crosschain routing
- Add merchant webhooks and receipts

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run lint
npm run build
```
