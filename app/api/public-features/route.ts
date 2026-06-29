import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

const DEFAULT_FEATURES = [
  { icon: '💎', title_ar: 'خبراء متخصصون',   description_ar: 'فريق من أفضل المتخصصين في مجال التجميل والعناية بأكثر من 10 سنوات خبرة', sort_order: 1 },
  { icon: '🌿', title_ar: 'منتجات طبيعية',    description_ar: 'نستخدم أجود المنتجات الطبيعية والعضوية المعتمدة للحفاظ على صحة شعرك وبشرتك', sort_order: 2 },
  { icon: '⏰', title_ar: 'مواعيد مرنة',      description_ar: 'نوفر مواعيد تناسب جدولك اليومي طوال أيام الأسبوع من الصباح حتى المساء', sort_order: 3 },
  { icon: '🏆', title_ar: 'جودة مضمونة',      description_ar: 'نضمن لك رضاك الكامل عن خدماتنا وإلا أعدنا لك الخدمة مجاناً', sort_order: 4 },
  { icon: '✨', title_ar: 'بيئة فاخرة',       description_ar: 'استمتعي بتجربة تجميل لا مثيل لها في أجواء راقية مريحة وهادئة', sort_order: 5 },
  { icon: '🎁', title_ar: 'عروض حصرية',       description_ar: 'استفيدي من عروضنا وباقاتنا المميزة المتجددة على مدار الشهر', sort_order: 6 },
]

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public_features (
      id           SERIAL PRIMARY KEY,
      icon         VARCHAR(20)  NOT NULL DEFAULT '✨',
      image_url    TEXT         NOT NULL DEFAULT '',
      title_ar     TEXT         NOT NULL DEFAULT '',
      title_en     TEXT         NOT NULL DEFAULT '',
      description_ar TEXT       NOT NULL DEFAULT '',
      description_en TEXT       NOT NULL DEFAULT '',
      sort_order   INTEGER      NOT NULL DEFAULT 0,
      is_active    BOOLEAN      NOT NULL DEFAULT true,
      created_at   TIMESTAMPTZ           DEFAULT NOW()
    );
    DO $$ BEGIN
      BEGIN ALTER TABLE public_features ADD COLUMN image_url TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
    END $$;
  `)
}

export async function GET() {
  try {
    await ensureTable()
    const r = await pool.query(
      'SELECT * FROM public_features ORDER BY sort_order, id'
    )
    return NextResponse.json(r.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const body = await req.json()

    // Seed defaults
    if (body.seed) {
      await pool.query('DELETE FROM public_features')
      for (const f of DEFAULT_FEATURES) {
        await pool.query(
          `INSERT INTO public_features (icon, title_ar, description_ar, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [f.icon, f.title_ar, f.description_ar, f.sort_order]
        )
      }
      const r = await pool.query('SELECT * FROM public_features ORDER BY sort_order')
      return NextResponse.json(r.rows)
    }

    const { icon, image_url, title_ar, title_en, description_ar, description_en, sort_order } = body
    await pool.query(
      `INSERT INTO public_features (icon, image_url, title_ar, title_en, description_ar, description_en, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [icon || '✨', image_url || '', title_ar || '', title_en || '', description_ar || '', description_en || '', sort_order ?? 0]
    )
    const r = await pool.query('SELECT * FROM public_features ORDER BY sort_order, id')
    return NextResponse.json(r.rows)
  } catch (e: any) {
    console.error('[public-features POST]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureTable()
    const { id, icon, image_url, title_ar, title_en, description_ar, description_en, sort_order, is_active } = await req.json()
    await pool.query(
      `UPDATE public_features SET icon=$1, image_url=$2, title_ar=$3, title_en=$4, description_ar=$5, description_en=$6, sort_order=$7, is_active=$8 WHERE id=$9`,
      [icon, image_url || '', title_ar, title_en || '', description_ar, description_en || '', sort_order ?? 0, is_active ?? true, id]
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[public-features PUT]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureTable()
    const { id, is_active } = await req.json()
    await pool.query('UPDATE public_features SET is_active=$1 WHERE id=$2', [is_active, id])
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await ensureTable()
    await pool.query('DELETE FROM public_features WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
