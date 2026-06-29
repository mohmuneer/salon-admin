import { NextResponse, NextRequest } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), '..', 'settings-data.json')

const defaults = {
  name: 'صالون جلامور',
  name_en: 'Glamour Salon',
  logo_url: '/logo.png',
  address: 'جدة، حي الروضة',
  city: 'جدة',
  phone: '+966500000000',
  email: 'info@glamour.sa',
  opening_time: '10:00',
  closing_time: '22:00',
  theme: 'gold',
  /* Extended — populated from DB */
  whatsapp_number: '',
  whatsapp_message: 'مرحباً، أرغب بالاستفسار عن الخدمات',
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  seo_image: '',
  instagram: '',
  twitter: '',
  snapchat: '',
  /* Email sender credentials (stored in file only, not DB) */
  email_user: '',
  email_pass: '',
}

async function readFromFile() {
  try { return JSON.parse(await readFile(SETTINGS_FILE, 'utf-8')) } catch { return null }
}

async function writeToFile(data: any) {
  try { await writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8') } catch {}
}

/* Ensure extended columns exist on salon_settings */
async function ensureExtendedColumns(pool: any) {
  await pool.query(`
    DO $$ BEGIN
      BEGIN ALTER TABLE salon_settings ADD COLUMN whatsapp_number  TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE salon_settings ADD COLUMN whatsapp_message TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE salon_settings ADD COLUMN seo_title        TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE salon_settings ADD COLUMN seo_description  TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE salon_settings ADD COLUMN seo_keywords     TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE salon_settings ADD COLUMN seo_image        TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE salon_settings ADD COLUMN instagram        TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE salon_settings ADD COLUMN twitter          TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE salon_settings ADD COLUMN snapchat         TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END;
      BEGIN ALTER TABLE salon_settings ADD COLUMN social_links     JSONB NOT NULL DEFAULT '[]'; EXCEPTION WHEN duplicate_column THEN NULL; END;
    END $$;
  `)
}

export async function GET() {
  // Always read file first to get email credentials (stored in file only)
  const fileData = await readFromFile()

  try {
    const { default: pool } = await import('@/lib/db')
    await ensureExtendedColumns(pool)
    const result = await pool.query('SELECT * FROM salon_settings WHERE id = 1')
    if (result.rows.length > 0) {
      const r = result.rows[0]
      const data = {
        name:            r.name            || defaults.name,
        name_en:         r.name_en         || defaults.name_en,
        logo_url:        r.logo_url        || defaults.logo_url,
        address:         r.address         || defaults.address,
        city:            r.city            || defaults.city,
        phone:           r.phone           || defaults.phone,
        email:           r.email           || defaults.email,
        opening_time:    typeof r.opening_time === 'string' ? r.opening_time.slice(0,5) : String(r.opening_time || defaults.opening_time).slice(0,5),
        closing_time:    typeof r.closing_time === 'string' ? r.closing_time.slice(0,5) : String(r.closing_time || defaults.closing_time).slice(0,5),
        theme:           r.theme           || defaults.theme,
        whatsapp_number:  r.whatsapp_number  || '',
        whatsapp_message: r.whatsapp_message || '',
        seo_title:        r.seo_title        || '',
        seo_description:  r.seo_description  || '',
        seo_keywords:     r.seo_keywords     || '',
        seo_image:        r.seo_image        || '',
        instagram:        r.instagram        || '',
        twitter:          r.twitter          || '',
        snapchat:         r.snapchat         || '',
        social_links:     Array.isArray(r.social_links) ? r.social_links : (typeof r.social_links === 'string' ? JSON.parse(r.social_links || '[]') : []),
        email_user:       fileData?.email_user || '',
        email_pass:       fileData?.email_pass || '',
      }
      await writeToFile(data).catch(() => {})
      return NextResponse.json(data)
    }
  } catch (e) { console.error('[settings GET]', e) }

  if (fileData) return NextResponse.json({ ...defaults, ...fileData })
  return NextResponse.json(defaults)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const {
    name, name_en, logo_url, address, city, phone, email,
    opening_time, closing_time, theme,
    whatsapp_number, whatsapp_message,
    seo_title, seo_description, seo_keywords, seo_image,
    instagram, twitter, snapchat, social_links,
    email_user, email_pass,
  } = body

  const existing = await readFromFile()
  const mergedTheme = theme || existing?.theme || defaults.theme

  const data = {
    name, name_en, logo_url, address, city, phone, email,
    opening_time, closing_time, theme: mergedTheme,
    whatsapp_number: whatsapp_number || '',
    whatsapp_message: whatsapp_message || '',
    seo_title: seo_title || '',
    seo_description: seo_description || '',
    seo_keywords: seo_keywords || '',
    seo_image: seo_image || '',
    instagram: instagram || '',
    twitter: twitter || '',
    snapchat: snapchat || '',
    social_links: Array.isArray(social_links) ? social_links : [],
    email_user: email_user || existing?.email_user || '',
    email_pass: email_pass || existing?.email_pass || '',
  }

  let dbOk = false
  try {
    const { default: pool } = await import('@/lib/db')
    await ensureExtendedColumns(pool)
    await pool.query(`
      INSERT INTO salon_settings (
        id, name, name_en, logo_url, address, city, phone, email,
        opening_time, closing_time, theme,
        whatsapp_number, whatsapp_message,
        seo_title, seo_description, seo_keywords, seo_image,
        instagram, twitter, snapchat, social_links, updated_at
      )
      VALUES (1,$1,$2,$3,$4,$5,$6,$7,NULLIF($8,'')::time,NULLIF($9,'')::time,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb,NOW())
      ON CONFLICT (id) DO UPDATE SET
        name=$1, name_en=$2, logo_url=$3, address=$4, city=$5, phone=$6, email=$7,
        opening_time=NULLIF($8,'')::time, closing_time=NULLIF($9,'')::time, theme=$10,
        whatsapp_number=$11, whatsapp_message=$12,
        seo_title=$13, seo_description=$14, seo_keywords=$15, seo_image=$16,
        instagram=$17, twitter=$18, snapchat=$19, social_links=$20::jsonb, updated_at=NOW()
    `, [
      name, name_en, logo_url, address, city, phone, email,
      opening_time, closing_time, mergedTheme,
      data.whatsapp_number, data.whatsapp_message,
      data.seo_title, data.seo_description, data.seo_keywords, data.seo_image,
      data.instagram, data.twitter, data.snapchat,
      JSON.stringify(data.social_links),
    ])
    dbOk = true
  } catch (e) { console.error('[settings PUT]', e) }

  await writeToFile(data)
  return NextResponse.json({ ok: true, db: dbOk })
}
