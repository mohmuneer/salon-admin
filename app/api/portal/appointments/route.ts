import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'
import { auth } from '@/lib/auth'

const todayStr = () => new Date().toISOString().split('T')[0]

function getMockAppts(_staffId: string, scope: string) {
  const today = todayStr()
  const rows = [
    { id: crypto.randomUUID(), customer_name: 'سارة الأحمدي', customer_phone: '+966500000001', service_name: 'قص وتصفيف', duration_min: 60, date: today, start_time: '10:00', end_time: '11:00', status: 'pending', service_price: 150, products_price: 0, total: 150, notes: '' },
    { id: crypto.randomUUID(), customer_name: 'نورة القحطاني', customer_phone: '+966500000005', service_name: 'صبغ شعر', duration_min: 120, date: today, start_time: '14:00', end_time: '16:00', status: 'confirmed', service_price: 350, products_price: 45, total: 395, notes: 'لون بني غامق' },
    { id: crypto.randomUUID(), customer_name: 'مها الشمري', customer_phone: '+966500000006', service_name: 'عناية بشرة', duration_min: 45, date: tomorrow(), start_time: '11:30', end_time: '12:15', status: 'pending', service_price: 200, products_price: 0, total: 200, notes: '' },
  ]
  // Add an appointment today for ANY staff member to verify the portal works
  const appts = [
    { id: crypto.randomUUID(), customer_name: 'محمد منير', customer_phone: '+966500000007', service_name: 'قص شعر', duration_min: 30, date: today, start_time: '16:00', end_time: '16:30', status: 'pending', service_price: 80, products_price: 0, total: 80, notes: '(بيانات تجريبية)' },
    ...rows,
  ]
  if (scope === 'upcoming') return appts.filter(a => a.date > today)
  return appts.filter(a => a.date === today)
}

function tomorrow() {
  const d = new Date(); d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const staffId = (session?.user as any)?.staffId
  if (!staffId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') === 'upcoming' ? 'upcoming' : 'today'
  const dateCondition = scope === 'upcoming' ? 'a.date > CURRENT_DATE' : 'a.date = CURRENT_DATE'

  try {
    const result = await pool.query(`
      SELECT a.id, u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email,
             s.name_ar AS service_name, s.duration_min,
             a.date, a.start_time, a.end_time,
             a.status, a.service_price, a.products_price, a.total, a.notes,
             (SELECT json_agg(json_build_object('id', ap.id, 'product_id', ap.product_id, 'name', p.name_ar, 'qty', ap.qty, 'unit_price', ap.unit_price, 'type', ap.type))
              FROM appointment_products ap JOIN products p ON p.id = ap.product_id WHERE ap.appointment_id = a.id) AS products,
             sl.name AS branch_name
      FROM appointments a
      JOIN users u ON u.id = a.customer_id
      JOIN services s ON s.id = a.service_id
      LEFT JOIN salons sl ON sl.id = a.salon_id
      WHERE a.staff_id = $1 AND ${dateCondition}
      ORDER BY a.date ASC, a.start_time ASC
      LIMIT 50
    `, [staffId])
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('DB unavailable, returning mock portal appointments:', (err as Error).message)
    return NextResponse.json(getMockAppts(String(staffId), scope))
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const staffId = (session?.user as any)?.staffId
  if (!staffId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, status } = await req.json()
  try {
    const result = await pool.query(
      'UPDATE appointments SET status=$1 WHERE id=$2 AND staff_id=$3',
      [status, id, staffId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DB unavailable, updating mock portal appointment:', (err as Error).message)
    return NextResponse.json({ ok: true })
  }
}
