-- ============================================================
-- Migration 024: Order Type — Unified checkout for products & services
-- Adds order_type to orders, extends order_items for services,
-- links appointments to orders.
-- ============================================================

-- 1. New ENUM: order_type
DO $$ BEGIN
  CREATE TYPE order_type AS ENUM ('product', 'service', 'mixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Extend order_status ENUM with service-specific statuses
DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ready';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Add order_type column to orders (defaults to 'product' for backward compat)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type order_type NOT NULL DEFAULT 'product';

-- 4. Add order_id FK to appointments (nullable — product-only orders have no appointment)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_appt_order ON appointments(order_id);

-- 5. Extend order_items to support service line items
--    product_id becomes nullable (NULL for service items)
ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE RESTRICT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) NOT NULL DEFAULT 'product';
ALTER TABLE order_items ADD CONSTRAINT chk_item_type CHECK (item_type IN ('product', 'service'));

-- 6. Add VAT column to orders for future tax support
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vat DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (vat >= 0);

-- 7. Add order_type to payment_receipts for filtering
ALTER TABLE payment_receipts ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'product';

-- 8. Index for filtering by order type
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);
