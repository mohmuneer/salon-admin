import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const userId = Buffer.from(token, 'base64').toString('utf-8').split(':')[0]
    if (!userId) return NextResponse.json({ error: 'token غير صالح' }, { status: 401 })

    // Get user info
    const userResult = await pool.query(
      `SELECT id, name, phone, email, created_at
       FROM users WHERE id = $1 AND role = 'customer' AND is_active = true`,
      [userId]
    )
    if (userResult.rows.length === 0)
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

    const user = userResult.rows[0]

    // Fetch appointments linked to this customer
    const bookingsResult = await pool.query(
      `SELECT
         a.id,
         sv.name_ar                        AS service_name,
         a.date::text,
         to_char(a.start_time, 'HH24:MI') AS start_time,
         to_char(a.end_time,   'HH24:MI') AS end_time,
         a.status,
         a.service_price::text             AS price,
         a.total::text,
         a.notes,
         a.cancellation_reason,
         COALESCE(sl.name, '')             AS branch_name,
         COALESCE(su.name, '')             AS staff_name,
         COALESCE(sf.specialty, '')        AS staff_specialty,
         sv.duration_min
       FROM appointments a
       JOIN   services sv ON sv.id = a.service_id
       LEFT JOIN salons  sl ON sl.id = a.salon_id
       LEFT JOIN staff   sf ON sf.id = a.staff_id
       LEFT JOIN users   su ON su.id = sf.user_id
       WHERE a.customer_id = $1
       ORDER BY a.date DESC, a.start_time DESC
       LIMIT 30`,
      [userId]
    )

    // Fetch submitted payment booking IDs from payment_receipts (server-side persistence)
    let submittedBookingIds: string[] = []
    try {
      const cleanPhone = user.phone.replace(/[^0-9]/g, '').slice(-9)
      const receiptsResult = await pool.query(
        `SELECT appointment_ids FROM payment_receipts
         WHERE REGEXP_REPLACE(customer_phone,'[^0-9]','','g') LIKE $1`,
        [`%${cleanPhone}`]
      )
      submittedBookingIds = [...new Set(
        receiptsResult.rows.flatMap((r: any) => Array.isArray(r.appointment_ids) ? r.appointment_ids : [])
      )] as string[]
    } catch {}

    // Fetch orders linked to this customer (by customer_id OR by phone for orphaned orders)
    const cleanPhone = user.phone.replace(/[^0-9]/g, '').slice(-9)
    const ordersResult = await pool.query(
      `SELECT DISTINCT ON (o.id)
         o.id, o.status,
         o.subtotal::text, o.total::text,
         o.payment_status, o.payment_method,
         o.shipping_address, o.notes,
         o.created_at::text,
         COALESCE(sl.name, '') AS branch_name,
         (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS items_count,
         COALESCE(
           (SELECT json_agg(json_build_object(
              'id',    oi.id::text,
              'name',  p.name_ar,
              'qty',   oi.quantity,
              'price', oi.unit_price::text,
              'image', COALESCE(p.image_url, '')
           ) ORDER BY p.name_ar)
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = o.id
           ), '[]'::json
         ) AS items,
         COALESCE(
           (SELECT pr.status FROM payment_receipts pr
            WHERE pr.order_id = o.id::text
            ORDER BY pr.created_at DESC LIMIT 1),
           'none'
         ) AS receipt_status,
         COALESCE(
           (SELECT pr.notes FROM payment_receipts pr
            WHERE pr.order_id = o.id::text
            ORDER BY pr.created_at DESC LIMIT 1),
           ''
         ) AS receipt_notes
       FROM orders o
       LEFT JOIN salons sl ON sl.id = o.salon_id
       LEFT JOIN users u2 ON u2.id = o.customer_id
       WHERE o.customer_id = $1
          OR RIGHT(REGEXP_REPLACE(COALESCE(u2.phone,''),'[^0-9]','','g'), 9) = $2
       ORDER BY o.id, o.created_at DESC
       LIMIT 30`,
      [userId, cleanPhone]
    )

    return NextResponse.json({
      user:                 { id: user.id, name: user.name, phone: user.phone, email: user.email },
      bookings:             bookingsResult.rows,
      orders:               ordersResult.rows,
      submitted_booking_ids: submittedBookingIds,
    })
  } catch (err: any) {
    console.error('[public-auth/profile GET]', err.message)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
