import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT id,
        COALESCE(name, '') AS name,
        COALESCE(name_en, name, '') AS name_en,
        COALESCE(address, '') AS address,
        COALESCE(city, '') AS city
      FROM salons
      WHERE is_active = true
      ORDER BY name
    `)
    return NextResponse.json(r.rows)
  } catch (e: any) {
    console.error('[public-branches]', e.message)
    return NextResponse.json([], { status: 200 })
  }
}
