import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public_coupons (
      id               SERIAL PRIMARY KEY,
      code             TEXT         NOT NULL UNIQUE,
      discount_percent NUMERIC(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
      max_uses         INTEGER      NOT NULL DEFAULT 0,
      used_count       INTEGER      NOT NULL DEFAULT 0,
      valid_from       DATE,
      valid_until      DATE,
      is_active        BOOLEAN      NOT NULL DEFAULT true,
      created_at       TIMESTAMP             DEFAULT NOW()
    )
  `)
}

export async function GET() {
  try {
    await ensureTable()
    const r = await pool.query('SELECT * FROM public_coupons ORDER BY id')
    return NextResponse.json(r.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const { code, discount_percent, max_uses, valid_from, valid_until } = await req.json()
    await pool.query(
      `INSERT INTO public_coupons (code, discount_percent, max_uses, valid_from, valid_until)
       VALUES ($1,$2,$3,$4,$5)`,
      [String(code).toUpperCase().trim(), discount_percent, max_uses || 0, valid_from || null, valid_until || null]
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[public-coupons POST]', e.message)
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureTable()
    const { id, code, discount_percent, max_uses, valid_from, valid_until, is_active } = await req.json()
    await pool.query(
      `UPDATE public_coupons SET code=$1, discount_percent=$2, max_uses=$3,
        valid_from=$4, valid_until=$5, is_active=$6
       WHERE id=$7`,
      [String(code).toUpperCase().trim(), discount_percent, max_uses || 0, valid_from || null, valid_until || null, is_active ?? true, id]
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[public-coupons PUT]', e.message)
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await pool.query('DELETE FROM public_coupons WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}
