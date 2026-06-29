import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'all'

    let dateFilter = ''
    if (period === 'today') {
      dateFilter = "WHERE created_at >= CURRENT_DATE"
    } else if (period === 'week') {
      dateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'"
    } else if (period === 'month') {
      dateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'"
    }

    const [viewsRes, clicksRes, bookingsRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM public_analytics WHERE action='view' ${dateFilter ? dateFilter.replace('WHERE', 'AND') : ''}`),
      pool.query(`SELECT COUNT(*) as count FROM public_analytics WHERE action='click' ${dateFilter ? dateFilter.replace('WHERE', 'AND') : ''}`),
      pool.query(`SELECT COUNT(*) as count FROM public_analytics WHERE action='book' ${dateFilter ? dateFilter.replace('WHERE', 'AND') : ''}`),
    ])

    const totalViews = parseInt(viewsRes.rows[0]?.count || '0')
    const totalClicks = parseInt(clicksRes.rows[0]?.count || '0')
    const totalBookings = parseInt(bookingsRes.rows[0]?.count || '0')

    return NextResponse.json({
      totalViews,
      totalClicks,
      totalBookings,
      conversionRate: totalViews > 0 ? Number(((totalBookings / totalViews) * 100).toFixed(1)) : 0,
    })
  } catch {
    return NextResponse.json({ totalViews: 0, totalClicks: 0, totalBookings: 0, conversionRate: 0 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { source_type, source_id, action, ip_address, user_agent } = await req.json()
    await pool.query(
      `INSERT INTO public_analytics (source_type, source_id, action, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5)`,
      [source_type, source_id, action, ip_address || '', user_agent || '']
    )

    // Update counter on the source
    if (action === 'view') {
      await pool.query(`UPDATE public_offers SET views_count = views_count + 1 WHERE id = $1`, [source_id]).catch(() => {})
    } else if (action === 'click') {
      await pool.query(`UPDATE public_offers SET clicks_count = clicks_count + 1 WHERE id = $1`, [source_id]).catch(() => {})
    } else if (action === 'book') {
      await pool.query(`UPDATE public_offers SET bookings_count = bookings_count + 1 WHERE id = $1`, [source_id]).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
