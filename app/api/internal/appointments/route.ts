import { NextResponse } from 'next/server'
import { mockAppointments, addMockAppointment } from '@/lib/mock-appointments'

export async function GET() {
  return NextResponse.json(mockAppointments)
}

export async function POST(req: Request) {
  const body = await req.json()
  const appt = addMockAppointment({
    customer_name: body.customer_name || 'عميل من التطبيق',
    customer_phone: body.customer_phone || '',
    service_name: body.service_name || 'خدمة',
    duration_min: body.duration_min || 60,
    staff_name: body.staff_name || 'موظف',
    date: body.date || new Date().toISOString().split('T')[0],
    start_time: body.start_time || '09:00',
    end_time: body.end_time || '10:00',
    service_price: body.service_price || 0,
    total: body.total || 0,
    notes: body.notes || '',
  })
  return NextResponse.json({ ok: true, id: appt.id })
}
