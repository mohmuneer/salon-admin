import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT id, name, name_en, address, city, type, opening_time, closing_time, is_active
      FROM salons
      ORDER BY name
    `)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { name, name_en, address, city, type, opening_time, closing_time } = await req.json()
  try {
    await pool.query(
      `INSERT INTO salons (name, name_en, address, city, type, opening_time, closing_time, lat, lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,0)`,
      [name, name_en, address, city, type, opening_time, closing_time]
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const { id, name, name_en, address, city, type, opening_time, closing_time, is_active } = await req.json()
  try {
    await pool.query(
      `UPDATE salons SET name=$1, name_en=$2, address=$3, city=$4, type=$5, opening_time=$6, closing_time=$7, is_active=$8 WHERE id=$9`,
      [name, name_en, address, city, type, opening_time, closing_time, is_active, id]
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
    await pool.query('UPDATE salons SET is_active=false WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { id, is_active } = await req.json()
  try {
    await pool.query('UPDATE salons SET is_active=$1 WHERE id=$2', [is_active, id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
