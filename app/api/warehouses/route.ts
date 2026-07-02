import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT w.id, w.name_ar, w.name_en, w.address, w.is_active, w.sort_order, w.created_at,
             COALESCE(
               (SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'name_en', s.name_en) ORDER BY s.name)
                FROM warehouse_branches wb JOIN salons s ON s.id = wb.salon_id
                WHERE wb.warehouse_id = w.id),
               '[]'::json
             ) AS branches
      FROM warehouses w
      ORDER BY w.sort_order, w.name_ar
    `)
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('Warehouses GET error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { name_ar, name_en, address, branch_ids } = await req.json()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const inserted = await client.query(
      `INSERT INTO warehouses (name_ar, name_en, address) VALUES ($1,$2,$3) RETURNING id`,
      [name_ar, name_en || null, address || null]
    )
    const warehouseId = inserted.rows[0].id
    for (const salonId of Array.isArray(branch_ids) ? branch_ids : []) {
      await client.query(
        `INSERT INTO warehouse_branches (warehouse_id, salon_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [warehouseId, salonId]
      )
    }
    await client.query('COMMIT')
    return NextResponse.json({ ok: true, id: warehouseId })
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('Warehouses POST error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function PUT(req: NextRequest) {
  const { id, name_ar, name_en, address, is_active, branch_ids } = await req.json()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `UPDATE warehouses SET name_ar=$1, name_en=$2, address=$3, is_active=$4 WHERE id=$5`,
      [name_ar, name_en || null, address || null, is_active, id]
    )
    await client.query(`DELETE FROM warehouse_branches WHERE warehouse_id=$1`, [id])
    for (const salonId of Array.isArray(branch_ids) ? branch_ids : []) {
      await client.query(
        `INSERT INTO warehouse_branches (warehouse_id, salon_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [id, salonId]
      )
    }
    await client.query('COMMIT')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('Warehouses PUT error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await pool.query('UPDATE warehouses SET is_active=false WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Warehouses DELETE error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}
