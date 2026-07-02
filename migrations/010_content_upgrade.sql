-- ============================================================
-- Migration 010: Content Management Upgrade
-- Adds all tables/columns needed for the integrated marketing
-- platform transformation.
-- ============================================================

-- ============================================================
-- 1. UPGRADE public_offers — images, CTA, discount, SEO, etc.
-- ============================================================
ALTER TABLE public_offers
  ADD COLUMN IF NOT EXISTS image_url            TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery              JSONB       DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS before_after         JSONB       DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS cta_text             TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cta_link             TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cta_action           TEXT        NOT NULL DEFAULT 'book'
                    CHECK (cta_action IN ('book','whatsapp','link','details')),
  ADD COLUMN IF NOT EXISTS linked_service_id    UUID        REFERENCES services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS countdown_end        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_number      TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp_message     TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS branch_id            UUID        REFERENCES salons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seo_title            TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description      TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS views_count          INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks_count         INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bookings_count       INTEGER     NOT NULL DEFAULT 0;

-- ============================================================
-- 2. UPGRADE public_ads — full YouTube URL, image, branch
-- ============================================================
ALTER TABLE public_ads
  ADD COLUMN IF NOT EXISTS youtube_url          TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url            TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS branch_id            UUID        REFERENCES salons(id) ON DELETE SET NULL;

-- ============================================================
-- 3. UPGRADE salon_settings — WhatsApp, SEO, Social
-- ============================================================
ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS whatsapp_number      TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp_message     TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_title            TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description      TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_keywords         TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_image            TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram            TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS twitter              TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS snapchat             TEXT        NOT NULL DEFAULT '';

-- ============================================================
-- 4. public_reviews — customer testimonials
-- ============================================================
CREATE TABLE IF NOT EXISTS public_reviews (
  id            SERIAL PRIMARY KEY,
  customer_name TEXT        NOT NULL DEFAULT '',
  customer_avatar TEXT      NOT NULL DEFAULT '',
  rating        INTEGER     NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment_ar    TEXT        NOT NULL DEFAULT '',
  comment_en    TEXT        NOT NULL DEFAULT '',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMP   DEFAULT NOW()
);

-- ============================================================
-- 5. public_banner — hero section management
-- ============================================================
CREATE TABLE IF NOT EXISTS public_banner (
  id            SERIAL PRIMARY KEY,
  title_ar      TEXT        NOT NULL DEFAULT '',
  title_en      TEXT        NOT NULL DEFAULT '',
  subtitle_ar   TEXT        NOT NULL DEFAULT '',
  subtitle_en   TEXT        NOT NULL DEFAULT '',
  image_url     TEXT        NOT NULL DEFAULT '',
  video_url     TEXT        NOT NULL DEFAULT '',
  cta_text_ar   TEXT        NOT NULL DEFAULT '',
  cta_text_en   TEXT        NOT NULL DEFAULT '',
  cta_link      TEXT        NOT NULL DEFAULT '',
  cta_action    TEXT        NOT NULL DEFAULT 'book'
                CHECK (cta_action IN ('book','whatsapp','link','services')),
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMP   DEFAULT NOW()
);

-- ============================================================
-- 6. public_coupons — discount coupon codes
-- ============================================================
CREATE TABLE IF NOT EXISTS public_coupons (
  id              SERIAL PRIMARY KEY,
  code            TEXT        NOT NULL UNIQUE,
  discount_percent NUMERIC(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_uses        INTEGER     NOT NULL DEFAULT 0,
  used_count      INTEGER     NOT NULL DEFAULT 0,
  valid_from      DATE,
  valid_until     DATE,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMP   DEFAULT NOW()
);

-- ============================================================
-- 7. public_analytics — detailed view/click tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public_analytics (
  id            SERIAL PRIMARY KEY,
  source_type   TEXT        NOT NULL CHECK (source_type IN ('offer','ad','service','product')),
  source_id     INTEGER     NOT NULL,
  action        TEXT        NOT NULL CHECK (action IN ('view','click','book','share')),
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_source ON public_analytics(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date   ON public_analytics(created_at);

-- ============================================================
-- 8. public_whatsapp_config — WhatsApp quick config
-- ============================================================
CREATE TABLE IF NOT EXISTS public_whatsapp_config (
  id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  number      TEXT    NOT NULL DEFAULT '',
  message     TEXT    NOT NULL DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO public_whatsapp_config (id, number, message)
VALUES (1, '', 'مرحباً، أرغب بالاستفسار عن الخدمات')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. public_page_meta — SEO meta tags for the public page
-- ============================================================
CREATE TABLE IF NOT EXISTS public_page_meta (
  id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title_ar    TEXT    NOT NULL DEFAULT '',
  title_en    TEXT    NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  keywords_ar TEXT    NOT NULL DEFAULT '',
  keywords_en TEXT    NOT NULL DEFAULT '',
  og_image    TEXT    NOT NULL DEFAULT '',
  updated_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO public_page_meta (id, title_ar, title_en)
VALUES (1, '', '')
ON CONFLICT (id) DO NOTHING;
