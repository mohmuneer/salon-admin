import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'
import { mockAppointments, addMockAppointment } from '@/lib/mock-appointments'

function filterMock(data: typeof mockAppointments, status?: string, date?: string, search?: string) {
  return data.filter(a => {
    if (status && status !== 'all' && a.status !== status) return false
    if (date && a.date !== date) return false
    if (search && !a.customer_name.includes(search) && !a.customer_phone.includes(search)) return false
    return true
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const date = searchParams.get('date')
  const search = searchParams.get('search')

  let where = 'WHERE 1=1'
  const params: string[] = []
  let i = 1

  if (status && status !== 'all') { where += ` AND a.status = $${i++}`; params.push(status) }
  if (date) { where += ` AND a.date = $${i++}`; params.push(date) }
  if (search) { where += ` AND (u.name ILIKE $${i} OR u.phone ILIKE $${i})`; params.push(`%${search}%`); i++ }

  try {
    const result = await pool.query(`
      SELECT a.id, u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email,
             s.name_ar AS service_name, s.duration_min,
             st_u.name AS staff_name, a.date, a.start_time, a.end_time,
             a.status, a.service_price, a.products_price, a.total, a.notes,
             sl.name AS branch_name
      FROM appointments a
      JOIN users u ON u.id = a.customer_id
      JOIN services s ON s.id = a.service_id
      JOIN staff st ON st.id = a.staff_id
      JOIN users st_u ON st_u.id = st.user_id
      LEFT JOIN salons sl ON sl.id = a.salon_id
      ${where}
      ORDER BY a.date DESC, a.start_time DESC
      LIMIT 50
    `, params)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('DB unavailable, returning mock appointments:', (err as Error).message)
    let merged = [...mockAppointments]
    if (!status && !date && !search) {
      try {
        const ac = new AbortController()
        setTimeout(() => ac.abort(), 2000)
        const res = await fetch('http://localhost:3002/api/internal/appointments', { signal: ac.signal })
        if (res.ok) {
          const customerAppts = await res.json()
          merged = [...merged, ...customerAppts]
          merged.sort((a, b) => `${b.date}${b.start_time}`.localeCompare(`${a.date}${a.start_time}`))
        }
      } catch {}
    }
    const filtered = filterMock(merged, status || undefined, date || undefined, search || undefined)
    return NextResponse.json(filtered)
  }
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  try {
    await pool.query('UPDATE appointments SET status=$1 WHERE id=$2', [status, id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DB unavailable, updating mock appointment:', (err as Error).message)
    const a = mockAppointments.find(a => a.id === id)
    if (a) a.status = status
    return NextResponse.json({ ok: true })
  }
}
