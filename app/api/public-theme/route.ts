import { NextResponse, NextRequest } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import pool from '@/lib/db'

const FALLBACK_FILE = path.join(process.cwd(), '..', 'settings-data.json')

/* ── Auto-create table on first use ── */
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public_website_theme (
      id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      theme_key   VARCHAR(50)  NOT NULL DEFAULT 'gold',
      primary_color VARCHAR(20) NOT NULL DEFAULT '#C9A55F',
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
    INSERT INTO public_website_theme (id, theme_key, primary_color)
    VALUES (1, 'gold', '#C9A55F')
    ON CONFLICT (id) DO NOTHING;
  `)
}

/* ── File fallback helpers ── */
async function readFile_() {
  try { return JSON.parse(await readFile(FALLBACK_FILE, 'utf-8')) } catch { return {} }
}
async function writeFile_(extra: any) {
  try {
    const existing = await readFile_()
    await writeFile(FALLBACK_FILE, JSON.stringify({ ...existing, ...extra }, null, 2), 'utf-8')
  } catch {}
}

export const dynamic = 'force-dynamic'

/* ── GET: active public theme ── */
export async function GET() {
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }

  try {
    await ensureTable()
    const r = await pool.query(
      'SELECT theme_key, primary_color FROM public_website_theme WHERE id = 1'
    )
    if (r.rows.length > 0) {
      const { theme_key, primary_color } = r.rows[0]
      return NextResponse.json({ theme: theme_key, primary_color }, { headers })
    }
  } catch (e) {
    console.error('[public-theme GET] DB error:', e)
  }

  // File fallback
  const data = await readFile_()
  return NextResponse.json(
    { theme: data.public_theme || 'gold', primary_color: data.public_primary_color || '#C9A55F' },
    { headers }
  )
}

/* ── PUT: save active public theme ── */
export async function PUT(req: NextRequest) {
  const { theme, primary_color } = await req.json()
  const themeKey = theme || 'gold'
  const color    = primary_color || '#C9A55F'

  let dbOk = false

  // 1 — Database (primary)
  try {
    await ensureTable()
    await pool.query(`
      INSERT INTO public_website_theme (id, theme_key, primary_color, updated_at)
      VALUES (1, $1, $2, NOW())
      ON CONFLICT (id) DO UPDATE SET
        theme_key     = EXCLUDED.theme_key,
        primary_color = EXCLUDED.primary_color,
        updated_at    = NOW()
    `, [themeKey, color])
    dbOk = true
  } catch (e) {
    console.error('[public-theme PUT] DB error:', e)
  }

  // 2 — Sync to salon_settings so customer app (/api/settings) picks up the change
  try {
    await pool.query(`
      INSERT INTO salon_settings (id, theme, updated_at)
      VALUES (1, $1, NOW())
      ON CONFLICT (id) DO UPDATE SET theme = EXCLUDED.theme, updated_at = NOW()
    `, [themeKey])
  } catch (e2) {
    console.error('[public-theme PUT] salon_settings error:', e2)
  }

  // 3 — File fallback (always sync so server-side reads stay current)
  await writeFile_({
    public_theme: themeKey,
    public_primary_color: color,
    theme: themeKey,
    primary_color: color,
  })

  return NextResponse.json({ ok: true, db: dbOk })
}
