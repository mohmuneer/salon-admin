-- ============================================================
-- Migration 007: Row Level Security (spec section 10.1)
-- Supabase: auth.uid() = users.id (after auth.users mapping).
--
-- Helper functions assume the authenticated user's UUID equals
-- the users.id (standard Supabase pattern where the public.users
-- row shares the auth.users id).
-- ============================================================

-- ---------- helper functions ----------
CREATE OR REPLACE FUNCTION current_role_name() RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_staff_id() RETURNS UUID AS $$
    SELECT id FROM staff WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------- enable RLS ----------
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff                ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours        ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_leaves         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE services             ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;

-- ===========================================================
-- users: see/update own row; admins see all
-- ===========================================================
CREATE POLICY users_self_select ON users FOR SELECT
    USING (id = auth.uid() OR is_admin());
CREATE POLICY users_self_update ON users FOR UPDATE
    USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY users_admin_all ON users FOR ALL
    USING (is_admin()) WITH CHECK (is_admin());

-- ===========================================================
-- Public catalog: salons, staff, categories, services, service_products
-- readable by all authenticated users; writable by admins only
-- ===========================================================
CREATE POLICY salons_read   ON salons   FOR SELECT USING (is_active OR is_admin());
CREATE POLICY salons_admin  ON salons   FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY staff_read    ON staff    FOR SELECT USING (is_active OR is_admin() OR user_id = auth.uid());
CREATE POLICY staff_admin   ON staff    FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY cats_read     ON categories FOR SELECT USING (TRUE);
CREATE POLICY cats_admin    ON categories FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY svc_read      ON services FOR SELECT USING (is_active OR is_admin());
CREATE POLICY svc_admin     ON services FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY svcp_read     ON service_products FOR SELECT USING (TRUE);
CREATE POLICY svcp_admin    ON service_products FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

-- working_hours / staff_leaves: readable by all (needed for slot calc), writable by admin or owning staff
CREATE POLICY wh_read       ON working_hours FOR SELECT USING (TRUE);
CREATE POLICY wh_write      ON working_hours FOR ALL
    USING (is_admin() OR staff_id = current_staff_id())
    WITH CHECK (is_admin() OR staff_id = current_staff_id());

CREATE POLICY leave_read    ON staff_leaves FOR SELECT USING (TRUE);
CREATE POLICY leave_write   ON staff_leaves FOR ALL
    USING (is_admin() OR staff_id = current_staff_id())
    WITH CHECK (is_admin() OR staff_id = current_staff_id());

-- ===========================================================
-- products: store products readable by all; cost column protected
-- (expose a separate view for customers, see below). Admin full access.
-- ===========================================================
CREATE POLICY products_read  ON products FOR SELECT
    USING ((is_active AND sold_in_store) OR is_admin() OR current_role_name() = 'staff');
CREATE POLICY products_admin ON products FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ===========================================================
-- appointments: customer sees own; staff sees assigned; admin all
-- ===========================================================
CREATE POLICY appt_select ON appointments FOR SELECT
    USING (customer_id = auth.uid() OR staff_id = current_staff_id() OR is_admin());
CREATE POLICY appt_insert ON appointments FOR INSERT
    WITH CHECK (customer_id = auth.uid() OR is_admin());
CREATE POLICY appt_update ON appointments FOR UPDATE
    USING (customer_id = auth.uid() OR staff_id = current_staff_id() OR is_admin());

CREATE POLICY apptp_select ON appointment_products FOR SELECT
    USING (EXISTS (SELECT 1 FROM appointments a WHERE a.id = appointment_id
        AND (a.customer_id = auth.uid() OR a.staff_id = current_staff_id() OR is_admin())));
CREATE POLICY apptp_write ON appointment_products FOR ALL
    USING (EXISTS (SELECT 1 FROM appointments a WHERE a.id = appointment_id
        AND (a.customer_id = auth.uid() OR is_admin())))
    WITH CHECK (EXISTS (SELECT 1 FROM appointments a WHERE a.id = appointment_id
        AND (a.customer_id = auth.uid() OR is_admin())));

-- ===========================================================
-- reviews: visible reviews readable by all; customer manages own
-- ===========================================================
CREATE POLICY reviews_read   ON reviews FOR SELECT
    USING (is_visible OR customer_id = auth.uid() OR is_admin());
CREATE POLICY reviews_write  ON reviews FOR ALL
    USING (customer_id = auth.uid() OR is_admin())
    WITH CHECK (customer_id = auth.uid() OR is_admin());

-- ===========================================================
-- cart / orders / order_items: owner only (+ admin)
-- ===========================================================
CREATE POLICY cart_owner ON cart FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY orders_select ON orders FOR SELECT
    USING (customer_id = auth.uid() OR is_admin());
CREATE POLICY orders_insert ON orders FOR INSERT
    WITH CHECK (customer_id = auth.uid());
CREATE POLICY orders_admin  ON orders FOR UPDATE USING (is_admin());

CREATE POLICY oitems_select ON order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id
        AND (o.customer_id = auth.uid() OR is_admin())));
CREATE POLICY oitems_insert ON order_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.customer_id = auth.uid()));

-- ===========================================================
-- payments: readable by the owning customer (via source) + admin
-- ===========================================================
CREATE POLICY payments_admin ON payments FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY payments_owner ON payments FOR SELECT USING (
    is_admin()
    OR (source_type = 'appointment' AND EXISTS (
        SELECT 1 FROM appointments a WHERE a.id = source_id AND a.customer_id = auth.uid()))
    OR (source_type = 'order' AND EXISTS (
        SELECT 1 FROM orders o WHERE o.id = source_id AND o.customer_id = auth.uid()))
);

-- ===========================================================
-- notifications: recipient only (+ admin)
-- ===========================================================
CREATE POLICY notif_owner ON notifications FOR ALL
    USING (user_id = auth.uid() OR is_admin())
    WITH CHECK (user_id = auth.uid() OR is_admin());

-- ===========================================================
-- Customer-safe product view (hides cost)
-- ===========================================================
CREATE OR REPLACE VIEW store_products AS
    SELECT id, salon_id, name_ar, brand, category, description,
           price, stock_qty, image_url, sold_in_store, is_active
    FROM products
    WHERE is_active AND sold_in_store;
COMMENT ON VIEW store_products IS 'Customer-facing product list — cost column excluded.';
