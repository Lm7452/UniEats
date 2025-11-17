-- Migration: add stripe_payment_id to orders
-- Generated: 2025-11-16

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_id ON orders (stripe_payment_id);

COMMIT;
