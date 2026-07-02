-- ============================================================
-- Migration 005: Store + Payments + Notifications
-- (cart, orders, order_items, payments, notifications)
-- ============================================================

-- 11. cart ----------------------------------------------------
CREATE TABLE IF NOT EXISTS cart (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)   -- UPDATE quantity instead of duplicate INSERT
);

-- 12. orders --------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id       UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    salon_id          UUID NOT NULL REFERENCES salons(id) ON DELETE RESTRICT,
    status            order_status NOT NULL DEFAULT 'pending',
    subtotal          DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    discount          DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    shipping_fee      DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    total             DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    shipping_address  TEXT,
    payment_method    payment_method,
    payment_status    payment_status NOT NULL DEFAULT 'pending',
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. order_items ---------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    UUID NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    unit_price  DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    subtotal    DECIMAL(10,2) GENERATED ALWAYS AS (unit_price * quantity) STORED
);

-- 14. payments ------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type  payment_source NOT NULL,
    source_id    UUID NOT NULL,                -- polymorphic: appointment.id or order.id
    amount       DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    method       payment_method NOT NULL,
    status       payment_status NOT NULL DEFAULT 'pending',
    gateway_ref  VARCHAR(200),                 -- Moyasar payment ID
    paid_at      TIMESTAMPTZ
);
COMMENT ON COLUMN payments.source_id IS 'Polymorphic FK — references appointments.id or orders.id depending on source_type.';

-- 15. notifications -------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        notification_type NOT NULL,
    title_ar    VARCHAR(150) NOT NULL,
    body_ar     TEXT NOT NULL,
    data        JSONB,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cart_user         ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer   ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_source   ON payments(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id) WHERE NOT is_read;
