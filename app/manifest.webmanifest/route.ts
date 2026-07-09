import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), '..', 'settings-data.json')

const defaults = {
  name: 'Glamour Admin — لوحة التحكم',
  short_name: 'Glamour Admin',
  description: 'Glamour Admin — لوحة تحكم الصالون لإدارة الحجوزات والخدمات والعملاء',
  logo_url: '/logo.png',
}

async function readFromFile() {
  try {
    const raw = await readFile(SETTINGS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch { return null }
}

export async function GET() {
  const fileData = await readFromFile()
  if (fileData) {
    const s = {
      name: fileData.name ? `Glamour Admin — ${fileData.name}` : defaults.name,
      short_name: 'Glamour Admin',
      description: fileData.name_en
        ? `${fileData.name} — Admin Dashboard`
        : `${fileData.name || 'Glamour'} — لوحة التحكم`,
      logo_url: fileData.logo_url || '/logo.png',
    }
    return NextResponse.json(buildManifest(s), {
      headers: { 'Content-Type': 'application/manifest+json' },
    })
  }

  try {
    const { default: pool } = await import('@/lib/db')
    const result = await pool.query(
      `SELECT name, name_en, logo_url FROM salon_settings WHERE id = 1`
    )
    if (result.rows.length > 0) {
      const r = result.rows[0]
      const s = {
        name: r.name ? `Glamour Admin — ${r.name}` : defaults.name,
        short_name: 'Glamour Admin',
        description: r.name_en
          ? `${r.name} — Admin Dashboard`
          : `${r.name} — لوحة التحكم`,
        logo_url: r.logo_url || '/logo.png',
      }
      return NextResponse.json(buildManifest(s), {
        headers: { 'Content-Type': 'application/manifest+json' },
      })
    }
  } catch { /* DB unavailable */ }

  return NextResponse.json(buildManifest(defaults), {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}

function buildManifest(s: typeof defaults) {
  return {
    name: s.name,
    short_name: s.short_name,
    description: s.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#1A1A2E',
    theme_color: '#1A1A2E',
    orientation: 'portrait',
    scope: '/',
    categories: ['lifestyle', 'beauty', 'business'],
    lang: 'ar',
    dir: 'rtl',
    icons: [
      ...(s.logo_url ? [
        { src: s.logo_url, sizes: '512x512', type: 'image/png', purpose: 'any' },
      ] : []),
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    screenshots: [],
    prefer_related_applications: false,
  }
}
