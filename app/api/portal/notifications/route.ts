import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  const staffId = (session?.user as any)?.staffId
  if (!staffId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const result = await pool.query(`
      SELECT a.id, u.name AS customer_name, s.name_ar AS service_name,
             a.date, a.start_time, a.status, a.created_at
      FROM appointments a
      JOIN users u ON u.id = a.customer_id
      JOIN services s ON s.id = a.service_id
      WHERE a.staff_id = $1 AND a.staff_seen = false
      ORDER BY a.created_at DESC
      LIMIT 20
    `, [staffId])
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('DB unavailable, returning empty notifications:', (err as Error).message)
    return NextResponse.json([])
  }
}

export async function PATCH() {
  const session = await auth()
  const staffId = (session?.user as any)?.staffId
  if (!staffId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    await pool.query('UPDATE appointments SET staff_seen = true WHERE staff_id = $1 AND staff_seen = false', [staffId])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DB unavailable, ignoring mark-seen:', (err as Error).message)
    return NextResponse.json({ ok: true })
  }
}
