import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT w.id, w.name_ar, w.name_en, w.address, w.is_active, w.sort_order, w.created_at,
             w.warehouse_group_id,
             wg.name_ar AS group_name_ar, wg.name_en AS group_name_en,
             COALESCE(
               (SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'name_en', s.name_en) ORDER BY s.name)
                FROM warehouse_branches wb JOIN salons s ON s.id = wb.salon_id
                WHERE wb.warehouse_id = w.id),
               '[]'::json
             ) AS branches,
             COALESCE(
               (SELECT json_agg(json_build_object('id', d.id, 'name_ar', d.name_ar, 'name_en', d.name_en) ORDER BY d.name_ar)
                FROM warehouse_departments wd JOIN departments d ON d.id = wd.department_id
                WHERE wd.warehouse_id = w.id),
               '[]'::json
             ) AS departments
      FROM warehouses w
      LEFT JOIN warehouse_groups wg ON wg.id = w.warehouse_group_id
      ORDER BY w.sort_order, w.name_ar
    `)
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('Warehouses GET error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { name_ar, name_en, address, warehouse_group_id, branch_ids, department_ids } = await req.json()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const maxOrder = await client.query('SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM warehouses')
    const nextOrder = maxOrder.rows[0].n
    const inserted = await client.query(
      `INSERT INTO warehouses (name_ar, name_en, address, warehouse_group_id, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [name_ar, name_en || null, address || null, warehouse_group_id || null, nextOrder]
    )
    const warehouseId = inserted.rows[0].id
    for (const salonId of Array.isArray(branch_ids) ? branch_ids : []) {
      await client.query(
        `INSERT INTO warehouse_branches (warehouse_id, salon_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [warehouseId, salonId]
      )
    }
    for (const deptId of Array.isArray(department_ids) ? department_ids : []) {
      await client.query(
        `INSERT INTO warehouse_departments (warehouse_id, department_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [warehouseId, deptId]
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
  const { id, name_ar, name_en, address, warehouse_group_id, is_active, branch_ids, department_ids } = await req.json()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `UPDATE warehouses SET name_ar=$1, name_en=$2, address=$3, warehouse_group_id=$4, is_active=$5, sort_order=COALESCE(sort_order, (SELECT COALESCE(MAX(sort_order),0)+1 FROM warehouses)) WHERE id=$6`,
      [name_ar, name_en || null, address || null, warehouse_group_id || null, is_active, id]
    )
    await client.query(`DELETE FROM warehouse_branches WHERE warehouse_id=$1`, [id])
    for (const salonId of Array.isArray(branch_ids) ? branch_ids : []) {
      await client.query(
        `INSERT INTO warehouse_branches (warehouse_id, salon_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [id, salonId]
      )
    }
    await client.query(`DELETE FROM warehouse_departments WHERE warehouse_id=$1`, [id])
    for (const deptId of Array.isArray(department_ids) ? department_ids : []) {
      await client.query(
        `INSERT INTO warehouse_departments (warehouse_id, department_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [id, deptId]
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

export async function PATCH(req: NextRequest) {
  const { items } = await req.json()
  if (!Array.isArray(items)) return NextResponse.json({ error: 'items array required' }, { status: 400 })
  try {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const item of items) {
        await client.query('UPDATE warehouses SET sort_order=$1 WHERE id=$2', [item.position, item.id])
      }
      await client.query('COMMIT')
      return NextResponse.json({ ok: true })
    } catch (err: any) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err: any) {
    console.error('Warehouses PATCH error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
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
