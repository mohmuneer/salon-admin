import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const FILE = path.join(process.cwd(), '..', 'social-links.json')

async function readFromFile(): Promise<any[]> {
  try {
    const raw = await readFile(FILE, 'utf-8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch { return [] }
}

async function writeToFile(data: any[]) {
  try { await writeFile(FILE, JSON.stringify(data, null, 2), 'utf-8') } catch {}
}

async function ensureColumn() {
  try {
    await pool.query(`
      DO $$ BEGIN
        BEGIN
          ALTER TABLE salon_settings ADD COLUMN social_links JSONB NOT NULL DEFAULT '[]';
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `)
  } catch {}
}

async function syncToDb(links: any[]) {
  try {
    await ensureColumn()
    await pool.query(
      'UPDATE salon_settings SET social_links = $1::jsonb WHERE id = 1',
      [JSON.stringify(links)]
    )
  } catch {}
}

export const dynamic = 'force-dynamic'

/**
 * GET — File is the primary source (always up-to-date).
 * DB is used only when file is empty/missing.
 */
export async function GET() {
  // 1. Read from file (always latest)
  const fileLinks = await readFromFile()

  if (fileLinks.length > 0) {
    // Async sync to DB (don't await — don't block the response)
    syncToDb(fileLinks)
    return NextResponse.json(fileLinks)
  }

  // 2. File is empty → try DB
  try {
    await ensureColumn()
    const r = await pool.query('SELECT social_links FROM salon_settings WHERE id = 1')
    if (r.rows.length > 0) {
      const val = r.rows[0].social_links
      const dbLinks = Array.isArray(val) ? val : []
      if (dbLinks.length > 0) {
        // Sync back to file for future reads
        await writeToFile(dbLinks)
        return NextResponse.json(dbLinks)
      }
    }
  } catch (e) { console.error('[public-social-links GET] DB error:', e) }

  return NextResponse.json([])
}

/**
 * PUT — Save to file FIRST (guaranteed), then try DB.
 */
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const links = Array.isArray(body.social_links) ? body.social_links : []

  // 1. Write to file immediately — this is what GET reads
  await writeToFile(links)

  // 2. Try DB update in background
  let dbOk = false
  try {
    await ensureColumn()
    const r = await pool.query(
      'UPDATE salon_settings SET social_links = $1::jsonb WHERE id = 1',
      [JSON.stringify(links)]
    )
    dbOk = (r.rowCount ?? 0) > 0
  } catch (e: any) {
    console.error('[public-social-links PUT] DB error:', e.message)
  }

  return NextResponse.json({ ok: true, db: dbOk, count: links.length })
}
