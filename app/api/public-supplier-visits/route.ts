import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const supplierId = searchParams.get('supplierId')
  if (!supplierId) return NextResponse.json([], { status: 200 })

  try {
    const r = await pool.query(
      `SELECT v.id, v.visit_date::text, to_char(v.visit_time, 'HH24:MI') AS visit_time,
              v.purpose, v.status, v.admin_notes, v.created_at::text,
              COALESCE(s.name, '') AS branch_name
       FROM supplier_visit_requests v
       LEFT JOIN salons s ON s.id = v.branch_id
       WHERE v.supplier_id = $1
       ORDER BY v.visit_date DESC, v.visit_time DESC
       LIMIT 50`,
      [supplierId]
    )
    return NextResponse.json(r.rows)
  } catch (e: any) {
    console.error('[public-supplier-visits GET]', e.message)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supplierId, branchId, visitDate, visitTime, purpose } = await req.json()
    if (!supplierId || !visitDate || !visitTime) {
      return NextResponse.json({ error: 'التاريخ والوقت مطلوبان' }, { status: 400 })
    }

    const supplierCheck = await pool.query('SELECT id FROM suppliers WHERE id = $1 AND is_active = true', [supplierId])
    if (supplierCheck.rows.length === 0) {
      return NextResponse.json({ error: 'مورد غير صحيح' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO supplier_visit_requests (supplier_id, branch_id, visit_date, visit_time, purpose)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [supplierId, branchId || null, visitDate, visitTime, purpose || null]
    )
    return NextResponse.json({ ok: true, id: result.rows[0].id, message: 'تم إرسال طلب الزيارة' })
  } catch (err: any) {
    console.error('[public-supplier-visits POST]', err.message)
    return NextResponse.json({ error: err.message || 'حدث خطأ' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, supplierId, action } = await req.json()
    if (!id || !supplierId || action !== 'cancel') {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })
    }
    const result = await pool.query(
      `UPDATE supplier_visit_requests SET status = 'cancelled'
       WHERE id = $1 AND supplier_id = $2 AND status = 'pending'`,
      [id, supplierId]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'لا يمكن إلغاء هذا الطلب' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[public-supplier-visits PUT]', err.message)
    return NextResponse.json({ error: err.message || 'حدث خطأ' }, { status: 500 })
  }
}
