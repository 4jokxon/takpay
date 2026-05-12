# TakPay Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a crypto-native crosschain invoice and checkout MVP for Arc testnet.

**Architecture:** A Next.js App Router app with static demo invoice data for the first MVP, separated library metadata, reusable client copy interactions, and dedicated dashboard/payment pages. Future phases add persistence, wallet connection, Arc App Kit routing, and payment monitoring.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vercel, GitHub.

---

## Task 1: Scaffold app

**Objective:** Create the Next.js TypeScript/Tailwind app and configure Git identity.

**Files:**
- Create: `package.json`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

**Verification:** Run `npm run lint` and `npm run build`.

## Task 2: Add invoice domain model

**Objective:** Define the demo invoice data and Arc testnet metadata.

**Files:**
- Create: `src/lib/invoices.ts`

**Verification:** Import metadata in landing/dashboard/payment pages without TypeScript errors.

## Task 3: Build landing page

**Objective:** Replace the starter page with crypto-native TakPay positioning and a demo checkout card.

**Files:**
- Modify: `src/app/page.tsx`

**Verification:** Visit `/` locally and confirm CTA links to `/dashboard` and `/pay/TK-1001`.

## Task 4: Build dashboard

**Objective:** Add a demo invoice creation form and recent invoice list.

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/CopyButton.tsx`

**Verification:** Visit `/dashboard`, copy links, and open invoice routes.

## Task 5: Build payment page

**Objective:** Add public checkout page for a given invoice ID.

**Files:**
- Create: `src/app/pay/[id]/page.tsx`

**Verification:** Visit `/pay/TK-1001`, confirm amount, memo, recipient, QR placeholder, and copy buttons render.

## Task 6: Ship

**Objective:** Push public GitHub repo and deploy to Vercel.

**Commands:**
- `gh repo create takpay --public --source . --push`
- `vercel --prod` if Vercel CLI is authenticated.

**Verification:** Public GitHub URL and Vercel deployment URL are reachable.
