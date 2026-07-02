-- ============================================================
-- Migration 016: Product Groups & Warehouses
-- Groups <-> Warehouses (M:N), Warehouses <-> Branches (M:N),
-- Products -> Group (single FK, mirrors products.department_id)
-- ============================================================

-- 1. product_groups -------------------------------------------
CREATE TABLE IF NOT EXISTS product_groups (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar     VARCHAR(120) NOT NULL,
    name_en     VARCHAR(120),
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. warehouses -------------------------------------------------
CREATE TABLE IF NOT EXISTS warehouses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar     VARCHAR(120) NOT NULL,
    name_en     VARCHAR(120),
    address     TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. warehouse_branches (M:N warehouse <-> salon/branch) --------
CREATE TABLE IF NOT EXISTS warehouse_branches (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    salon_id     UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(warehouse_id, salon_id)
);

-- 4. group_warehouses (M:N product_groups <-> warehouses) -------
CREATE TABLE IF NOT EXISTS group_warehouses (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id     UUID NOT NULL REFERENCES product_groups(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, warehouse_id)
);

-- 5. products -> product_groups (single FK, like products.department_id)
ALTER TABLE products ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES product_groups(id) ON DELETE SET NULL;

-- 6. Indexes ------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_warehouse_branches_warehouse ON warehouse_branches(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_branches_salon     ON warehouse_branches(salon_id);
CREATE INDEX IF NOT EXISTS idx_group_warehouses_group       ON group_warehouses(group_id);
CREATE INDEX IF NOT EXISTS idx_group_warehouses_warehouse   ON group_warehouses(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_products_group               ON products(group_id);
