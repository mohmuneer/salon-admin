import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')
  if (!phone) return NextResponse.json([], { status: 200 })

  const cleanPhone = phone.replace(/^0/, '966').replace(/[^0-9]/g, '')

  try {
    const r = await pool.query(`
      SELECT
        o.id, o.status, o.subtotal::text, o.total::text,
        o.payment_method, o.payment_status,
        o.shipping_address, o.notes, o.created_at::text,
        COALESCE(sl.name, '') AS branch_name,
        (
          SELECT json_agg(json_build_object(
            'id', oi.id,
            'product_id', oi.product_id::text,
            'name', p.name_ar,
            'qty', oi.quantity,
            'price', oi.unit_price::text,
            'subtotal', oi.subtotal::text,
            'image', COALESCE(p.image_url, '')
          ))
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id
        ) AS items
      FROM orders o
      JOIN users u ON u.id = o.customer_id
      LEFT JOIN salons sl ON sl.id = o.salon_id
      WHERE u.phone LIKE $1
      ORDER BY o.created_at DESC
      LIMIT 20
    `, [`%${cleanPhone.slice(-9)}%`])

    return NextResponse.json(r.rows)
  } catch (e: any) {
    console.error('[public-my-orders GET]', e.message)
    return NextResponse.json([], { status: 200 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, action } = await req.json()
    if (!id || action !== 'cancel') return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })

    const result = await pool.query(
      `UPDATE orders SET status = 'cancelled'
       WHERE id = $1 AND status NOT IN ('delivered','cancelled') AND payment_status != 'paid'`,
      [id]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'لا يمكن إلغاء الطلب بعد إتمام الدفع' }, { status: 400 })
    }
    return NextResponse.json({ ok: true, message: 'تم إلغاء الطلب' })
  } catch (e: any) {
    console.error('[public-my-orders PUT]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
