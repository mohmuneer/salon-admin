import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  const info: any = {
    hasSession: !!session,
    role: (session?.user as any)?.role || null,
    staffId: (session?.user as any)?.staffId || null,
    userName: session?.user?.name || null,
    serverTime: new Date().toISOString(),
  }

  try {
    const staffId = (session?.user as any)?.staffId
    if (staffId) {
      const r = await pool.query('SELECT COUNT(*) AS cnt FROM appointments WHERE staff_id = $1', [staffId])
      info.totalAppointmentsForStaff = parseInt(r.rows[0].cnt)
      const r2 = await pool.query('SELECT COUNT(*) AS cnt FROM appointments WHERE staff_id = $1 AND date = CURRENT_DATE', [staffId])
      info.todayAppointments = parseInt(r2.rows[0].cnt)
      const r3 = await pool.query('SELECT a.id, a.date, a.start_time, a.status FROM appointments a WHERE a.staff_id = $1 AND a.date = CURRENT_DATE LIMIT 5', [staffId])
      info.todayAppts = r3.rows
    }
    info.dbStatus = 'connected'
  } catch (e: any) {
    info.dbStatus = 'error'
    info.dbError = e.message
  }

  return NextResponse.json(info)
}
