-- ============================================================
-- Migration 008: salon_settings (single-row settings table)
-- يستخدمه ADMIN + CUSTOMER لإعدادات الصالون
-- ============================================================

CREATE TABLE IF NOT EXISTS salon_settings (
    id           INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    name         TEXT        NOT NULL,
    name_en      TEXT,
    logo_url     TEXT,
    address      TEXT,
    city         TEXT,
    phone        TEXT,
    email        TEXT,
    opening_time TIME,
    closing_time TIME,
    theme        TEXT        NOT NULL DEFAULT 'gold'
                 CHECK (theme IN ('gold', 'blue', 'emerald', 'rose')),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- الصف الافتراضي (مرة واحدة فقط)
INSERT INTO salon_settings (id, name, theme)
VALUES (1, 'اسم الصالون', 'gold')
ON CONFLICT (id) DO NOTHING;

-- تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION set_salon_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_salon_settings_updated_at ON salon_settings;
CREATE TRIGGER trg_salon_settings_updated_at
    BEFORE UPDATE ON salon_settings
    FOR EACH ROW
    EXECUTE FUNCTION set_salon_settings_updated_at();
