import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!re.test(email)) return false
  const parts = email.split('@')
  if (parts.length !== 2) return false
  const [, domain] = parts
  if (domain.length > 253) return false
  if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) return false
  if (!domain.includes('.')) return false
  const tld = domain.split('.').pop() || ''
  if (tld.length < 2) return false
  return true
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, password } = await req.json()

    if (!name || (!phone && !email) || !password) {
      return NextResponse.json({ error: 'الاسم وكلمة المرور مطلوبان، مع رقم الجوال أو البريد الإلكتروني' }, { status: 400 })
    }
    if (phone && !/^(05\d{8}|\+966\d{9}|966\d{9})$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'رقم الجوال غير صحيح (05XXXXXXXX)' }, { status: 400 })
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'صيغة البريد الإلكتروني غير صحيحة — تأكد من إدخال بريد حقيقي مثل name@gmail.com' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }

    // Check duplicate phone or email
    if (phone) {
      const ex = await pool.query('SELECT id FROM users WHERE phone = $1', [phone])
      if (ex.rows.length > 0) return NextResponse.json({ error: 'رقم الجوال مسجل مسبقاً' }, { status: 409 })
    }
    if (email) {
      const ex = await pool.query('SELECT id FROM users WHERE email = $1', [email])
      if (ex.rows.length > 0) return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (name, phone, email, role, password_hash, is_active, created_at)
       VALUES ($1, $2, $3, 'customer', $4, true, NOW()) RETURNING id, name, phone, email`,
      [name, phone || null, email || null, passwordHash]
    )

    const user = result.rows[0]
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, phone: user.phone, email: user.email }, token })
  } catch (err) {
    console.error('register error:', err)
    return NextResponse.json({ error: 'حدث خطأ في التسجيل' }, { status: 500 })
  }
}
