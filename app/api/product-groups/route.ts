import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT g.id, g.name_ar, g.name_en, g.description, g.is_active, g.sort_order, g.created_at,
             COALESCE(
               (SELECT json_agg(json_build_object('id', w.id, 'name_ar', w.name_ar, 'name_en', w.name_en) ORDER BY w.name_ar)
                FROM group_warehouses gw JOIN warehouses w ON w.id = gw.warehouse_id
                WHERE gw.group_id = g.id),
               '[]'::json
             ) AS warehouses,
             (SELECT COUNT(*) FROM products p WHERE p.group_id = g.id) AS product_count
      FROM product_groups g
      ORDER BY g.sort_order, g.name_ar
    `)
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('Product groups GET error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { name_ar, name_en, description, warehouse_ids } = await req.json()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const inserted = await client.query(
      `INSERT INTO product_groups (name_ar, name_en, description) VALUES ($1,$2,$3) RETURNING id`,
      [name_ar, name_en || null, description || null]
    )
    const groupId = inserted.rows[0].id
    for (const warehouseId of Array.isArray(warehouse_ids) ? warehouse_ids : []) {
      await client.query(
        `INSERT INTO group_warehouses (group_id, warehouse_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [groupId, warehouseId]
      )
    }
    await client.query('COMMIT')
    return NextResponse.json({ ok: true, id: groupId })
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('Product groups POST error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function PUT(req: NextRequest) {
  const { id, name_ar, name_en, description, is_active, warehouse_ids } = await req.json()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `UPDATE product_groups SET name_ar=$1, name_en=$2, description=$3, is_active=$4 WHERE id=$5`,
      [name_ar, name_en || null, description || null, is_active, id]
    )
    await client.query(`DELETE FROM group_warehouses WHERE group_id=$1`, [id])
    for (const warehouseId of Array.isArray(warehouse_ids) ? warehouse_ids : []) {
      await client.query(
        `INSERT INTO group_warehouses (group_id, warehouse_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [id, warehouseId]
      )
    }
    await client.query('COMMIT')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('Product groups PUT error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await pool.query('UPDATE product_groups SET is_active=false WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Product groups DELETE error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}
