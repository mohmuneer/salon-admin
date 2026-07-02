-- ============================================================
-- Migration 014: Add bank/payment fields to salon_settings
-- ============================================================

ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS bank_name       TEXT DEFAULT 'البنك الأهلي السعودي',
  ADD COLUMN IF NOT EXISTS account_holder  TEXT DEFAULT 'صالون جلامور',
  ADD COLUMN IF NOT EXISTS iban            TEXT DEFAULT 'SA0000000000000000000000',
  ADD COLUMN IF NOT EXISTS account_number  TEXT DEFAULT '0000000000';

-- Seed default values (update if row exists)
UPDATE salon_settings SET
  bank_name      = COALESCE(NULLIF(bank_name,''),      'البنك الأهلي السعودي'),
  account_holder = COALESCE(NULLIF(account_holder,''), 'صالون جلامور'),
  iban           = COALESCE(NULLIF(iban,''),            'SA0000000000000000000000'),
  account_number = COALESCE(NULLIF(account_number,''), '0000000000')
WHERE id = 1;
