import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json({ error: 'رقم الجوال وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const result = await pool.query(
      `SELECT id, name, phone, password_hash FROM users WHERE phone = $1 AND role = 'customer' AND is_active = true`,
      [phone]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, phone: user.phone }, token })
  } catch (err) {
    console.error('login error:', err)
    return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول' }, { status: 500 })
  }
}
