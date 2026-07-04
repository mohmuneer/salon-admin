-- ============================================================
-- Migration 023: Supplier portal theme preference
-- Lets a supplier pick their own site theme for the supplier
-- portal, independent of the salon admin panel's theme.
-- ============================================================

ALTER TABLE suppliers
    ADD COLUMN IF NOT EXISTS theme VARCHAR(20) NOT NULL DEFAULT 'gold';
