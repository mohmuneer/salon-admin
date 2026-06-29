import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Department info — safe query using only confirmed columns
  let department: any = null
  try {
    const r = await pool.query(`
      SELECT id, name_ar, name_en,
        COALESCE(description, '') AS description,
        COALESCE(slug, '') AS slug,
        image_url
      FROM departments
      WHERE slug = $1 AND is_active = true
      LIMIT 1
    `, [slug])
    if (r.rows.length > 0) {
      department = r.rows[0]
      // Try to enrich with migration-012 columns (optional)
      try {
        const r2 = await pool.query(
          `SELECT COALESCE(icon,'') AS icon, COALESCE(page_title_ar,'') AS page_title_ar,
                  COALESCE(meta_description_ar,'') AS meta_description_ar
           FROM departments WHERE id = $1`, [department.id]
        )
        if (r2.rows.length > 0) department = { ...department, ...r2.rows[0] }
      } catch { department = { ...department, icon: '', page_title_ar: '', meta_description_ar: '' } }
    }
  } catch (e) { console.error('Department fetch error:', e) }

  if (!department) {
    return NextResponse.json({ error: 'Department not found' }, { status: 404 })
  }

  // Services in this department
  let services: any[] = []
  try {
    // Try with image from service_images + category name
    const r = await pool.query(`
      SELECT
        s.id, s.name_ar, s.name_en,
        COALESCE(s.description, '') AS description,
        s.duration_min, s.price,
        s.image_url,
        c.name_ar AS category_name
      FROM services s
      LEFT JOIN categories c ON c.id = s.category_id
      WHERE s.department_id = $1 AND s.is_active = true
      ORDER BY s.name_ar
    `, [department.id])
    services = r.rows
    // Try to enrich with is_featured and cover image
    try {
      const r2 = await pool.query(`
        SELECT s.id,
          COALESCE(s.is_featured, false) AS is_featured,
          COALESCE(s.image_url,
            (SELECT si.url FROM service_images si
             WHERE si.service_id = s.id AND si.image_type = 'cover'
             ORDER BY si.sort_order LIMIT 1)) AS image_url
        FROM services s WHERE s.department_id = $1 AND s.is_active = true
      `, [department.id])
      const extra: {[k:string]: any} = {}
      r2.rows.forEach((row: any) => { extra[row.id] = row })
      services = services.map((s: any) => ({
        ...s,
        is_featured: extra[s.id]?.is_featured ?? false,
        image_url:   extra[s.id]?.image_url   ?? s.image_url,
      })).sort((a: any, b: any) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || a.name_ar.localeCompare(b.name_ar))
    } catch {}
  } catch (e) { console.error('Services fetch error:', e) }

  // Products in this department
  let products: any[] = []
  try {
    const r = await pool.query(`
      SELECT id, name_ar, brand, price, stock_qty, image_url
      FROM products
      WHERE department_id = $1 AND is_active = true AND sold_in_store = true
      ORDER BY name_ar
    `, [department.id])
    products = r.rows
    // Try to enrich with is_featured and primary image
    try {
      const r2 = await pool.query(`
        SELECT p.id,
          COALESCE(p.is_featured, false) AS is_featured,
          COALESCE(p.image_url,
            (SELECT pi.url FROM product_images pi
             WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1)) AS image_url
        FROM products p
        WHERE p.department_id = $1 AND p.is_active = true AND p.sold_in_store = true
      `, [department.id])
      const extra: {[k:string]: any} = {}
      r2.rows.forEach((row: any) => { extra[row.id] = row })
      products = products.map((p: any) => ({
        ...p,
        is_featured: extra[p.id]?.is_featured ?? false,
        image_url:   extra[p.id]?.image_url   ?? p.image_url,
      })).sort((a: any, b: any) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || a.name_ar.localeCompare(b.name_ar))
    } catch {}
  } catch (e) { console.error('Products fetch error:', e) }

  // Enrich services with ALL their images
  if (services.length > 0) {
    try {
      const ids = services.map((s: any) => s.id)
      const imgR = await pool.query(`
        SELECT service_id, url, image_type, COALESCE(sort_order,0) AS sort_order
        FROM service_images
        WHERE service_id = ANY($1)
        ORDER BY service_id,
          CASE image_type WHEN 'cover' THEN 0 WHEN 'gallery' THEN 1 WHEN 'before' THEN 2 WHEN 'after' THEN 3 ELSE 9 END,
          sort_order
      `, [ids])
      const byService: { [k: string]: any[] } = {}
      imgR.rows.forEach((row: any) => {
        if (!byService[row.service_id]) byService[row.service_id] = []
        byService[row.service_id].push({ url: row.url, type: row.image_type })
      })
      services = services.map((s: any) => ({
        ...s,
        images: byService[s.id] || (s.image_url ? [{ url: s.image_url, type: 'cover' }] : []),
      }))
    } catch {
      services = services.map((s: any) => ({
        ...s,
        images: s.image_url ? [{ url: s.image_url, type: 'cover' }] : [],
      }))
    }
  }

  // Enrich products with ALL their images
  if (products.length > 0) {
    try {
      const ids = products.map((p: any) => p.id)
      const imgR = await pool.query(`
        SELECT product_id, url, COALESCE(thumbnail_url, url) AS thumbnail_url,
               COALESCE(is_primary, false) AS is_primary, COALESCE(sort_order,0) AS sort_order
        FROM product_images
        WHERE product_id = ANY($1)
        ORDER BY product_id, is_primary DESC NULLS LAST, sort_order
      `, [ids])
      const byProduct: { [k: string]: any[] } = {}
      imgR.rows.forEach((row: any) => {
        if (!byProduct[row.product_id]) byProduct[row.product_id] = []
        byProduct[row.product_id].push({ url: row.url, thumbnail: row.thumbnail_url })
      })
      products = products.map((p: any) => ({
        ...p,
        images: byProduct[p.id] || (p.image_url ? [{ url: p.image_url, thumbnail: p.image_url }] : []),
      }))
    } catch {
      products = products.map((p: any) => ({
        ...p,
        images: p.image_url ? [{ url: p.image_url, thumbnail: p.image_url }] : [],
      }))
    }
  }

  // Salon branding
  let salon: any = { name: 'صالون جلامور', logo_url: '', whatsapp_number: '', whatsapp_message: '' }
  try {
    const r = await pool.query(
      'SELECT name, logo_url, phone, whatsapp_number, whatsapp_message FROM salon_settings WHERE id = 1'
    )
    if (r.rows.length > 0) salon = r.rows[0]
  } catch {}

  return NextResponse.json({ department, services, products, salon })
}
