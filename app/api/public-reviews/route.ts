import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public_reviews (
      id              SERIAL PRIMARY KEY,
      customer_name   TEXT        NOT NULL DEFAULT '',
      customer_avatar TEXT        NOT NULL DEFAULT '',
      rating          INTEGER     NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
      comment_ar      TEXT        NOT NULL DEFAULT '',
      comment_en      TEXT        NOT NULL DEFAULT '',
      is_active       BOOLEAN     NOT NULL DEFAULT true,
      sort_order      INTEGER     NOT NULL DEFAULT 0,
      created_at      TIMESTAMP            DEFAULT NOW()
    )
  `)
}

export async function GET() {
  try {
    await ensureTable()
    const r = await pool.query('SELECT * FROM public_reviews ORDER BY sort_order, id')
    return NextResponse.json(r.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const { customer_name, customer_avatar, rating, comment_ar, comment_en } = await req.json()
    await pool.query(
      `INSERT INTO public_reviews (customer_name, customer_avatar, rating, comment_ar, comment_en)
       VALUES ($1,$2,$3,$4,$5)`,
      [customer_name || '', customer_avatar || '', rating || 5, comment_ar || '', comment_en || '']
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[public-reviews POST]', e.message)
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureTable()
    const { id, customer_name, customer_avatar, rating, comment_ar, comment_en, is_active, sort_order } = await req.json()
    await pool.query(
      `UPDATE public_reviews SET customer_name=$1, customer_avatar=$2, rating=$3,
        comment_ar=$4, comment_en=$5, is_active=$6, sort_order=$7
       WHERE id=$8`,
      [customer_name || '', customer_avatar || '', rating || 5, comment_ar || '', comment_en || '', is_active ?? true, sort_order ?? 0, id]
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[public-reviews PUT]', e.message)
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await pool.query('DELETE FROM public_reviews WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}
