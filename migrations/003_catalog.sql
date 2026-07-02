-- ============================================================
-- Migration 003: Catalog (products, categories, services, service_products)
-- NOTE: products is created before services because service_products
--       references both, and services has no hard dependency on products.
-- ============================================================

-- products (3.5 — created early because service_products needs it) ---
CREATE TABLE IF NOT EXISTS products (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id          UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name_ar           VARCHAR(120) NOT NULL,
    brand             VARCHAR(80),
    category          VARCHAR(60),
    description       TEXT,
    price             DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost              DECIMAL(10,2) CHECK (cost >= 0),
    stock_qty         INTEGER NOT NULL DEFAULT 0,
    min_stock_alert   INTEGER NOT NULL DEFAULT 5,
    image_url         TEXT,
    sold_in_store     BOOLEAN NOT NULL DEFAULT FALSE,
    used_in_sessions  BOOLEAN NOT NULL DEFAULT FALSE,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE
);
COMMENT ON COLUMN products.cost IS 'Purchase cost — admin only, never exposed to customers via RLS.';

-- categories --------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar     VARCHAR(80) NOT NULL,
    icon        VARCHAR(10),
    gender      gender_target NOT NULL DEFAULT 'both',
    sort_order  INTEGER NOT NULL DEFAULT 0
);

-- 6. services -------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id       UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
    name_ar        VARCHAR(120) NOT NULL,
    name_en        VARCHAR(120),
    description    TEXT,
    duration_min   SMALLINT NOT NULL CHECK (duration_min > 0),
    price          DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    gender_target  gender_target NOT NULL DEFAULT 'both',
    image_url      TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order     INTEGER NOT NULL DEFAULT 0
);

-- 7. service_products -----------------------------------------
CREATE TABLE IF NOT EXISTS service_products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id          UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty_used            DECIMAL(5,2) NOT NULL CHECK (qty_used > 0),
    is_optional         BOOLEAN NOT NULL DEFAULT FALSE,
    client_can_upgrade  BOOLEAN NOT NULL DEFAULT FALSE,
    extra_price         DECIMAL(10,2) NOT NULL DEFAULT 0,
    UNIQUE (service_id, product_id)
);
COMMENT ON TABLE service_products IS 'Heart of the in-session product-selection feature. 1-5 products per service.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_salon      ON products(salon_id);
CREATE INDEX IF NOT EXISTS idx_products_store      ON products(sold_in_store) WHERE sold_in_store;
CREATE INDEX IF NOT EXISTS idx_services_salon      ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_category   ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_svc_products_svc    ON service_products(service_id);
CREATE INDEX IF NOT EXISTS idx_svc_products_prod   ON service_products(product_id);
