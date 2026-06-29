import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const staffId    = searchParams.get('staff_id')
  const date       = searchParams.get('date')
  const customerPhone = searchParams.get('phone')
  const serviceId  = searchParams.get('service_id')

  const result: any = { bookedSlots: [], customerHasBooking: null }

  // 1. Get booked time slots for this staff on this date
  if (staffId && date) {
    try {
      const r = await pool.query(`
        SELECT start_time::text AS start_time, status
        FROM appointments
        WHERE staff_id = $1
          AND date = $2
          AND status NOT IN ('cancelled', 'no_show')
        ORDER BY start_time
      `, [staffId, date])
      result.bookedSlots = r.rows.map((row: any) => String(row.start_time).slice(0,5))
    } catch {}
  }

  // 2. Check if this customer already has an upcoming booking for same service
  if (customerPhone && serviceId) {
    try {
      const r = await pool.query(`
        SELECT a.id, a.date::text, a.start_time::text, a.status,
          sv.name_ar AS service_name
        FROM appointments a
        JOIN services sv ON sv.id = a.service_id
        WHERE a.customer_phone = $1
          AND a.service_id = $2
          AND a.status IN ('pending', 'confirmed', 'in_progress')
          AND a.date >= CURRENT_DATE
        ORDER BY a.date, a.start_time
        LIMIT 1
      `, [customerPhone, serviceId])
      if (r.rows.length > 0) {
        result.customerHasBooking = {
          date: r.rows[0].date,
          time: String(r.rows[0].start_time).slice(0,5),
          status: r.rows[0].status,
          service: r.rows[0].service_name,
        }
      }
    } catch {}
  }

  return NextResponse.json(result)
}
