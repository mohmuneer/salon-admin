import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { identifier, phone, password } = await req.json()
    const id = (identifier || phone || '').trim()

    if (!id || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو رقم الجوال وكلمة المرور مطلوبان' }, { status: 400 })
    }

    // Search by phone OR email
    const result = await pool.query(
      `SELECT id, name, phone, email, password_hash FROM users
       WHERE (phone = $1 OR email = $1) AND role = 'customer' AND is_active = true
       LIMIT 1`,
      [id]
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
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, phone: user.phone, email: user.email }, token })
  } catch (err) {
    console.error('login error:', err)
    return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول' }, { status: 500 })
  }
}
