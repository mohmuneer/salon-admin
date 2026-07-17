import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
import { validateEmail, normalizeEmail } from '@/lib/validate-email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, password } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 422 })
    }
    if (!phone && !email) {
      return NextResponse.json({ error: 'يرجى إدخال البريد الإلكتروني أو رقم الجوال' }, { status: 422 })
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 422 })
    }

    // Phone validation
    if (phone && !/^(05\d{8}|\+966\d{9}|966\d{9})$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'رقم الجوال غير صحيح (05XXXXXXXX)' }, { status: 422 })
    }

    // Email validation — comprehensive
    if (email) {
      const ev = validateEmail(email)
      if (!ev.valid) {
        return NextResponse.json({ error: ev.error, suggestion: ev.suggestion }, { status: 422 })
      }
    }

    // Check duplicates
    if (phone) {
      const ex = await pool.query('SELECT id FROM users WHERE phone = $1', [phone])
      if (ex.rows.length > 0) {
        return NextResponse.json({ error: 'رقم الجوال مستخدم مسبقاً' }, { status: 409 })
      }
    }
    if (email) {
      const normalizedEmail = normalizeEmail(email)
      const ex = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
      if (ex.rows.length > 0) {
        return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجل مسبقاً' }, { status: 409 })
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const normalizedEmail = email ? normalizeEmail(email) : null

    const result = await pool.query(
      `INSERT INTO users (name, phone, email, role, password_hash, is_active, email_verified, created_at)
       VALUES ($1, $2, $3, 'customer', $4, true, false, NOW())
       RETURNING id, name, phone, email`,
      [name, phone || null, normalizedEmail, passwordHash]
    )

    const user = result.rows[0]
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')
    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email },
      token,
      message: 'تم إنشاء الحساب بنجاح — يرجى التحقق من البريد الإلكتروني لتفعيل الحساب',
    })
  } catch (err) {
    console.error('register error:', err)
    return NextResponse.json({ error: 'حدث خطأ في التسجيل' }, { status: 500 })
  }
}
