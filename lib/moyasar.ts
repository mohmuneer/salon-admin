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
 * it covers as paid.
 *
 * Supports three order types:
 * - product: only an order (no appointment needed)
 * - service: an order + appointments
 * - mixed: an order (with both product & service items) + appointments
 *
 * Always re-fetches the payment from Moyasar's API server-side rather than
 * trusting the redirect/webhook payload, and checks the amount against the
 * real DB totals.
 *
 * Idempotent: safe to call multiple times for the same payment.
 */
export async function confirmGatewayPayment(params: {
  orderId?: string | null
  appointmentIds?: string[]
  moyasarPaymentId: string
}) {
  const orderId = params.orderId || null
  const appointmentIds = (params.appointmentIds || []).filter(Boolean)
  const { moyasarPaymentId } = params

  /* ── Validate that we have at least one reference ── */
  if (!orderId && appointmentIds.length === 0) {
    return { ok: false, error: 'لا يوجد طلب أو موعد مرتبط بهذا الدفع' }
  }

  /* ── Look up order (if provided) ── */
  let expected = 0
  let order: { total: number; payment_status: string; order_type: string } | null = null
  if (orderId) {
    const o = await pool.query('SELECT total, payment_status, order_type FROM orders WHERE id = $1', [orderId])
    if (o.rows.length === 0) return { ok: false, error: 'الطلب غير موجود' }
    order = o.rows[0]
    expected += Number(order!.total) || 0
  }

  /* ── Look up appointments (if provided) ── */
  let appointments: { id: string; total: number }[] = []
  if (appointmentIds.length > 0) {
    const a = await pool.query('SELECT id, total FROM appointments WHERE id = ANY($1::uuid[])', [appointmentIds])
    if (a.rows.length !== appointmentIds.length) return { ok: false, error: 'بعض المواعيد غير صحيحة' }
    appointments = a.rows
    // For mixed/service orders, the appointment total is included in the order total
    // Only add appointment totals separately for legacy flows where order doesn't cover them
    if (order && (order.order_type === 'mixed' || order.order_type === 'service')) {
      // Appointments are secondary — order total is the source of truth
    } else {
      expected += appointments.reduce((s, r) => s + (Number(r.total) || 0), 0)
    }
  }

  /* ── For product-only orders: appointment is NOT required ── */
  if (order && order.order_type === 'product' && appointmentIds.length === 0) {
    // Product-only: just validate against order.total
  }

  /* ── For service/mixed orders: appointments SHOULD be linked but are not
     strictly required for payment verification (order.total is authoritative) ── */

  // Already fully applied? (idempotency check)
  if (order?.payment_status === 'paid' && appointmentIds.length === 0) {
    return { ok: true, alreadyPaid: true }
  }

  /* ── Fetch payment from Moyasar API ── */
  const payment = await fetchMoyasarPayment(moyasarPaymentId)
  if (payment.status !== 'paid') {
    return { ok: false, error: `حالة الدفع: ${payment.status}` }
  }

  const expectedHalalas = Math.round(expected * 100)
  if (payment.currency !== 'SAR' || payment.amount !== expectedHalalas) {
    console.error('[moyasar] amount/currency mismatch', { orderId, appointmentIds, expectedHalalas, payment })
    return { ok: false, error: 'قيمة الدفع لا تطابق القيمة المطلوبة' }
  }

  /* ── Mark order as paid ── */
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

  /* ── Mark appointments as confirmed ── */
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
