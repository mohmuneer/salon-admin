import { NextResponse, NextRequest } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), '..', 'settings-data.json')

export async function PUT(req: NextRequest) {
  const { theme } = await req.json()
  if (!theme) return NextResponse.json({ error: 'Theme required' }, { status: 400 })

  // 1. Write to DB
  try {
    const { default: pool } = await import('@/lib/db')
    await pool.query(`
      INSERT INTO salon_settings (id, theme, updated_at)
      VALUES (1, $1, NOW())
      ON CONFLICT (id) DO UPDATE SET theme = EXCLUDED.theme, updated_at = NOW()
    `, [theme])
  } catch { /* DB unavailable */ }

  // 2. Update shared file
  try {
    const existing = await readFile(SETTINGS_FILE, 'utf-8').then(JSON.parse).catch(() => ({}))
    await writeFile(SETTINGS_FILE, JSON.stringify({ ...existing, theme }, null, 2), 'utf-8')
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true })
}
