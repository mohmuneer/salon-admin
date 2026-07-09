import pool from '@/lib/db'

const API_BASE = 'https://api.moyasar.com/v1'

export function isMoyasarEnabled() {
  return !!(process.env.MOYASAR_SECRET_KEY && process.env.MOYASAR_PUBLISHABLE_KEY)
}

export function getPublishableKey() {
  return process.env.MOYASAR_PUBLISHABLE_KEY || null
}

function authHeader() {
  const secret = process.env.MOYASAR_SECRET_KEY || ''
  return 'Basic ' + Buffer.from(`${secret}:`).toString('base64')
}

export type MoyasarPayment = {
  id: string
  status: 'initiated' | 'paid' | 'failed' | 'authorized' | 'captured' | 'refunded' | 'voided' | 'verified'
  amount: number // halalas
  currency: string
  metadata?: Record<string, any> | null
}

/** Fetch a payment directly from Moyasar's API - never trust a client-supplied status. */
export async function fetchMoyasarPayment(paymentId: string): Promise<MoyasarPayment> {
  const res = await fetch(`${API_BASE}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  })
  if (!res.ok) throw new Error(`Moyasar fetch payment failed: ${res.status}`)
  return res.json()
}

/**
 * Verify a Moyasar payment and, if valid, mark the order and/or appointments
 * it covers as paid. Mirrors the same "one payment can cover an order plus
 * several booked appointments together" shape already used by the manual
 * bank-transfer flow (payment_receipts.order_id + appointment_ids), so a
 * single "pay all" checkout works the same way regardless of payment method.
 *
 * Always re-fetches the payment from Moyasar's API server-side rather than
 * trusting the redirect/webhook payload, and checks the amount against the
 * real DB totals - never trust the gateway (or the client) alone for the
 * amount, same principle as the manual bank-transfer verification and the
 * price-tampering fixes elsewhere in this app.
 *
 * Idempotent: safe to call multiple times for the same payment (e.g. once
 * from the callback redirect and again from the webhook).
 */
export async function confirmGatewayPayment(params: {
  orderId?: string | null
  appointmentIds?: string[]
  moyasarPaymentId: string
}) {
  const orderId = params.orderId || null
  const appointmentIds = (params.appointmentIds || []).filter(Boolean)
  const { moyasarPaymentId } = params

  if (!orderId && appointmentIds.length === 0) {
    return { ok: false, error: 'لا يوجد طلب أو موعد مرتبط بهذا الدفع' }
  }

  let expected = 0
  let order: { total: number; payment_status: string } | null = null
  if (orderId) {
    const o = await pool.query('SELECT total, payment_status FROM orders WHERE id = $1', [orderId])
    if (o.rows.length === 0) return { ok: false, error: 'الطلب غير موجود' }
    order = o.rows[0]
    expected += Number(order!.total) || 0
  }

  let appointments: { id: string; total: number }[] = []
  if (appointmentIds.length > 0) {
    const a = await pool.query('SELECT id, total FROM appointments WHERE id = ANY($1::uuid[])', [appointmentIds])
    if (a.rows.length !== appointmentIds.length) return { ok: false, error: 'بعض المواعيد غير صحيحة' }
    appointments = a.rows
    expected += appointments.reduce((s, r) => s + (Number(r.total) || 0), 0)
  }

  // Already fully applied? (best-effort idempotency check on the order side)
  if (order?.payment_status === 'paid' && appointmentIds.length === 0) {
    return { ok: true, alreadyPaid: true }
  }

  const payment = await fetchMoyasarPayment(moyasarPaymentId)
  if (payment.status !== 'paid') {
    return { ok: false, error: `حالة الدفع: ${payment.status}` }
  }

  const expectedHalalas = Math.round(expected * 100)
  if (payment.currency !== 'SAR' || payment.amount !== expectedHalalas) {
    console.error('[moyasar] amount/currency mismatch', { orderId, appointmentIds, expectedHalalas, payment })
    return { ok: false, error: 'قيمة الدفع لا تطابق القيمة المطلوبة' }
  }

  if (orderId) {
    await pool.query(
      `UPDATE orders SET payment_status = 'paid', status = 'confirmed' WHERE id = $1 AND payment_status != 'paid'`,
      [orderId]
    )
    await pool.query(
      `WITH upd AS (
         UPDATE payments SET status = 'paid', gateway_ref = $2, paid_at = NOW()
         WHERE source_type = 'order' AND source_id = $1 AND status = 'pending'
         RETURNING 1
       )
       INSERT INTO payments (source_type, source_id, amount, method, status, gateway_ref, paid_at)
       SELECT 'order', $1, $3, 'card', 'paid', $2, NOW()
       WHERE NOT EXISTS (SELECT 1 FROM upd)`,
      [orderId, moyasarPaymentId, order!.total]
    )
  }

  for (const appt of appointments) {
    await pool.query(
      `UPDATE appointments SET status = 'confirmed' WHERE id = $1 AND status IN ('pending','confirmed')`,
      [appt.id]
    )
    await pool.query(
      `WITH upd AS (
         UPDATE payments SET status = 'paid', gateway_ref = $2, paid_at = NOW()
         WHERE source_type = 'appointment' AND source_id = $1 AND status = 'pending'
         RETURNING 1
       )
       INSERT INTO payments (source_type, source_id, amount, method, status, gateway_ref, paid_at)
       SELECT 'appointment', $1, $3, 'card', 'paid', $2, NOW()
       WHERE NOT EXISTS (SELECT 1 FROM upd)`,
      [appt.id, moyasarPaymentId, appt.total]
    )
  }

  return { ok: true }
}
