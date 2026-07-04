-- ============================================================
-- Migration 022: Payment receipts hardening
-- Formalizes the payment_receipts table (previously created ad-hoc
-- inside API route handlers, not tracked in migrations) and adds:
--   - expected_amount: the real order/appointment total computed
--     server-side at submission time, so admins can compare it
--     against what the customer claims to have paid instead of
--     blindly trusting the claimed amount.
--   - verified_by / verified_at: audit trail for who approved or
--     rejected a receipt, and when.
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_receipts (
    id               SERIAL PRIMARY KEY,
    order_id         TEXT,
    appointment_ids  TEXT[],
    customer_name    TEXT NOT NULL DEFAULT '',
    customer_phone   TEXT NOT NULL DEFAULT '',
    receipt_url      TEXT NOT NULL,
    amount           NUMERIC DEFAULT 0,
    payment_method   TEXT DEFAULT 'bank_transfer',
    status           TEXT DEFAULT 'pending',
    notes            TEXT DEFAULT '',
    created_at       TIMESTAMP DEFAULT NOW()
);

ALTER TABLE payment_receipts
    ADD COLUMN IF NOT EXISTS expected_amount NUMERIC,
    ADD COLUMN IF NOT EXISTS verified_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS verified_at     TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_payment_receipts_status   ON payment_receipts(status);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_order_id ON payment_receipts(order_id);
