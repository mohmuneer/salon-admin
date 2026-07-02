-- Departments Module
-- Each department belongs to a branch (salon). A branch can have many departments.

CREATE TABLE departments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id    UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name_ar     VARCHAR(120) NOT NULL,
    name_en     VARCHAR(120),
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link staff to departments
ALTER TABLE staff ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Link services to departments
ALTER TABLE services ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

CREATE INDEX idx_departments_salon_id ON departments(salon_id);
CREATE INDEX idx_staff_department_id ON staff(department_id);
CREATE INDEX idx_services_department_id ON services(department_id);
