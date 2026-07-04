-- ============================================================
-- Migration 021: Supplier visit request attachment
-- Lets a supplier attach an image or file (e.g. a delivery note,
-- product photo, or ID) when booking a visit, viewable by the admin.
-- ============================================================

ALTER TABLE supplier_visit_requests
    ADD COLUMN IF NOT EXISTS attachment_url  TEXT,
    ADD COLUMN IF NOT EXISTS attachment_name TEXT;
