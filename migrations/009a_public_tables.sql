-- ============================================================
-- Migration 009a: Public-facing tables (offers, ads)
-- Must run BEFORE 010_content_upgrade which ALTERs these tables
-- ============================================================

-- public_offers — promotions and special offers
CREATE TABLE IF NOT EXISTS public_offers (
  id            SERIAL PRIMARY KEY,
  title_ar      TEXT        NOT NULL DEFAULT '',
  title_en      TEXT        NOT NULL DEFAULT '',
  description_ar TEXT       NOT NULL DEFAULT '',
  description_en TEXT       NOT NULL DEFAULT '',
  original_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  offer_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  valid_until   DATE,
  badge         TEXT        NOT NULL DEFAULT '',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMP   DEFAULT NOW()
);

-- public_ads — video/image advertisements for the public site
CREATE TABLE IF NOT EXISTS public_ads (
  id            SERIAL PRIMARY KEY,
  title_ar      TEXT        NOT NULL DEFAULT '',
  title_en      TEXT        NOT NULL DEFAULT '',
  youtube_id    TEXT        NOT NULL DEFAULT '',
  description_ar TEXT       NOT NULL DEFAULT '',
  description_en TEXT       NOT NULL DEFAULT '',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMP   DEFAULT NOW()
);
