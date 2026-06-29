import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT s.id, u.name, u.phone, u.email, u.gender,
             s.salon_id, s.department_id, s.specialty, s.gender_served, s.rating, s.reviews_count,
             s.is_active, s.sort_order, s.bio,
             sl.name AS branch_name, sl.name_en AS branch_name_en,
             d.name_ar AS department_name, d.name_en AS department_name_en
      FROM staff s
      JOIN users u ON u.id = s.user_id
      JOIN salons sl ON sl.id = s.salon_id
      LEFT JOIN departments d ON d.id = s.department_id
      ORDER BY s.sort_order, u.name
    `)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const { id, name, phone, email, specialty, gender_served, rating, gender, bio, salon_id, department_id } = await req.json()
  try {
    await pool.query(
      'UPDATE staff SET salon_id=$1, department_id=$2, specialty=$3, gender_served=$4, rating=$5, bio=$6 WHERE id=$7',
      [salon_id, department_id || null, specialty, gender_served, rating, bio || null, id]
    )
    await pool.query(
      'UPDATE users SET name=$1, phone=$2, email=$3, gender=$4 WHERE id=(SELECT user_id FROM staff WHERE id=$5)',
      [name, phone, email, gender, id]
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { name, phone, email, password, gender, specialty, gender_served, bio, salon_id, department_id } = await req.json()
  try {
    const userResult = await pool.query(
      `INSERT INTO users (name, phone, email, password, gender, role) VALUES ($1,$2,$3,$4,$5,'staff') RETURNING id`,
      [name, phone, email, password, gender]
    )
    const userId = userResult.rows[0].id
    await pool.query(
      `INSERT INTO staff (user_id, salon_id, department_id, specialty, gender_served, bio, is_active) VALUES ($1,$2,$3,$4,$5,$6,true)`,
      [userId, salon_id, department_id || null, specialty || null, gender_served || 'both', bio || null]
    )
    return NextResponse.json({ ok: true, userId })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await pool.query('UPDATE staff SET is_active=false WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { id, is_active } = await req.json()
  try {
    await pool.query('UPDATE staff SET is_active=$1 WHERE id=$2', [is_active, id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
