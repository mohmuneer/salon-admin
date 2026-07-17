import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''

async function verifyGoogleToken(idToken: string): Promise<{ email: string; name: string; picture?: string } | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.aud !== GOOGLE_CLIENT_ID) return null
    if (data.iss !== 'accounts.google.com' && data.iss !== 'https://accounts.google.com') return null
    const exp = Number(data.exp)
    if (!exp || exp < Math.floor(Date.now() / 1000)) return null
    return { email: data.email, name: data.name, picture: data.picture }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: 'تسجيل الدخول بـ Google غير مفعّل حالياً' }, { status: 503 })
    }

    const { credential } = await req.json()
    if (!credential) {
      return NextResponse.json({ error: 'بيانات تسجيل الدخول غير مكتملة' }, { status: 400 })
    }

    const googleUser = await verifyGoogleToken(credential)
    if (!googleUser) {
      return NextResponse.json({ error: 'فشل التحقق من حساب Google' }, { status: 401 })
    }

    const email = googleUser.email.toLowerCase().trim()
    const name = googleUser.name.trim()

    let result = await pool.query(
      `SELECT id, name, phone, email FROM users
       WHERE email = $1 AND role = 'customer' AND is_active = true
       LIMIT 1`,
      [email]
    )

    let user

    if (result.rows.length > 0) {
      user = result.rows[0]
      if (user.name !== name) {
        await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, user.id])
        user.name = name
      }
    } else {
      result = await pool.query(
        `INSERT INTO users (name, email, role, is_active, created_at)
         VALUES ($1, $2, 'customer', true, NOW())
         RETURNING id, name, phone, email`,
        [name, email]
      )
      user = result.rows[0]
    }

    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')
    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email },
      token,
    })
  } catch (err) {
    console.error('[google-login]', err)
    return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول بـ Google' }, { status: 500 })
  }
}
