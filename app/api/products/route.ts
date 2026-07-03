import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

let mockId = 100
const mockProducts: any[] = []

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT p.id, p.salon_id, p.department_id, p.currency_id, p.group_id, p.name_ar, p.brand, p.category, p.price, p.cost,
             p.stock_qty, p.min_stock_alert, p.sold_in_store, p.used_in_sessions, p.is_active, p.image_url,
             p.display_on_public, p.is_featured,
             d.name_ar AS department_name, d.name_en AS department_name_en,
             c.code AS currency_code, c.symbol AS currency_symbol, c.name AS currency_name,
             g.name_ar AS group_name, g.name_en AS group_name_en,
             (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) AS gallery_count,
             COALESCE(
               (SELECT json_agg(json_build_object('warehouse_name', w.name_ar, 'warehouse_group_name', wg.name_ar) ORDER BY w.name_ar)
                FROM group_warehouses gw
                JOIN warehouses w ON w.id = gw.warehouse_id
                LEFT JOIN warehouse_groups wg ON wg.id = w.warehouse_group_id
                WHERE gw.group_id = p.group_id),
               '[]'::json
             ) AS warehouses
      FROM products p
      LEFT JOIN departments d ON d.id = p.department_id
      LEFT JOIN currencies c ON c.id = p.currency_id
      LEFT JOIN product_groups g ON g.id = p.group_id
      ORDER BY p.name_ar
    `)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('DB unavailable, returning mock products:', (err as Error).message)
    return NextResponse.json(mockProducts)
  }
}

export async function POST(req: NextRequest) {
  const { name_ar, brand, category, price, cost, stock_qty, min_stock_alert, sold_in_store, used_in_sessions, image_url, department_id, currency_id, group_id, display_on_public, is_featured } = await req.json()
  try {
    const salon = await pool.query('SELECT id FROM salons LIMIT 1')
    const cid = currency_id || (await pool.query('SELECT id FROM currencies WHERE is_default = TRUE LIMIT 1')).rows[0]?.id || null
    await pool.query(
      `INSERT INTO products (salon_id, department_id, currency_id, group_id, name_ar, brand, category, price, cost, stock_qty, min_stock_alert, sold_in_store, used_in_sessions, image_url, display_on_public, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [salon.rows[0].id, department_id || null, cid, group_id || null, name_ar, brand, category, price, cost, stock_qty, min_stock_alert, sold_in_store, used_in_sessions, image_url || null, display_on_public !== false, is_featured === true]
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DB unavailable, creating mock product:', (err as Error).message)
    const p = { id: mockId++, name_ar, brand, category, price, cost, stock_qty, min_stock_alert, sold_in_store, used_in_sessions, image_url: image_url || null, is_active: true, department_id: department_id || null, currency_id: currency_id || null, group_id: group_id || null }
    mockProducts.push(p)
    return NextResponse.json({ ok: true })
  }
}

export async function PUT(req: NextRequest) {
  const { id, name_ar, brand, category, price, cost, stock_qty, min_stock_alert, sold_in_store, used_in_sessions, image_url, is_active, department_id, currency_id, group_id, display_on_public, is_featured } = await req.json()
  try {
    const idx = mockProducts.findIndex((p: any) => p.id === id)
    if (idx !== -1) { mockProducts[idx] = { ...mockProducts[idx], name_ar, brand, category, price, cost, stock_qty, min_stock_alert, sold_in_store, used_in_sessions, image_url, is_active, department_id, currency_id, group_id, display_on_public, is_featured }; return NextResponse.json({ ok: true }) }
    await pool.query(
      `UPDATE products SET name_ar=$1, brand=$2, category=$3, price=$4, cost=$5, stock_qty=$6, min_stock_alert=$7, sold_in_store=$8, used_in_sessions=$9, image_url=$10, is_active=$11, department_id=$12, currency_id=$13, group_id=$14, display_on_public=$15, is_featured=$16 WHERE id=$17`,
      [name_ar, brand, category, price, cost, stock_qty, min_stock_alert, sold_in_store, used_in_sessions, image_url, is_active, department_id || null, currency_id || null, group_id || null, display_on_public !== false, is_featured === true, id]
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
    const idx = mockProducts.findIndex((p: any) => p.id === id)
    if (idx !== -1) { mockProducts.splice(idx, 1); return NextResponse.json({ ok: true }) }
    await pool.query('UPDATE products SET is_active=false WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
