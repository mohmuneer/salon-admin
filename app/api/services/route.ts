import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT s.id, s.salon_id, s.department_id, s.currency_id, s.name_ar, s.name_en, c.name_ar AS category_name,
             s.duration_min, s.price, s.gender_target, s.is_active, s.sort_order,
             s.display_on_public, s.is_featured,
             sl.name AS branch_name, sl.name_en AS branch_name_en,
             d.name_ar AS department_name, d.name_en AS department_name_en,
             cur.code AS currency_code, cur.symbol AS currency_symbol, cur.name AS currency_name,
             COUNT(a.id) AS total_bookings,
             (SELECT si.url FROM service_images si WHERE si.service_id = s.id AND si.image_type = 'cover' LIMIT 1) AS image_url,
             (SELECT COUNT(*) FROM service_images WHERE service_id = s.id) AS service_images_count
      FROM services s
      JOIN salons sl ON sl.id = s.salon_id
      LEFT JOIN categories c ON c.id = s.category_id
      LEFT JOIN departments d ON d.id = s.department_id
      LEFT JOIN currencies cur ON cur.id = s.currency_id
      LEFT JOIN appointments a ON a.service_id = s.id AND a.status = 'completed'
      GROUP BY s.id, sl.name, sl.name_en, c.name_ar, d.name_ar, d.name_en, cur.code, cur.symbol, cur.name
      ORDER BY s.sort_order, s.name_ar
    `)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('Services GET error:', (err as Error).message)
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  const { salon_id, department_id, name_ar, name_en, category_id, duration_min, price, gender_target, currency_id, display_on_public, is_featured } = await req.json()
  try {
    const sid = salon_id || (await pool.query('SELECT id FROM salons LIMIT 1')).rows[0].id
    const cid = currency_id || (await pool.query('SELECT id FROM currencies WHERE is_default = TRUE LIMIT 1')).rows[0]?.id || null
    await pool.query(
      `INSERT INTO services (salon_id, department_id, currency_id, name_ar, name_en, category_id, duration_min, price, gender_target, display_on_public, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [sid, department_id || null, cid, name_ar, name_en, category_id, duration_min, price, gender_target, display_on_public !== false, is_featured === true]
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const { id, salon_id, department_id, name_ar, name_en, duration_min, price, gender_target, is_active, currency_id, display_on_public, is_featured } = await req.json()
  try {
    await pool.query(
      `UPDATE services SET salon_id=$1, department_id=$2, name_ar=$3, name_en=$4, duration_min=$5, price=$6, gender_target=$7, is_active=$8, currency_id=$9, display_on_public=$10, is_featured=$11 WHERE id=$12`,
      [salon_id, department_id || null, name_ar, name_en, duration_min, price, gender_target, is_active, currency_id || null, display_on_public !== false, is_featured === true, id]
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await pool.query('UPDATE services SET is_active=false WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
