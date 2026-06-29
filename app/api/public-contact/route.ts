import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { name, phone, message } = await req.json()

    if (!name || !phone || !message) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    await pool.query(
      `INSERT INTO contact_messages (name, phone, message, status, created_at)
       VALUES ($1, $2, $3, 'new', NOW())`,
      [name, phone, message]
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('public-contact error:', err)
    return NextResponse.json({ error: 'حدث خطأ في إرسال الرسالة' }, { status: 500 })
  }
}
