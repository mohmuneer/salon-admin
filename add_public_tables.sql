-- جدول العروض للصفحة العامة
CREATE TABLE IF NOT EXISTS public_offers (
  id SERIAL PRIMARY KEY,
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  original_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  offer_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  valid_until DATE,
  badge TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول الإعلانات للصفحة العامة
CREATE TABLE IF NOT EXISTS public_ads (
  id SERIAL PRIMARY KEY,
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  youtube_id TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
