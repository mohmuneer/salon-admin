import { NextResponse, NextRequest } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import pool from '@/lib/db'

const FALLBACK_FILE = path.join(process.cwd(), '..', 'custom-themes.json')

/* ── Auto-create table on first use ── */
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public_custom_themes (
      id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
      name          VARCHAR(100) NOT NULL,
      primary_color VARCHAR(20)  NOT NULL DEFAULT '#C9A55F',
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `)
}

/* ── File fallback helpers ── */
async function readThemesFile(): Promise<any[]> {
  try { return JSON.parse(await readFile(FALLBACK_FILE, 'utf-8')) } catch { return [] }
}
async function writeThemesFile(data: any[]) {
  try { await writeFile(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf-8') } catch {}
}

/* ── GET: list all custom themes ── */
export async function GET() {
  try {
    await ensureTable()
    const r = await pool.query(
      'SELECT id::text, name, primary_color, created_at FROM public_custom_themes ORDER BY created_at'
    )
    return NextResponse.json(r.rows)
  } catch (e) {
    console.error('[custom-themes GET] DB error:', e)
    return NextResponse.json(await readThemesFile())
  }
}

/* ── POST: add a new custom theme ── */
export async function POST(req: NextRequest) {
  const { name, primary_color } = await req.json()
  if (!name || !primary_color) {
    return NextResponse.json({ error: 'name and primary_color are required' }, { status: 400 })
  }

  try {
    await ensureTable()
    await pool.query(
      'INSERT INTO public_custom_themes (name, primary_color) VALUES ($1, $2)',
      [name, primary_color]
    )
    const r = await pool.query(
      'SELECT id::text, name, primary_color, created_at FROM public_custom_themes ORDER BY created_at'
    )
    return NextResponse.json(r.rows)
  } catch (e) {
    console.error('[custom-themes POST] DB error:', e)
    // File fallback
    const themes = await readThemesFile()
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    themes.push({ id, name, primary_color, created_at: new Date().toISOString() })
    await writeThemesFile(themes)
    return NextResponse.json(themes)
  }
}

/* ── DELETE: remove a custom theme ── */
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    await ensureTable()
    await pool.query('DELETE FROM public_custom_themes WHERE id = $1', [id])
    const r = await pool.query(
      'SELECT id::text, name, primary_color, created_at FROM public_custom_themes ORDER BY created_at'
    )
    return NextResponse.json(r.rows)
  } catch (e) {
    console.error('[custom-themes DELETE] DB error:', e)
    // File fallback
    const themes = await readThemesFile()
    await writeThemesFile(themes.filter(t => t.id !== id))
    return NextResponse.json(themes.filter(t => t.id !== id))
  }
}
