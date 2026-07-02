import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT s.id, s.name_ar, s.name_en, s.phone, s.email, s.address, s.supplier_group_id,
             s.is_active, s.created_at,
             sg.name_ar AS group_name_ar, sg.name_en AS group_name_en,
             COALESCE(
               (SELECT json_agg(json_build_object('id', p.id, 'name_ar', p.name_ar) ORDER BY p.name_ar)
                FROM supplier_products sp JOIN products p ON p.id = sp.product_id
                WHERE sp.supplier_id = s.id),
               '[]'::json
             ) AS products
      FROM suppliers s
      LEFT JOIN supplier_groups sg ON sg.id = s.supplier_group_id
      ORDER BY s.name_ar
    `)
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('Suppliers GET error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { name_ar, name_en, phone, email, address, supplier_group_id, product_ids } = await req.json()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const inserted = await client.query(
      `INSERT INTO suppliers (name_ar, name_en, phone, email, address, supplier_group_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [name_ar, name_en || null, phone || null, email || null, address || null, supplier_group_id || null]
    )
    const supplierId = inserted.rows[0].id
    for (const productId of Array.isArray(product_ids) ? product_ids : []) {
      await client.query(
        `INSERT INTO supplier_products (supplier_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [supplierId, productId]
      )
    }
    await client.query('COMMIT')
    return NextResponse.json({ ok: true, id: supplierId })
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('Suppliers POST error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function PUT(req: NextRequest) {
  const { id, name_ar, name_en, phone, email, address, supplier_group_id, is_active, product_ids } = await req.json()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `UPDATE suppliers SET name_ar=$1, name_en=$2, phone=$3, email=$4, address=$5, supplier_group_id=$6, is_active=$7 WHERE id=$8`,
      [name_ar, name_en || null, phone || null, email || null, address || null, supplier_group_id || null, is_active, id]
    )
    await client.query(`DELETE FROM supplier_products WHERE supplier_id=$1`, [id])
    for (const productId of Array.isArray(product_ids) ? product_ids : []) {
      await client.query(
        `INSERT INTO supplier_products (supplier_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [id, productId]
      )
    }
    await client.query('COMMIT')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('Suppliers PUT error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await pool.query('UPDATE suppliers SET is_active=false WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Suppliers DELETE error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}
