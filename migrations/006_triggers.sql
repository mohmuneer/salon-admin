-- ============================================================
-- Migration 006: Functions & Triggers (System logic, spec section 7)
-- ============================================================

-- ------------------------------------------------------------
-- 7.x  Auto-compute appointment end_time = start + duration
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_appointment_end_time()
RETURNS TRIGGER AS $$
DECLARE
    svc_duration SMALLINT;
BEGIN
    SELECT duration_min INTO svc_duration FROM services WHERE id = NEW.service_id;
    IF svc_duration IS NULL THEN
        RAISE EXCEPTION 'Service % not found', NEW.service_id;
    END IF;
    NEW.end_time := NEW.start_time + (svc_duration || ' minutes')::interval;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointment_end_time ON appointments;
CREATE TRIGGER trg_appointment_end_time
    BEFORE INSERT OR UPDATE OF start_time, service_id ON appointments
    FOR EACH ROW EXECUTE FUNCTION set_appointment_end_time();

-- ------------------------------------------------------------
-- 7.2  Stock decrement on appointment completion
--      Fires only on transition INTO 'completed'.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION decrement_stock_on_complete()
RETURNS TRIGGER AS $$
DECLARE
    ap        RECORD;
    new_qty   INTEGER;
    prod_name TEXT;
    salon     UUID;
    admin_id  UUID;
BEGIN
    IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
        FOR ap IN
            SELECT product_id, qty FROM appointment_products WHERE appointment_id = NEW.id
        LOOP
            UPDATE products
               SET stock_qty = stock_qty - ap.qty
             WHERE id = ap.product_id
            RETURNING stock_qty, name_ar, salon_id INTO new_qty, prod_name, salon;

            IF new_qty < 0 THEN
                RAISE EXCEPTION 'Insufficient stock for product % (would be %)', prod_name, new_qty;
            END IF;

            -- Low-stock alert to salon admins
            IF new_qty <= (SELECT min_stock_alert FROM products WHERE id = ap.product_id) THEN
                FOR admin_id IN
                    SELECT u.id FROM users u
                    JOIN staff s ON s.user_id = u.id
                    WHERE u.role = 'admin' AND s.salon_id = salon
                LOOP
                    INSERT INTO notifications (user_id, type, title_ar, body_ar, data)
                    VALUES (admin_id, 'stock_alert',
                            'تنبيه نقص المخزون',
                            'المنتج "' || prod_name || '" وصل إلى ' || new_qty || ' وحدة',
                            jsonb_build_object('product_id', ap.product_id, 'stock_qty', new_qty));
                END LOOP;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stock_on_complete ON appointments;
CREATE TRIGGER trg_stock_on_complete
    AFTER UPDATE OF status ON appointments
    FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_complete();

-- ------------------------------------------------------------
-- 7.3  Recompute staff rating on review insert/update/delete
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_staff_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_staff UUID := COALESCE(NEW.staff_id, OLD.staff_id);
BEGIN
    UPDATE staff s
       SET rating = COALESCE(agg.avg_rating, 0),
           reviews_count = COALESCE(agg.cnt, 0)
      FROM (
          SELECT ROUND(AVG(rating)::numeric, 2) AS avg_rating, COUNT(*) AS cnt
          FROM reviews
          WHERE staff_id = target_staff AND is_visible = TRUE
      ) agg
     WHERE s.id = target_staff;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_rating ON reviews;
CREATE TRIGGER trg_refresh_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION refresh_staff_rating();

-- ------------------------------------------------------------
-- 7.1  Available-slots function
--   Returns bookable start times for a staff member on a date,
--   given a service duration. Honours working_hours, day-off,
--   leaves, existing appointments, and (if today) past times.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_available_slots(
    p_staff_id   UUID,
    p_date       DATE,
    p_service_id UUID,
    p_step_min   INT DEFAULT NULL   -- slot granularity; defaults to service duration
)
RETURNS TABLE(slot_start TIME, slot_end TIME) AS $$
DECLARE
    v_dow        SMALLINT := EXTRACT(DOW FROM p_date);  -- 0=Sun..6=Sat
    v_start      TIME;
    v_end        TIME;
    v_off        BOOLEAN;
    v_duration   INT;
    v_step       INT;
    cur          TIME;
    cur_end      TIME;
BEGIN
    -- service duration
    SELECT duration_min INTO v_duration FROM services WHERE id = p_service_id;
    IF v_duration IS NULL THEN RETURN; END IF;
    v_step := COALESCE(p_step_min, v_duration);

    -- working hours for that weekday
    SELECT start_time, end_time, is_day_off
      INTO v_start, v_end, v_off
      FROM working_hours
     WHERE staff_id = p_staff_id AND day_of_week = v_dow;

    IF NOT FOUND OR v_off THEN RETURN; END IF;

    -- leave on that date?
    IF EXISTS (SELECT 1 FROM staff_leaves WHERE staff_id = p_staff_id AND leave_date = p_date) THEN
        RETURN;
    END IF;

    cur := v_start;
    WHILE cur + (v_duration || ' minutes')::interval <= v_end LOOP
        cur_end := cur + (v_duration || ' minutes')::interval;

        -- skip if overlaps any active appointment
        IF NOT EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.staff_id = p_staff_id
              AND a.date = p_date
              AND a.status NOT IN ('cancelled','no_show')
              AND cur < a.end_time AND cur_end > a.start_time
        )
        -- skip past times if booking for today
        AND NOT (p_date = CURRENT_DATE AND cur <= CURRENT_TIME)
        THEN
            slot_start := cur;
            slot_end   := cur_end;
            RETURN NEXT;
        END IF;

        cur := cur + (v_step || ' minutes')::interval;
    END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_available_slots IS 'Spec 7.1 — server-side slot generation for the booking calendar.';
