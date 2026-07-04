import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const supplierId = searchParams.get('supplierId')
  const search = (searchParams.get('search') || '').trim()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20))
  const offset = (page - 1) * pageSize

  if (!supplierId) return NextResponse.json({ items: [], total: 0 }, { status: 200 })

  try {
    const searchPattern = search ? `%${search}%` : null

    const totalRes = await pool.query(
      `SELECT COUNT(*) FROM supplier_products sp
       JOIN products p ON p.id = sp.product_id
       WHERE sp.supplier_id = $1 AND ($2::text IS NULL OR p.name_ar ILIKE $2)`,
      [supplierId, searchPattern]
    )
    const total = Number(totalRes.rows[0].count) || 0

    const itemsRes = await pool.query(
      `SELECT sp.id AS catalog_id, p.id AS product_id, p.name_ar, pg.name_ar AS group_name_ar,
              sp.supplier_sku, sp.supplier_item_name, sp.purchase_unit, sp.price, sp.min_order_qty,
              sp.lead_time_days, sp.priority, sp.is_default, c.code AS currency_code, c.symbol AS currency_symbol
       FROM supplier_products sp
       JOIN products p ON p.id = sp.product_id
       LEFT JOIN product_groups pg ON pg.id = p.group_id
       LEFT JOIN currencies c ON c.id = sp.currency_id
       WHERE sp.supplier_id = $1 AND ($2::text IS NULL OR p.name_ar ILIKE $2)
       ORDER BY p.name_ar
       LIMIT $3 OFFSET $4`,
      [supplierId, searchPattern, pageSize, offset]
    )

    const productIds = itemsRes.rows.map(r => r.product_id)
    let salesByProduct: Record<string, { qty: number; revenue: number }> = {}

    if (productIds.length > 0) {
      const salesRes = await pool.query(
        `SELECT product_id, SUM(qty)::numeric AS qty, SUM(revenue)::numeric AS revenue FROM (
           SELECT oi.product_id, oi.quantity AS qty, oi.subtotal AS revenue
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           WHERE oi.product_id = ANY($1::uuid[]) AND o.status != 'cancelled'
           UNION ALL
           SELECT ap.product_id, ap.qty, ap.qty * ap.unit_price AS revenue
           FROM appointment_products ap
           JOIN appointments a ON a.id = ap.appointment_id
           WHERE ap.product_id = ANY($1::uuid[]) AND a.status != 'cancelled'
         ) combined
         GROUP BY product_id`,
        [productIds]
      )
      salesByProduct = Object.fromEntries(
        salesRes.rows.map(r => [r.product_id, { qty: Number(r.qty) || 0, revenue: Number(r.revenue) || 0 }])
      )
    }

    const items = itemsRes.rows.map(r => ({
      ...r,
      sold_qty: salesByProduct[r.product_id]?.qty || 0,
      sold_revenue: salesByProduct[r.product_id]?.revenue || 0,
    }))

    return NextResponse.json({ items, total, page, pageSize })
  } catch (err: any) {
    console.error('[public-supplier-items GET]', err.message)
    return NextResponse.json({ items: [], total: 0, error: err.message }, { status: 200 })
  }
}
