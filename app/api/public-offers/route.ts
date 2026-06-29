import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

/* Ensure all extended columns exist (idempotent migration) */
async function ensureColumns() {
  await pool.query(`
    DO $$ BEGIN
      BEGIN ALTER TABLE public_offers ADD COLUMN image_url          TEXT        NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN mobile_image_url   TEXT        NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN thumbnail_url      TEXT        NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN gallery            JSONB                DEFAULT '[]'; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN before_after       JSONB                DEFAULT '[]'; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN cta_text           TEXT        NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN cta_link           TEXT        NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN cta_action         TEXT        NOT NULL DEFAULT 'book'; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN linked_service_id  UUID        REFERENCES services(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN countdown_end      TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN whatsapp_number    TEXT        NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN whatsapp_message   TEXT        NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN branch_id          UUID        REFERENCES salons(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN seo_title          TEXT        NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN seo_description    TEXT        NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN views_count        INTEGER     NOT NULL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN clicks_count       INTEGER     NOT NULL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE public_offers ADD COLUMN bookings_count     INTEGER     NOT NULL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
    END $$;
  `)
}

export async function GET() {
  try {
    await ensureColumns()
    const result = await pool.query('SELECT * FROM public_offers ORDER BY sort_order, id')
    return NextResponse.json(result.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureColumns()
    const b = await req.json()
    const {
      title_ar, title_en, description_ar, description_en,
      original_price, offer_price, valid_until, badge,
      image_url, mobile_image_url, thumbnail_url,
      gallery, before_after,
      cta_text, cta_link, cta_action,
      linked_service_id, countdown_end,
      whatsapp_number, whatsapp_message,
      branch_id, seo_title, seo_description,
    } = b

    await pool.query(
      `INSERT INTO public_offers (
        title_ar, title_en, description_ar, description_en,
        original_price, offer_price, valid_until, badge,
        image_url, mobile_image_url, thumbnail_url,
        gallery, before_after,
        cta_text, cta_link, cta_action,
        linked_service_id, countdown_end,
        whatsapp_number, whatsapp_message,
        branch_id, seo_title, seo_description
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,
        $12,$13,
        $14,$15,$16,
        $17,$18,
        $19,$20,
        $21,$22,$23
      )`,
      [
        title_ar, title_en, description_ar, description_en,
        original_price, offer_price,
        valid_until || null, badge,
        image_url || '', mobile_image_url || '', thumbnail_url || '',
        JSON.stringify(gallery || []), JSON.stringify(before_after || []),
        cta_text, cta_link, cta_action || 'book',
        linked_service_id || null, countdown_end || null,
        whatsapp_number || '', whatsapp_message || '',
        branch_id || null, seo_title || '', seo_description || '',
      ]
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[public-offers POST]', e.message)
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureColumns()
    const b = await req.json()
    const {
      id,
      title_ar, title_en, description_ar, description_en,
      original_price, offer_price, valid_until, badge,
      is_active, sort_order,
      image_url, mobile_image_url, thumbnail_url,
      gallery, before_after,
      cta_text, cta_link, cta_action,
      linked_service_id, countdown_end,
      whatsapp_number, whatsapp_message,
      branch_id, seo_title, seo_description,
    } = b

    await pool.query(
      `UPDATE public_offers SET
        title_ar=$1, title_en=$2, description_ar=$3, description_en=$4,
        original_price=$5, offer_price=$6, valid_until=$7, badge=$8,
        is_active=$9, sort_order=$10,
        image_url=$11, mobile_image_url=$12, thumbnail_url=$13,
        gallery=$14, before_after=$15,
        cta_text=$16, cta_link=$17, cta_action=$18,
        linked_service_id=$19, countdown_end=$20,
        whatsapp_number=$21, whatsapp_message=$22,
        branch_id=$23, seo_title=$24, seo_description=$25
      WHERE id=$26`,
      [
        title_ar, title_en, description_ar, description_en,
        original_price, offer_price,
        valid_until || null, badge,
        is_active ?? true, sort_order ?? 0,
        image_url || '', mobile_image_url || '', thumbnail_url || '',
        JSON.stringify(gallery || []), JSON.stringify(before_after || []),
        cta_text || '', cta_link || '', cta_action || 'book',
        linked_service_id || null, countdown_end || null,
        whatsapp_number || '', whatsapp_message || '',
        branch_id || null, seo_title || '', seo_description || '',
        id,
      ]
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[public-offers PUT]', e.message)
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await pool.query('DELETE FROM public_offers WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error' }, { status: 500 })
  }
}
