import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

// Active statuses that can be cancelled/modified
const ACTIVE = `('pending','confirmed','in_progress')`

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')
  if (!phone) return NextResponse.json([], { status: 200 })

  const cleanPhone = phone.replace(/^0/, '966').replace(/[^0-9]/g, '')

  try {
    const r = await pool.query(`
      SELECT
        a.id, a.date::text,
        to_char(a.start_time, 'HH24:MI') AS start_time,
        to_char(a.end_time,   'HH24:MI') AS end_time,
        a.status,
        a.service_price::text,
        a.total::text,
        a.notes, a.cancellation_reason,
        a.created_at::text,
        sv.name_ar  AS service_name,
        sv.duration_min,
        COALESCE(sl.name, '') AS branch_name,
        COALESCE(su.name, '') AS staff_name,
        COALESCE(s.specialty, '') AS staff_specialty
      FROM appointments a
      JOIN users u   ON u.id = a.customer_id
      JOIN services sv ON sv.id = a.service_id
      LEFT JOIN salons sl ON sl.id = a.salon_id
      LEFT JOIN staff s   ON s.id = a.staff_id
      LEFT JOIN users su  ON su.id = s.user_id
      WHERE u.phone LIKE $1
      ORDER BY a.date DESC, a.start_time DESC
      LIMIT 30
    `, [`%${cleanPhone.slice(-9)}%`])

    return NextResponse.json(r.rows)
  } catch (e: any) {
    console.error('[public-my-bookings GET]', e.message)
    return NextResponse.json([], { status: 200 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, action, date, time } = await req.json()
    if (!id || !action) return NextResponse.json({ error: 'id و action مطلوبان' }, { status: 400 })

    if (action === 'cancel') {
      const paid = await pool.query(
        `SELECT 1 FROM payment_receipts WHERE status = 'verified' AND $1::text = ANY(appointment_ids) LIMIT 1`,
        [id]
      )
      if (paid.rows.length > 0) {
        return NextResponse.json({ error: 'لا يمكن إلغاء الحجز بعد إتمام الدفع' }, { status: 400 })
      }

      const result = await pool.query(
        `UPDATE appointments
         SET status = 'cancelled'::appt_status,
             cancellation_reason = 'إلغاء بطلب العميل'
         WHERE id = $1 AND status IN ${ACTIVE}`,
        [id]
      )
      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'لا يمكن إلغاء هذا الحجز' }, { status: 400 })
      }
      return NextResponse.json({ ok: true, message: 'تم إلغاء الحجز' })
    }

    if (action === 'modify' && date && time) {
      // Get service duration
      const svc = await pool.query(
        'SELECT sv.duration_min FROM appointments a JOIN services sv ON sv.id = a.service_id WHERE a.id = $1',
        [id]
      )
      const dur = svc.rows[0]?.duration_min || 60
      const [h, m] = time.split(':').map(Number)
      const endMin = h * 60 + m + dur
      const endTime = `${String(Math.floor(endMin/60)).padStart(2,'0')}:${String(endMin%60).padStart(2,'0')}`

      await pool.query(
        `UPDATE appointments
         SET date = $1::date,
             start_time = $2::time,
             end_time   = $3::time,
             status     = 'pending'::appt_status
         WHERE id = $4 AND status IN ${ACTIVE}`,
        [date, time, endTime, id]
      )
      return NextResponse.json({ ok: true, message: 'تم تعديل الحجز' })
    }

    return NextResponse.json({ error: 'action غير صحيح' }, { status: 400 })
  } catch (e: any) {
    console.error('[public-my-bookings PUT]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
