import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'
import { unlink } from 'fs/promises'
import path from 'path'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const serviceId = searchParams.get('service_id')
  try {
    let query = 'SELECT * FROM service_images'
    const params: any[] = []
    if (serviceId) {
      query += ' WHERE service_id = $1'
      params.push(serviceId)
    }
    query += ' ORDER BY sort_order, id'
    const result = await pool.query(query, params)
    return NextResponse.json(result.rows)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  const { service_id, images } = await req.json()
  try {
    await pool.query('DELETE FROM service_images WHERE service_id = $1', [service_id])
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      await pool.query(
        `INSERT INTO service_images (service_id, url, thumbnail_url, image_type, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [service_id, img.url, img.thumbnail_url || null, img.image_type || 'gallery', i]
      )
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id, url } = await req.json()
  try {
    if (id) {
      await pool.query('DELETE FROM service_images WHERE id = $1', [id])
    }
    if (url) {
      const filename = url.split('/').pop()
      const filepath = path.join(process.cwd(), 'public', 'uploads', filename)
      try { await unlink(filepath) } catch {}
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
