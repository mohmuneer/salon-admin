-- ============================================================
-- Migration 002: Staff group (staff, working_hours, staff_leaves)
-- ============================================================

-- 3. staff -----------------------------------------------------
CREATE TABLE IF NOT EXISTS staff (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    salon_id       UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    specialty      VARCHAR(100) NOT NULL,
    gender_served  gender_served NOT NULL DEFAULT 'both',
    bio            TEXT,
    rating         DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    reviews_count  INTEGER      NOT NULL DEFAULT 0,
    sort_order     INTEGER      NOT NULL DEFAULT 0,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    UNIQUE (user_id)  -- one staff profile per user account
);
COMMENT ON COLUMN staff.gender_served IS 'Controls visibility at booking time — female staff hidden from gents services.';

-- 4. working_hours --------------------------------------------
CREATE TABLE IF NOT EXISTS working_hours (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id    UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun ... 6=Sat
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    is_day_off  BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (staff_id, day_of_week),
    CHECK (is_day_off OR end_time > start_time)
);
COMMENT ON TABLE working_hours IS '7 rows per staff (one per day). Free slots = working range minus existing appointments.';

-- 5. staff_leaves ---------------------------------------------
CREATE TABLE IF NOT EXISTS staff_leaves (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id    UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    leave_date  DATE NOT NULL,
    reason      TEXT,
    created_by  UUID REFERENCES users(id),
    UNIQUE (staff_id, leave_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_salon          ON staff(salon_id);
CREATE INDEX IF NOT EXISTS idx_staff_active         ON staff(is_active);
CREATE INDEX IF NOT EXISTS idx_working_hours_staff  ON working_hours(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_leaves_lookup  ON staff_leaves(staff_id, leave_date);
