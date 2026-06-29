import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_receipts (
      id               SERIAL PRIMARY KEY,
      order_id         TEXT,
      appointment_ids  TEXT[],
      customer_name    TEXT NOT NULL DEFAULT '',
      customer_phone   TEXT NOT NULL DEFAULT '',
      receipt_url      TEXT NOT NULL,
      amount           NUMERIC DEFAULT 0,
      payment_method   TEXT DEFAULT 'bank_transfer',
      status           TEXT DEFAULT 'pending',
      notes            TEXT DEFAULT '',
      created_at       TIMESTAMP DEFAULT NOW()
    )
  `)
}

export async function GET() {
  try {
    await ensureTable()
    const result = await pool.query(
      `SELECT * FROM payment_receipts ORDER BY created_at DESC LIMIT 200`
    )
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('[payments GET]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureTable()
    const { id, status, notes } = await req.json()
    if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 })

    const allowed = ['pending', 'verified', 'rejected']
    if (status && !allowed.includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }

    await pool.query(
      `UPDATE payment_receipts SET
        status = COALESCE($1, status),
        notes  = COALESCE($2, notes)
       WHERE id = $3`,
      [status ?? null, notes ?? null, id]
    )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[payments PUT]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
