-- ============================================================
-- Migration 019: Supplier catalog details
-- Extends supplier_products (supplier <-> product link) with
-- per-pair purchasing attributes, so it becomes a proper
-- "supplier catalog entry" instead of a bare link.
-- ============================================================

ALTER TABLE supplier_products
    ADD COLUMN IF NOT EXISTS supplier_sku         VARCHAR(100),
    ADD COLUMN IF NOT EXISTS supplier_item_name    VARCHAR(200),
    ADD COLUMN IF NOT EXISTS purchase_unit         VARCHAR(50),
    ADD COLUMN IF NOT EXISTS currency_id           UUID REFERENCES currencies(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS price                 NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS min_order_qty         INTEGER,
    ADD COLUMN IF NOT EXISTS lead_time_days        INTEGER,
    ADD COLUMN IF NOT EXISTS priority              INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_default            BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS contract_start_date   DATE,
    ADD COLUMN IF NOT EXISTS contract_end_date     DATE;

-- Enforce at most one default supplier per product at the DB level.
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_products_one_default_per_product
    ON supplier_products(product_id) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_supplier_products_currency ON supplier_products(currency_id);
