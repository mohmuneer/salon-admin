import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest) {
  try {
    const { id, name_ar, name_en, email, theme, currentPassword, newPassword } = await req.json()
    if (!id || !name_ar) return NextResponse.json({ error: 'id واسم المورد مطلوبان' }, { status: 400 })

    const existing = await pool.query('SELECT password_hash FROM suppliers WHERE id = $1 AND is_active = true', [id])
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'مورد غير موجود' }, { status: 404 })
    }

    let passwordHash: string | null = null
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'كلمة المرور الحالية مطلوبة لتغييرها' }, { status: 400 })
      }
      const valid = existing.rows[0].password_hash
        ? await bcrypt.compare(currentPassword, existing.rows[0].password_hash)
        : false
      if (!valid) {
        return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 401 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
      }
      passwordHash = await bcrypt.hash(newPassword, 10)
    }

    const allowedThemes = ['light', 'dark', 'gold', 'blue', 'emerald', 'rose']
    const safeTheme = allowedThemes.includes(theme) ? theme : null

    await pool.query(
      `UPDATE suppliers SET
         name_ar = $1,
         name_en = $2,
         email   = $3,
         theme   = COALESCE($4, theme),
         password_hash = COALESCE($5, password_hash)
       WHERE id = $6`,
      [name_ar, name_en || null, email || null, safeTheme, passwordHash, id]
    )

    const updated = await pool.query(
      'SELECT id, name_ar, name_en, phone, email, theme FROM suppliers WHERE id = $1', [id]
    )
    return NextResponse.json({ ok: true, supplier: updated.rows[0] })
  } catch (err: any) {
    console.error('[public-supplier-account PUT]', err.message)
    return NextResponse.json({ error: err.message || 'حدث خطأ' }, { status: 500 })
  }
}
