import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { appointmentId, items } = await req.json()
    if (!appointmentId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      let sum = 0
      for (const it of items) {
        const productId = it.productId || it.product_id
        const qty = Math.max(1, Math.floor(Number(it.qty || it.quantity) || 1))
        if (!productId) continue
        // Price always comes from the DB, never from the client.
        const prod = await client.query(
          'SELECT price FROM products WHERE id = $1 AND is_active = true', [productId]
        )
        if (prod.rows.length === 0) continue
        const price = Number(prod.rows[0].price) || 0
        await client.query(
          `INSERT INTO appointment_products (appointment_id, product_id, qty, unit_price, type)
           VALUES ($1, $2, $3, $4, 'optional')`,
          [appointmentId, productId, qty, price]
        )
        sum += qty * price
      }

      await client.query(
        `UPDATE appointments SET products_price = products_price + $1 WHERE id = $2`,
        [sum, appointmentId]
      )

      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[public-attach-appointment-products POST]', err.message)
    return NextResponse.json({ error: 'حدث خطأ في إضافة المنتجات إلى الحجز: ' + err.message }, { status: 500 })
  }
}
