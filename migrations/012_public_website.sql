-- ============================================================
-- Migration 012: Public Website Enhancements
-- Adds columns for dynamic public website display,
-- SEO, featured items, and department visibility controls.
-- ============================================================

-- 1. DEPARTMENTS enhancements ---------------------------------
ALTER TABLE departments ADD COLUMN IF NOT EXISTS display_on_public    BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS icon                 VARCHAR(20);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS slug                 VARCHAR(120) UNIQUE;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS sort_order           INTEGER NOT NULL DEFAULT 0;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS image_url            TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS page_title_ar        VARCHAR(160);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS page_title_en        VARCHAR(160);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS meta_description_ar  TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS meta_description_en  TEXT;

-- Auto-generate slugs for existing departments from name_en
UPDATE departments SET slug = lower(regexp_replace(coalesce(name_en, name_ar), '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;

-- 2. SERVICES enhancements ------------------------------------
ALTER TABLE services ADD COLUMN IF NOT EXISTS display_on_public BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_featured       BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. PRODUCTS enhancements ------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_on_public BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured       BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_display ON services(display_on_public) WHERE display_on_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_services_featured ON services(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_display ON products(display_on_public) WHERE display_on_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
