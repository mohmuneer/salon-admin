-- ============================================================
-- Migration 004: Bookings (appointments, appointment_products, reviews)
-- ============================================================

-- 8. appointments ---------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id         UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    staff_id            UUID NOT NULL REFERENCES staff(id)    ON DELETE RESTRICT,
    service_id          UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    salon_id            UUID NOT NULL REFERENCES salons(id)   ON DELETE RESTRICT,
    date                DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,            -- auto-set by trigger
    status              appt_status NOT NULL DEFAULT 'pending',
    service_price       DECIMAL(10,2) NOT NULL CHECK (service_price >= 0),
    products_price      DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (products_price >= 0),
    total               DECIMAL(10,2) GENERATED ALWAYS AS (service_price + products_price) STORED,
    notes               TEXT,
    cancellation_reason TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON COLUMN appointments.end_time IS 'Auto-computed: start_time + services.duration_min via trigger.';

-- 9. appointment_products -------------------------------------
CREATE TABLE IF NOT EXISTS appointment_products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id)     ON DELETE RESTRICT,
    qty             DECIMAL(5,2) NOT NULL CHECK (qty > 0),
    unit_price      DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    type            appt_product_type NOT NULL
);
COMMENT ON TABLE appointment_products IS 'Stock decremented via trigger when appointment status -> completed.';

-- 10. reviews -------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id  UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    staff_id        UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    is_visible      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appt_customer   ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appt_staff_date ON appointments(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_appt_status     ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appt_prods_appt ON appointment_products(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_staff   ON reviews(staff_id);

-- Prevent the same staff being double-booked at the same date/time
-- (excludes cancelled / no_show which free the slot)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_staff_slot
    ON appointments(staff_id, date, start_time)
    WHERE status NOT IN ('cancelled','no_show');
