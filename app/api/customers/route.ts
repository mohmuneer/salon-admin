import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.phone, u.email, u.gender, u.is_active, u.created_at,
             COUNT(DISTINCT a.id) AS total_appointments,
             COALESCE(SUM(a.total) FILTER (WHERE a.status='completed'), 0) AS total_spent,
             MAX(a.date) AS last_visit
      FROM users u
      LEFT JOIN appointments a ON a.customer_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY total_spent DESC LIMIT 100
    `)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
