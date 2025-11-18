-- Migration: add location_type and residence_hall to orders
-- Generated: 2025-11-18

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS location_type TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS residence_hall TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_location_type ON orders (location_type);

COMMIT;
