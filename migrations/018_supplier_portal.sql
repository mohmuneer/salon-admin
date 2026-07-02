-- ============================================================
-- Migration 018: Supplier portal login + supplier visit requests
-- ============================================================

-- 1. Supplier login credentials (phone already exists on suppliers)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Visit request status
DO $$ BEGIN
  CREATE TYPE supplier_visit_status AS ENUM ('pending','approved','rejected','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Supplier visit requests (a supplier books a visit to a branch)
CREATE TABLE IF NOT EXISTS supplier_visit_requests (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id  UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    branch_id    UUID REFERENCES salons(id) ON DELETE SET NULL,
    visit_date   DATE NOT NULL,
    visit_time   TIME NOT NULL,
    purpose      TEXT,
    status       supplier_visit_status NOT NULL DEFAULT 'pending',
    admin_notes  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_visit_requests_supplier ON supplier_visit_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_visit_requests_status   ON supplier_visit_requests(status);
CREATE INDEX IF NOT EXISTS idx_supplier_visit_requests_date     ON supplier_visit_requests(visit_date);
