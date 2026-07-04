import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 })

  try {
    const supplierRes = await pool.query(
      `SELECT s.id, s.name_ar, s.name_en, s.phone, s.email, s.address, s.theme,
              s.supplier_group_id, sg.name_ar AS group_name_ar, sg.name_en AS group_name_en
       FROM suppliers s
       LEFT JOIN supplier_groups sg ON sg.id = s.supplier_group_id
       WHERE s.id = $1 AND s.is_active = true`,
      [id]
    )
    if (supplierRes.rows.length === 0) {
      return NextResponse.json({ error: 'مورد غير موجود' }, { status: 404 })
    }
    const supplier = supplierRes.rows[0]

    // Count + distinct group ids only - never load the full product list here,
    // a supplier can have thousands of items (see /api/public-supplier-items
    // for the paginated, searchable view of the actual items).
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM supplier_products WHERE supplier_id = $1`, [id]
    )
    const productCount = Number(countRes.rows[0].count) || 0

    const groupIdsRes = await pool.query(
      `SELECT DISTINCT p.group_id FROM supplier_products sp
       JOIN products p ON p.id = sp.product_id
       WHERE sp.supplier_id = $1 AND p.group_id IS NOT NULL`,
      [id]
    )
    const groupIds = groupIdsRes.rows.map(r => r.group_id)

    let warehouses: any[] = []
    let branches: any[] = []
    if (groupIds.length > 0) {
      const whRes = await pool.query(
        `SELECT DISTINCT w.id, w.name_ar, w.name_en, wg.name_ar AS warehouse_group_name
         FROM group_warehouses gw
         JOIN warehouses w ON w.id = gw.warehouse_id
         LEFT JOIN warehouse_groups wg ON wg.id = w.warehouse_group_id
         WHERE gw.group_id = ANY($1::uuid[]) AND w.is_active = true
         ORDER BY w.name_ar`,
        [groupIds]
      )
      warehouses = whRes.rows

      if (warehouses.length > 0) {
        const warehouseIds = warehouses.map(w => w.id)
        const brRes = await pool.query(
          `SELECT DISTINCT s.id, s.name
           FROM warehouse_branches wb
           JOIN salons s ON s.id = wb.salon_id
           WHERE wb.warehouse_id = ANY($1::uuid[])
           ORDER BY s.name`,
          [warehouseIds]
        )
        branches = brRes.rows
      }
    }

    return NextResponse.json({ ...supplier, product_count: productCount, warehouses, branches })
  } catch (err: any) {
    console.error('[public-supplier-profile GET]', err.message)
    return NextResponse.json({ error: err.message || 'حدث خطأ' }, { status: 500 })
  }
}
