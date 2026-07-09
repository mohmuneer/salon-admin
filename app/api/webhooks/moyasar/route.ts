import { NextResponse, NextRequest } from 'next/server'
import { confirmGatewayPayment } from '@/lib/moyasar'

/**
 * Moyasar webhook receiver - a reliability backstop in case the customer
 * closes the browser before the callback_url redirect completes. Configure
 * this URL (https://yourdomain.com/api/webhooks/moyasar) in the Moyasar
 * dashboard, subscribed to at least payment_paid.
 *
 * The payload's own `secret_token` field is checked against
 * MOYASAR_WEBHOOK_SECRET (set when creating the webhook in the dashboard) to
 * confirm the request genuinely came from Moyasar. The payment status is
 * still always re-verified via the authenticated API call in
 * confirmGatewayPayment rather than trusted from the webhook body directly.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const expectedSecret = process.env.MOYASAR_WEBHOOK_SECRET
    if (!expectedSecret || body.secret_token !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paymentId = body?.data?.id
    const orderId = body?.data?.metadata?.order_id || null
    const appointmentIds: string[] = body?.data?.metadata?.appointment_ids
      ? String(body.data.metadata.appointment_ids).split(',').filter(Boolean)
      : []
    if (!paymentId || (!orderId && appointmentIds.length === 0)) {
      // Not a payment we recognize (missing our own metadata) - acknowledge
      // so Moyasar doesn't retry.
      return NextResponse.json({ ok: true })
    }

    await confirmGatewayPayment({ orderId, appointmentIds, moyasarPaymentId: paymentId })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[webhooks/moyasar]', err.message)
    // Let Moyasar retry - this could be a transient DB/network error.
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
