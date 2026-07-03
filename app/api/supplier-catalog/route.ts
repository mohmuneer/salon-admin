import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT sp.id, sp.supplier_id, sp.product_id, sp.link_type, sp.group_id, sp.supplier_sku, sp.supplier_item_name,
             sp.purchase_unit, sp.currency_id, sp.price, sp.min_order_qty, sp.lead_time_days,
             sp.priority, sp.is_default, sp.contract_start_date::text, sp.contract_end_date::text, sp.created_at,
             s.name_ar AS supplier_name_ar, s.name_en AS supplier_name_en,
             p.name_ar AS product_name_ar,
             g.name_ar AS group_name_ar,
             c.code AS currency_code, c.symbol AS currency_symbol
      FROM supplier_products sp
      JOIN suppliers s ON s.id = sp.supplier_id
      JOIN products p ON p.id = sp.product_id
      LEFT JOIN product_groups g ON g.id = sp.group_id
      LEFT JOIN currencies c ON c.id = sp.currency_id
      ORDER BY s.name_ar, sp.priority, p.name_ar
    `)
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('Supplier catalog GET error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const {
    supplier_id, product_ids, supplier_sku, supplier_item_name, purchase_unit, currency_id,
    price, min_order_qty, lead_time_days, priority, is_default, contract_start_date, contract_end_date,
    link_type, group_id,
  } = await req.json()

  const ids: string[] = Array.isArray(product_ids) ? product_ids : []
  if (!supplier_id || ids.length === 0) {
    return NextResponse.json({ error: 'المورد والصنف مطلوبان' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const productId of ids) {
      if (is_default) {
        await client.query(`UPDATE supplier_products SET is_default = false WHERE product_id = $1`, [productId])
      }
      await client.query(
        `INSERT INTO supplier_products (
           supplier_id, product_id, link_type, group_id, supplier_sku, supplier_item_name, purchase_unit, currency_id,
           price, min_order_qty, lead_time_days, priority, is_default, contract_start_date, contract_end_date
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (supplier_id, product_id) DO UPDATE SET
           link_type = EXCLUDED.link_type, group_id = EXCLUDED.group_id,
           supplier_sku = EXCLUDED.supplier_sku, supplier_item_name = EXCLUDED.supplier_item_name,
           purchase_unit = EXCLUDED.purchase_unit, currency_id = EXCLUDED.currency_id,
           price = EXCLUDED.price, min_order_qty = EXCLUDED.min_order_qty,
           lead_time_days = EXCLUDED.lead_time_days, priority = EXCLUDED.priority,
           is_default = EXCLUDED.is_default, contract_start_date = EXCLUDED.contract_start_date,
           contract_end_date = EXCLUDED.contract_end_date`,
        [
          supplier_id, productId, link_type || 'single', group_id || null,
          supplier_sku || null, supplier_item_name || null, purchase_unit || null,
          currency_id || null, price ?? null, min_order_qty ?? null, lead_time_days ?? null,
          priority ?? 0, is_default === true, contract_start_date || null, contract_end_date || null,
        ]
      )
    }
    await client.query('COMMIT')
    return NextResponse.json({ ok: true, count: ids.length })
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('Supplier catalog POST error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function PUT(req: NextRequest) {
  const {
    id, supplier_id, product_id, supplier_sku, supplier_item_name, purchase_unit, currency_id,
    price, min_order_qty, lead_time_days, priority, is_default, contract_start_date, contract_end_date,
    link_type, group_id,
  } = await req.json()

  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (is_default) {
      await client.query(`UPDATE supplier_products SET is_default = false WHERE product_id = $1 AND id != $2`, [product_id, id])
    }
    await client.query(
      `UPDATE supplier_products SET
         supplier_id=$1, product_id=$2, link_type=$3, group_id=$4, supplier_sku=$5, supplier_item_name=$6, purchase_unit=$7,
         currency_id=$8, price=$9, min_order_qty=$10, lead_time_days=$11, priority=$12, is_default=$13,
         contract_start_date=$14, contract_end_date=$15
       WHERE id=$16`,
      [
        supplier_id, product_id, link_type || 'single', group_id || null,
        supplier_sku || null, supplier_item_name || null, purchase_unit || null,
        currency_id || null, price ?? null, min_order_qty ?? null, lead_time_days ?? null,
        priority ?? 0, is_default === true, contract_start_date || null, contract_end_date || null, id,
      ]
    )
    await client.query('COMMIT')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('Supplier catalog PUT error:', err)
    if (err.code === '23505' && err.constraint === 'supplier_products_supplier_id_product_id_key') {
      return NextResponse.json({ error: 'هذا المورد مرتبط بالفعل بهذا الصنف' }, { status: 409 })
    }
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(req: NextRequest) {
  const { id, group_id, supplier_id } = await req.json()
  try {
    if (group_id && supplier_id) {
      // If deleting a group link, remove all entries for that group
      await pool.query('DELETE FROM supplier_products WHERE group_id=$1 AND supplier_id=$2', [group_id, supplier_id])
    } else {
      await pool.query('DELETE FROM supplier_products WHERE id=$1', [id])
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Supplier catalog DELETE error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}
