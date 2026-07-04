import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT v.id, v.visit_date::text, to_char(v.visit_time, 'HH24:MI') AS visit_time,
             v.purpose, v.status, v.admin_notes, v.created_at::text,
             v.attachment_url, v.attachment_name,
             sup.id AS supplier_id, sup.name_ar AS supplier_name_ar, sup.name_en AS supplier_name_en, sup.phone AS supplier_phone,
             COALESCE(s.name, '') AS branch_name
      FROM supplier_visit_requests v
      JOIN suppliers sup ON sup.id = v.supplier_id
      LEFT JOIN salons s ON s.id = v.branch_id
      ORDER BY v.visit_date DESC, v.visit_time DESC
    `)
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('Supplier visits GET error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, status, admin_notes } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'id و status مطلوبان' }, { status: 400 })

    const allowed = ['pending', 'approved', 'rejected', 'completed', 'cancelled']
    if (!allowed.includes(status)) return NextResponse.json({ error: 'status غير صحيح' }, { status: 400 })

    await pool.query(
      `UPDATE supplier_visit_requests SET status = $1::supplier_visit_status, admin_notes = $2 WHERE id = $3`,
      [status, admin_notes ?? null, id]
    )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Supplier visits PUT error:', err)
    return NextResponse.json({ error: err.message || 'DB error' }, { status: 500 })
  }
}
