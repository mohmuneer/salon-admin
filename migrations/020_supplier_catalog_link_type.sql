-- ============================================================
-- Migration 020: Supplier catalog link type & group support
-- Adds link_type ('single'|'group') and group_id to track
-- whether a supplier-product link was created as part of a
-- whole-group operation or as an individual product link.
-- ============================================================

ALTER TABLE supplier_products
    ADD COLUMN IF NOT EXISTS link_type    VARCHAR(10) NOT NULL DEFAULT 'single',
    ADD COLUMN IF NOT EXISTS group_id     UUID REFERENCES product_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_supplier_products_link_type ON supplier_products(link_type);
CREATE INDEX IF NOT EXISTS idx_supplier_products_group_id  ON supplier_products(group_id);
