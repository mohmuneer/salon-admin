-- Migration 012: Media Gallery Enhancement

-- 1. Product images table
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- Ensure only one primary per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_unique_primary
  ON product_images(product_id) WHERE is_primary = true;

-- 2. Service images table
CREATE TABLE IF NOT EXISTS service_images (
  id SERIAL PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  image_type TEXT NOT NULL DEFAULT 'gallery' CHECK (image_type IN ('cover', 'before', 'after', 'gallery')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_images_service ON service_images(service_id);

-- 3. Offer image enhancements (add mobile banner & thumbnail columns)
ALTER TABLE public_offers ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;
ALTER TABLE public_offers ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 4. Add max_file_size to salon_settings
ALTER TABLE salon_settings ADD COLUMN IF NOT EXISTS max_file_size INTEGER DEFAULT 5;

-- 5. Settings table for image defaults
CREATE TABLE IF NOT EXISTS media_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  max_file_size INTEGER DEFAULT 5,
  allowed_types TEXT[] DEFAULT ARRAY['jpg','jpeg','png','webp'],
  auto_compress BOOLEAN DEFAULT true,
  generate_thumbnails BOOLEAN DEFAULT true,
  thumbnail_width INTEGER DEFAULT 150,
  thumbnail_height INTEGER DEFAULT 150,
  quality INTEGER DEFAULT 80,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO media_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;