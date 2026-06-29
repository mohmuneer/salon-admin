import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public_banner (
      id           SERIAL PRIMARY KEY,
      title_ar     TEXT        NOT NULL DEFAULT '',
      title_en     TEXT        NOT NULL DEFAULT '',
      subtitle_ar  TEXT        NOT NULL DEFAULT '',
      subtitle_en  TEXT        NOT NULL DEFAULT '',
      image_url    TEXT        NOT NULL DEFAULT '',
      video_url    TEXT        NOT NULL DEFAULT '',
      cta_text_ar  TEXT        NOT NULL DEFAULT '',
      cta_text_en  TEXT        NOT NULL DEFAULT '',
      cta_link     TEXT        NOT NULL DEFAULT '',
      cta_action   TEXT        NOT NULL DEFAULT 'book'
                   CHECK (cta_action IN ('book','whatsapp','link','services')),
      is_active    BOOLEAN     NOT NULL DEFAULT true,
      created_at   TIMESTAMP            DEFAULT NOW()
    )
  `)
}

export async function GET() {
  try {
    await ensureTable()
    const r = await pool.query('SELECT * FROM public_banner ORDER BY id')
    return NextResponse.json(r.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const { title_ar, title_en, subtitle_ar, subtitle_en, image_url, video_url, cta_text_ar, cta_text_en, cta_link, cta_action } = await req.json()
    await pool.query(
      `INSERT INTO public_banner (title_ar, title_en, subtitle_ar, subtitle_en, image_url, video_url, cta_text_ar, cta_text_en, cta_link, cta_action)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [title_ar || '', title_en || '', subtitle_ar || '', subtitle_en || '', image_url || '', video_url || '', cta_text_ar || '', cta_text_en || '', cta_link || '', cta_action || 'book']
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[public-banner POST]', e.message)
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureTable()
    const { id, title_ar, title_en, subtitle_ar, subtitle_en, image_url, video_url, cta_text_ar, cta_text_en, cta_link, cta_action, is_active } = await req.json()
    await pool.query(
      `UPDATE public_banner SET title_ar=$1, title_en=$2, subtitle_ar=$3, subtitle_en=$4,
        image_url=$5, video_url=$6, cta_text_ar=$7, cta_text_en=$8, cta_link=$9, cta_action=$10, is_active=$11
       WHERE id=$12`,
      [title_ar || '', title_en || '', subtitle_ar || '', subtitle_en || '', image_url || '', video_url || '', cta_text_ar || '', cta_text_en || '', cta_link || '', cta_action || 'book', is_active ?? true, id]
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[public-banner PUT]', e.message)
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await pool.query('DELETE FROM public_banner WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}
