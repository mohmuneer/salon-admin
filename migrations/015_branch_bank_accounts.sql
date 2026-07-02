-- ============================================================
-- Migration 015: Branch bank accounts (multiple per branch)
-- ============================================================

CREATE TABLE IF NOT EXISTS branch_bank_accounts (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id      UUID        NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  bank_name      TEXT        NOT NULL,
  account_holder TEXT        NOT NULL,
  iban           TEXT        NOT NULL,
  account_number TEXT,
  swift_code     TEXT,
  currency       TEXT        NOT NULL DEFAULT 'SAR',
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  is_default     BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one default per branch
CREATE UNIQUE INDEX IF NOT EXISTS idx_branch_bank_default
  ON branch_bank_accounts (branch_id)
  WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_branch_bank_branch ON branch_bank_accounts(branch_id);

-- Seed: create a default account for the main branch
INSERT INTO branch_bank_accounts (branch_id, bank_name, account_holder, iban, account_number, is_default, sort_order)
SELECT id, 'البنك الأهلي السعودي', name, 'SA0000000000000000000000', '0000000000', TRUE, 1
FROM salons
LIMIT 1
ON CONFLICT DO NOTHING;
