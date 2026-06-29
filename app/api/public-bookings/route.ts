import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      serviceId, date, time, customerName, customerPhone, price: clientPrice,
      staffId: selectedStaffId, branchId: selectedBranchId, sessionProductIds,
    } = body

    if (!serviceId || !date || !time || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    /* ── 1. Resolve service ID ── */
    let resolvedServiceId = serviceId
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(serviceId))
    if (!isUuid) {
      const idx = parseInt(String(serviceId).replace(/\D/g, ''), 10) || 1
      const svc = await pool.query(
        'SELECT id FROM services WHERE is_active = true ORDER BY sort_order, name_ar OFFSET $1 LIMIT 1',
        [idx - 1]
      ).catch(() => ({ rows: [] }))
      if (svc.rows.length > 0) resolvedServiceId = svc.rows[0].id
      else {
        const fb = await pool.query('SELECT id FROM services WHERE is_active = true LIMIT 1').catch(() => ({ rows: [] }))
        if (fb.rows.length > 0) resolvedServiceId = fb.rows[0].id
      }
    }

    /* ── 2. Get salon ── */
    const branchUuid = selectedBranchId && /^[0-9a-f-]{36}$/i.test(selectedBranchId) ? selectedBranchId : null
    const salonRes = await pool.query(
      branchUuid
        ? 'SELECT id FROM salons WHERE id = $1 LIMIT 1'
        : 'SELECT id FROM salons WHERE is_active = true ORDER BY id LIMIT 1',
      branchUuid ? [branchUuid] : []
    ).catch(() => ({ rows: [] }))
    const salonId = salonRes.rows[0]?.id

    /* ── 3. Resolve staff ── */
    const staffUuid = selectedStaffId && /^[0-9a-f-]{36}$/i.test(String(selectedStaffId)) ? selectedStaffId : null
    let staffId = staffUuid
    if (!staffId) {
      const sq = salonId
        ? 'SELECT id FROM staff WHERE is_active = true AND salon_id = $1 LIMIT 1'
        : 'SELECT id FROM staff WHERE is_active = true LIMIT 1'
      const sr = await pool.query(sq, salonId ? [salonId] : []).catch(() => ({ rows: [] }))
      staffId = sr.rows[0]?.id || null
    }

    /* ── 4. Find or create customer ──
       users table: id, name, phone, email, role, gender, avatar_url, fcm_token, is_active, created_at, password_hash
       NOTE: no salon_id column */
    const cleanPhone = customerPhone.replace(/^0/, '966').replace(/[^0-9]/g, '')
    let customerId: string

    const existU = await pool.query(
      'SELECT id FROM users WHERE phone LIKE $1 LIMIT 1', [`%${cleanPhone.slice(-9)}%`]
    ).catch(() => ({ rows: [] }))

    if (existU.rows.length > 0) {
      customerId = existU.rows[0].id
    } else {
      const newU = await pool.query(
        `INSERT INTO users (name, phone, password_hash, role) VALUES ($1, $2, '', 'customer') RETURNING id`,
        [customerName, cleanPhone]
      ).catch(async () => {
        // Fallback: minimal insert
        return pool.query(`INSERT INTO users (name, phone) VALUES ($1, $2) RETURNING id`, [customerName, cleanPhone])
          .catch(() => ({ rows: [] }))
      })
      customerId = newU.rows[0]?.id
      if (!customerId) {
        return NextResponse.json({ error: 'تعذّر تسجيل بيانات العميل' }, { status: 500 })
      }
    }

    /* ── 5. Service duration + price ── */
    const svcInfo = await pool.query(
      'SELECT duration_min, price FROM services WHERE id = $1', [resolvedServiceId]
    ).catch(() => ({ rows: [] }))
    const durationMin = svcInfo.rows[0]?.duration_min || 60
    const price       = clientPrice || svcInfo.rows[0]?.price || 0

    const [h, m] = time.split(':').map(Number)
    const endMin  = h * 60 + m + durationMin
    const endTime = `${String(Math.floor(endMin/60)).padStart(2,'0')}:${String(endMin%60).padStart(2,'0')}`

    /* ── 6. Notes ── */
    const notes = [
      'حجز عبر الموقع',
      customerName, customerPhone,
      sessionProductIds?.length ? `منتجات: ${sessionProductIds.join(', ')}` : '',
    ].filter(Boolean).join(' — ')

    /* ── 7. Insert appointment ── (total is GENERATED ALWAYS, do NOT include it) */
    const apptRes = await pool.query(
      `INSERT INTO appointments (customer_id, staff_id, service_id, salon_id, date, start_time, end_time, status, service_price, products_price, notes, staff_seen)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,0,$9,false) RETURNING id`,
      [customerId, staffId, resolvedServiceId, salonId, date, time, endTime, price, notes]
    )

    const apptId = apptRes.rows[0]?.id
    return NextResponse.json({ ok: true, id: apptId || 'BK'+Date.now().toString(36).toUpperCase(), message: 'تم الحجز بنجاح' })

  } catch (err: any) {
    console.error('[public-bookings]', err.message)
    return NextResponse.json({ error: err.message || 'حدث خطأ في الحجز' }, { status: 500 })
  }
}
