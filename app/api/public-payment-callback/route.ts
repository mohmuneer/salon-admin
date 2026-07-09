import { NextResponse, NextRequest } from 'next/server'
import { confirmGatewayPayment } from '@/lib/moyasar'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')
  const appointmentIdsRaw = searchParams.get('appointmentIds')
  const paymentId = searchParams.get('paymentId') || searchParams.get('id')

  const appointmentIds = appointmentIdsRaw ? appointmentIdsRaw.split(',').filter(Boolean) : []

  if (!paymentId || (!orderId && appointmentIds.length === 0)) {
    return NextResponse.json({ ok: false, error: 'بيانات غير كافية للتحقق من الدفع' }, { status: 400 })
  }

  try {
    const result = await confirmGatewayPayment({ orderId, appointmentIds, moyasarPaymentId: paymentId })
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (err: any) {
    console.error('[public-payment-callback]', err.message)
    return NextResponse.json({ ok: false, error: 'حدث خطأ أثناء التحقق من الدفع' }, { status: 500 })
  }
}
