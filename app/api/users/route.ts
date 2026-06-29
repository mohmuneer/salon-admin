import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.phone, u.email, u.role, u.gender, u.is_active,
             st.specialty, st.gender_served, sal.name AS branch_name
      FROM users u
      LEFT JOIN staff st ON st.user_id = u.id
      LEFT JOIN salons sal ON sal.id = st.salon_id
      WHERE u.role IN ('admin','staff')
      ORDER BY u.created_at DESC
    `)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { name, phone, email, password, gender, role, specialty, salon_id, gender_served } = await req.json()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const password_hash = await bcrypt.hash(password, 10)
    const userResult = await client.query(
      `INSERT INTO users (name, phone, email, role, gender, password_hash, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id`,
      [name, phone, email, role, gender, password_hash]
    )
    if (role === 'staff') {
      await client.query(
        `INSERT INTO staff (user_id, salon_id, specialty, gender_served)
         VALUES ($1,$2,$3,$4)`,
        [userResult.rows[0].id, salon_id, specialty, gender_served]
      )
    }
    await client.query('COMMIT')
    return NextResponse.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function PUT(req: NextRequest) {
  const { id, name, phone, email, role, gender, specialty, gender_served, is_active } = await req.json()
  try {
    await pool.query(
      `UPDATE users SET name=$1, phone=$2, email=$3, role=$4, gender=$5, is_active=$6 WHERE id=$7`,
      [name, phone, email, role, gender, is_active, id]
    )
    if (role === 'staff') {
      await pool.query(
        `UPDATE staff SET specialty=$1, gender_served=$2 WHERE user_id=$3`,
        [specialty, gender_served, id]
      )
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await pool.query('UPDATE users SET is_active=false WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { id, is_active } = await req.json()
  try {
    await pool.query('UPDATE users SET is_active=$1 WHERE id=$2', [is_active, id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
