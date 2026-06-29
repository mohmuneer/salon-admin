import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public_ads (
      id           SERIAL PRIMARY KEY,
      title_ar     TEXT        NOT NULL DEFAULT '',
      title_en     TEXT        NOT NULL DEFAULT '',
      youtube_id   TEXT        NOT NULL DEFAULT '',
      description_ar TEXT      NOT NULL DEFAULT '',
      description_en TEXT      NOT NULL DEFAULT '',
      is_active    BOOLEAN     NOT NULL DEFAULT true,
      sort_order   INTEGER     NOT NULL DEFAULT 0,
      created_at   TIMESTAMP            DEFAULT NOW()
    );
    DO $$ BEGIN
      BEGIN ALTER TABLE public_ads ADD COLUMN youtube_url TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_ads ADD COLUMN image_url   TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_ads ADD COLUMN branch_id   UUID REFERENCES salons(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN NULL; END;
    END $$;
  `)
}

export async function GET() {
  try {
    await ensureTable()
    const r = await pool.query('SELECT * FROM public_ads ORDER BY sort_order, id')
    return NextResponse.json(r.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const { title_ar, title_en, youtube_id, youtube_url, description_ar, description_en, image_url, branch_id } = await req.json()
    await pool.query(
      `INSERT INTO public_ads (title_ar, title_en, youtube_id, youtube_url, description_ar, description_en, image_url, branch_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [title_ar || '', title_en || '', youtube_id || '', youtube_url || '', description_ar || '', description_en || '', image_url || '', branch_id || null]
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[public-ads POST]', e.message)
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureTable()
    const { id, title_ar, title_en, youtube_id, youtube_url, description_ar, description_en, is_active, sort_order, image_url, branch_id } = await req.json()
    await pool.query(
      `UPDATE public_ads SET title_ar=$1, title_en=$2, youtube_id=$3, youtube_url=$4,
        description_ar=$5, description_en=$6, is_active=$7, sort_order=$8, image_url=$9, branch_id=$10
       WHERE id=$11`,
      [title_ar || '', title_en || '', youtube_id || '', youtube_url || '', description_ar || '', description_en || '', is_active ?? true, sort_order ?? 0, image_url || '', branch_id || null, id]
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[public-ads PUT]', e.message)
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await pool.query('DELETE FROM public_ads WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}
