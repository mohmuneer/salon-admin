import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, phone, password } = await req.json()

    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }
    if (!/^05\d{8}$/.test(phone)) {
      return NextResponse.json({ error: 'رقم الجوال غير صحيح (05XXXXXXXX)' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }

    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'رقم الجوال مسجل مسبقاً' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (name, phone, role, password_hash, is_active, created_at)
       VALUES ($1, $2, 'customer', $3, true, NOW()) RETURNING id, name, phone, created_at`,
      [name, phone, passwordHash]
    )

    const user = result.rows[0]
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, phone: user.phone }, token })
  } catch (err) {
    console.error('register error:', err)
    return NextResponse.json({ error: 'حدث خطأ في التسجيل' }, { status: 500 })
  }
}
