import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

async function ensureTable() {
  try {
    await pool.query(`SELECT 1 FROM departments LIMIT 1`)
  } catch {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        salon_id    UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
        name_ar     VARCHAR(120) NOT NULL,
        name_en     VARCHAR(120),
        description TEXT,
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await pool.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL`)
    await pool.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL`)
  }
}

export async function GET() {
  try {
    await ensureTable()
    const result = await pool.query(`
      SELECT d.id, d.salon_id, d.name_ar, d.name_en, d.description, d.is_active, d.created_at,
             d.image_url, d.seo_title, d.seo_description, d.slug,
             s.name AS branch_name, s.name_en AS branch_name_en,
             (SELECT COUNT(*) FROM staff st WHERE st.department_id = d.id) AS employee_count,
             (SELECT COUNT(*) FROM services sv WHERE sv.department_id = d.id AND sv.display_on_public = true) AS service_count,
             (SELECT COUNT(*) FROM products p WHERE p.department_id = d.id AND p.display_on_public = true) AS product_count
      FROM departments d
      JOIN salons s ON s.id = d.salon_id
      ORDER BY s.name, d.name_ar
    `)
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('Departments GET error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { salon_id, name_ar, name_en, description, image_url, seo_title, seo_description, slug } = await req.json()
  try {
    await ensureTable()
    const genSlug = slug || (name_en ? name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : null)
    await pool.query(
      `INSERT INTO departments (salon_id, name_ar, name_en, description, image_url, seo_title, seo_description, slug) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [salon_id, name_ar, name_en, description || null, image_url || null, seo_title || null, seo_description || null, genSlug]
    )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Departments POST error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const { id, salon_id, name_ar, name_en, description, is_active, image_url, seo_title, seo_description, slug } = await req.json()
  try {
    await ensureTable()
    const genSlug = slug || (name_en ? name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : null)
    await pool.query(
      `UPDATE departments SET salon_id=$1, name_ar=$2, name_en=$3, description=$4, is_active=$5, image_url=$6, seo_title=$7, seo_description=$8, slug=$9 WHERE id=$10`,
      [salon_id, name_ar, name_en, description || null, is_active, image_url || null, seo_title || null, seo_description || null, genSlug, id]
    )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await ensureTable()
    await pool.query('UPDATE departments SET is_active=false WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { id, is_active } = await req.json()
  try {
    await ensureTable()
    await pool.query('UPDATE departments SET is_active=$1 WHERE id=$2', [is_active, id])
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}
