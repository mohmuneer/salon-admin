-- ============================================================
-- Migration 011: System Enhancements
-- 1. Multi-Currency System
-- 2. Product Department Linking
-- 3. Price Input Validation (no schema changes needed)
-- ============================================================

-- 1. CURRENCIES TABLE -----------------------------------------
CREATE TABLE IF NOT EXISTS currencies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(120) NOT NULL,
    code            VARCHAR(10) NOT NULL UNIQUE,
    symbol          VARCHAR(20) NOT NULL,
    exchange_rate   DECIMAL(12,6) NOT NULL DEFAULT 1.000000,
    decimal_places  INTEGER NOT NULL DEFAULT 2,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default currencies (the system always starts with these)
INSERT INTO currencies (name, code, symbol, exchange_rate, decimal_places, is_active, is_default) VALUES
    ('الريال السعودي', 'SAR', 'ر.س', 1.000000, 2, TRUE, TRUE),
    ('الريال اليمني', 'YER', '﷼', 133.500000, 0, TRUE, FALSE),
    ('الدولار الأمريكي', 'USD', '$', 0.266000, 2, TRUE, FALSE),
    ('الدرهم الإماراتي', 'AED', 'د.إ', 0.979000, 2, TRUE, FALSE),
    ('الدينار الكويتي', 'KWD', 'د.ك', 0.081000, 3, TRUE, FALSE),
    ('اليورو', 'EUR', '€', 0.237000, 2, TRUE, FALSE)
ON CONFLICT (code) DO NOTHING;

-- Ensure only one default currency
CREATE UNIQUE INDEX IF NOT EXISTS idx_currencies_single_default
    ON currencies (is_default) WHERE is_default = TRUE;

-- 2. ADD DEPARTMENT_ID TO PRODUCTS ----------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_department_id ON products(department_id);

-- 3. ADD CURRENCY_ID TO SERVICES & PRODUCTS -------------------
ALTER TABLE services ADD COLUMN IF NOT EXISTS currency_id UUID REFERENCES currencies(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency_id UUID REFERENCES currencies(id) ON DELETE SET NULL;

-- Set default currency (SAR) for all existing records
UPDATE services SET currency_id = (SELECT id FROM currencies WHERE code = 'SAR' LIMIT 1) WHERE currency_id IS NULL;
UPDATE products SET currency_id = (SELECT id FROM currencies WHERE code = 'SAR' LIMIT 1) WHERE currency_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_services_currency_id ON services(currency_id);
CREATE INDEX IF NOT EXISTS idx_products_currency_id ON products(currency_id);
