import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const branchId     = searchParams.get('branch_id') || ''
  const departmentId = searchParams.get('department_id') || ''

  try {
    // staff.name comes from users table via user_id
    // staff.specialty is the role, staff.bio exists, staff.is_active exists
    // users.avatar_url as image
    const params: string[] = []
    let where = 'WHERE s.is_active = true'

    if (branchId) {
      params.push(branchId)
      where += ` AND s.salon_id = $${params.length}`
    }
    if (departmentId) {
      params.push(departmentId)
      where += ` AND s.department_id = $${params.length}`
    }

    const r = await pool.query(`
      SELECT s.id::text,
        COALESCE(u.name, u.email, 'موظف') AS name,
        COALESCE(s.specialty, '') AS role,
        COALESCE(u.avatar_url, '') AS image_url,
        COALESCE(s.bio, '') AS bio
      FROM staff s
      LEFT JOIN users u ON u.id = s.user_id
      ${where}
      ORDER BY u.name
    `, params)

    return NextResponse.json(r.rows)
  } catch (e: any) {
    console.error('[public-staff]', e.message)
    return NextResponse.json([], { status: 200 }) // empty = show "any staff" only
  }
}
