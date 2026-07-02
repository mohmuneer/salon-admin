import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT g.id, g.name_ar, g.name_en, g.description, g.is_active, g.sort_order, g.created_at,
             (SELECT COUNT(*) FROM warehouses w WHERE w.warehouse_group_id = g.id) AS warehouse_count
      FROM warehouse_groups g
      ORDER BY g.sort_order, g.name_ar
    `)
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('Warehouse groups GET error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { name_ar, name_en, description } = await req.json()
  try {
    await pool.query(
      `INSERT INTO warehouse_groups (name_ar, name_en, description) VALUES ($1,$2,$3)`,
      [name_ar, name_en || null, description || null]
    )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Warehouse groups POST error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const { id, name_ar, name_en, description, is_active } = await req.json()
  try {
    await pool.query(
      `UPDATE warehouse_groups SET name_ar=$1, name_en=$2, description=$3, is_active=$4 WHERE id=$5`,
      [name_ar, name_en || null, description || null, is_active, id]
    )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Warehouse groups PUT error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await pool.query('UPDATE warehouse_groups SET is_active=false WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Warehouse groups DELETE error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}
