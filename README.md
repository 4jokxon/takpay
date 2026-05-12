# TakPay

Crosschain invoices and checkout on Arc.

TakPay is a crypto-native payment-link MVP for USDC-native invoices on Arc testnet. It includes a marketing page, invoice dashboard, and public checkout page inspired by modern Web3 payment flows.

## Current MVP

- Dark crypto-native landing page
- Demo invoice dashboard
- Public checkout route: `/pay/TK-1001`
- Arc testnet metadata
- Injected EVM wallet connection
- Add/switch Arc testnet in wallet
- Send Arc USDC via ERC-20 transfer
- Poll transaction receipt and mark invoice paid locally
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
