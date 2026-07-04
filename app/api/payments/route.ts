import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT pr.id, pr.order_id, pr.appointment_ids, pr.customer_name, pr.customer_phone, pr.receipt_url,
              pr.amount, pr.expected_amount, pr.payment_method, pr.status, pr.notes, pr.created_at,
              pr.verified_by, pr.verified_at, u.name AS verified_by_name
       FROM payment_receipts pr
       LEFT JOIN users u ON u.id = pr.verified_by
       ORDER BY pr.created_at DESC LIMIT 200`
    )
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('[payments GET]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, status, notes } = await req.json()
    if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 })

    const allowed = ['pending', 'verified', 'rejected']
    if (status && !allowed.includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }

    const session = await auth()
    const adminId = (session?.user as any)?.id || null
    const isDecision = status === 'verified' || status === 'rejected'

    // Update receipt status
    await pool.query(
      `UPDATE payment_receipts SET
        status      = COALESCE($1, status),
        notes       = COALESCE($2, notes),
        verified_by = CASE WHEN $3 THEN $4 ELSE verified_by END,
        verified_at = CASE WHEN $3 THEN NOW() ELSE verified_at END
       WHERE id = $5`,
      [status ?? null, notes ?? null, isDecision, adminId, id]
    )

    // Propagate status to related orders, appointments, and payments table
    if (status === 'verified' || status === 'rejected') {
      const receipt = await pool.query(
        `SELECT order_id, appointment_ids, amount FROM payment_receipts WHERE id = $1`,
        [id]
      )
      if (receipt.rows.length > 0) {
        const { order_id, appointment_ids, amount } = receipt.rows[0]

        if (status === 'verified') {
          // Mark linked order as paid
          if (order_id) {
            await pool.query(
              `UPDATE orders SET payment_status = 'paid', status = 'confirmed'
               WHERE id::text = $1 AND payment_status != 'paid'`,
              [order_id]
            ).catch(() => {})
            // Upsert payment record for the order
            await pool.query(
              `WITH upd AS (
                 UPDATE payments SET status = 'paid', paid_at = NOW()
                 WHERE source_type = 'order' AND source_id::text = $1 AND status = 'pending'
                 RETURNING 1
               )
               INSERT INTO payments (source_type, source_id, amount, method, status, paid_at)
               SELECT 'order', $1::uuid, $2, 'bank_transfer', 'paid', NOW()
               WHERE NOT EXISTS (SELECT 1 FROM upd)`,
              [order_id, amount]
            ).catch(() => {})
          }
          // Confirm linked appointments
          if (Array.isArray(appointment_ids) && appointment_ids.length > 0) {
            await pool.query(
              `UPDATE appointments SET status = 'confirmed'
               WHERE id::text = ANY($1::text[]) AND status IN ('pending','confirmed')`,
              [appointment_ids]
            ).catch(() => {})
            // Upsert payment records for appointments
            for (const apptId of appointment_ids) {
              await pool.query(
                `WITH upd AS (
                   UPDATE payments SET status = 'paid', paid_at = NOW()
                   WHERE source_type = 'appointment' AND source_id::text = $1 AND status = 'pending'
                   RETURNING 1
                 )
                 INSERT INTO payments (source_type, source_id, amount, method, status, paid_at)
                 SELECT 'appointment', $1::uuid, $2, 'bank_transfer', 'paid', NOW()
                 WHERE NOT EXISTS (SELECT 1 FROM upd)`,
                [apptId, amount]
              ).catch(() => {})
            }
          }
        }

        if (status === 'rejected') {
          // Reset order payment_status so customer can try again
          if (order_id) {
            await pool.query(
              `UPDATE orders SET payment_status = 'pending'
               WHERE id::text = $1 AND payment_status != 'paid'`,
              [order_id]
            ).catch(() => {})
            // Mark payment as failed
            await pool.query(
              `UPDATE payments SET status = 'failed'
               WHERE source_type = 'order' AND source_id::text = $1 AND status = 'pending'`,
              [order_id]
            ).catch(() => {})
          }
          // Mark appointment payments as failed
          if (Array.isArray(appointment_ids) && appointment_ids.length > 0) {
            await pool.query(
              `UPDATE payments SET status = 'failed'
               WHERE source_type = 'appointment' AND source_id::text = ANY($1::text[]) AND status = 'pending'`,
              [appointment_ids]
            ).catch(() => {})
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[payments PUT]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
