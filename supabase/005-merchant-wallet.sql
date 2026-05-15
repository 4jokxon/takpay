-- Add merchant_wallet column to invoices table
-- This stores the merchant's actual wallet address for payout disbursement
-- The invoice recipient field now points to TakPay's Circle settlement wallet

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS merchant_wallet text;

-- Backfill: for existing invoices, copy recipient to merchant_wallet
-- (since previously recipient WAS the merchant wallet)
UPDATE invoices SET merchant_wallet = recipient WHERE merchant_wallet IS NULL;
