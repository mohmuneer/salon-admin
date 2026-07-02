-- ============================================================
-- Migration 017: Suppliers, Supplier Groups, Warehouse Groups,
-- and Warehouse <-> Department linking
-- ============================================================

-- 1. warehouse_groups (categorize warehouses themselves, single FK on warehouses)
CREATE TABLE IF NOT EXISTS warehouse_groups (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar     VARCHAR(120) NOT NULL,
    name_en     VARCHAR(120),
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS warehouse_group_id UUID REFERENCES warehouse_groups(id) ON DELETE SET NULL;

-- 2. warehouse_departments (M:N warehouse <-> department, mirrors warehouse_branches)
CREATE TABLE IF NOT EXISTS warehouse_departments (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id  UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(warehouse_id, department_id)
);

-- 3. supplier_groups -------------------------------------------
CREATE TABLE IF NOT EXISTS supplier_groups (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar     VARCHAR(120) NOT NULL,
    name_en     VARCHAR(120),
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. suppliers ----------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar           VARCHAR(120) NOT NULL,
    name_en           VARCHAR(120),
    phone             VARCHAR(30),
    email             VARCHAR(150),
    address           TEXT,
    supplier_group_id UUID REFERENCES supplier_groups(id) ON DELETE SET NULL,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. supplier_products (M:N supplier <-> product, mirrors service_products)
CREATE TABLE IF NOT EXISTS supplier_products (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(supplier_id, product_id)
);

-- 6. Indexes ------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_warehouse_departments_warehouse ON warehouse_departments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_departments_dept      ON warehouse_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier      ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_product       ON supplier_products(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_group                ON warehouses(warehouse_group_id);
