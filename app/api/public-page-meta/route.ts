import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM public_page_meta WHERE id = 1')
    if (result.rows.length > 0) return NextResponse.json(result.rows[0])
    return NextResponse.json({})
  } catch {
    return NextResponse.json({})
  }
}

export async function PUT(req: NextRequest) {
  try {
    const b = await req.json()
    const { title_ar, title_en, description_ar, description_en, keywords_ar, keywords_en, og_image, seo_title, seo_description, seo_keywords, seo_image } = b
    await pool.query(
      `INSERT INTO public_page_meta (id, title_ar, title_en, description_ar, description_en, keywords_ar, keywords_en, og_image)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         title_ar = EXCLUDED.title_ar, title_en = EXCLUDED.title_en,
         description_ar = EXCLUDED.description_ar, description_en = EXCLUDED.description_en,
         keywords_ar = EXCLUDED.keywords_ar, keywords_en = EXCLUDED.keywords_en,
         og_image = EXCLUDED.og_image, updated_at = NOW()`,
      [title_ar || '', title_en || '', description_ar || '', description_en || '', keywords_ar || '', keywords_en || '', og_image || seo_image || '']
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
