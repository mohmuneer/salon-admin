import { NextResponse } from 'next/server'
import { mockOrders, addMockOrder } from '@/lib/mock-orders'

export async function GET() {
  return NextResponse.json(mockOrders)
}

export async function POST(req: Request) {
  const body = await req.json()
  const order = addMockOrder({
    customer_name: body.customer_name || 'عميل من التطبيق',
    phone: body.phone || '', total: body.total || 0,
    payment_method: body.payment_method || 'cash',
    items_count: body.items?.length || 0,
  })
  return NextResponse.json({ ok: true, orderId: order.id })
}
