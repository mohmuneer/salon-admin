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
      `SELECT id, name_ar, name_en, phone, email, password_hash FROM suppliers
       WHERE phone = $1 AND is_active = true LIMIT 1`,
      [phone.trim()]
    )

    if (result.rows.length === 0 || !result.rows[0].password_hash) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    const supplier = result.rows[0]
    const valid = await bcrypt.compare(password, supplier.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    return NextResponse.json({
      ok: true,
      supplier: { id: supplier.id, name_ar: supplier.name_ar, name_en: supplier.name_en, phone: supplier.phone, email: supplier.email },
    })
  } catch (err: any) {
    console.error('supplier login error:', err)
    return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول' }, { status: 500 })
  }
}
