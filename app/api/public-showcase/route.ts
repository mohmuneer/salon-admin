import { NextResponse } from 'next/server'
import pool from '@/lib/db'

const defaults = {
  name: 'صالون جلامور', name_en: 'Glamour Salon', logo_url: '/logo.png',
  description_ar: 'صالون تجميل راقي يقدم أحدث الخدمات وأفضل المنتجات في عالم العناية والجمال',
  description_en: 'A premium beauty salon offering the latest services and best products in care and beauty',
  phone: '+966 55 123 4567', email: 'info@glamour-salon.com',
  address: 'شارع التحلية، جدة، المملكة العربية السعودية',
  working_hours: '10:00 صباحاً - 10:00 مساءً',
  instagram: '', twitter: '', snapchat: '',
  whatsapp_number: '', whatsapp_message: '',
  seo_title: '', seo_description: '', seo_keywords: '', seo_image: '',
  theme: 'gold',
}

export async function GET() {
  let settings = defaults
  try {
    const r = await pool.query('SELECT * FROM salon_settings WHERE id = 1')
    if (r.rows.length > 0) {
      const s = r.rows[0]
      settings = {
        name: s.name || defaults.name,
        name_en: s.name_en || defaults.name_en,
        logo_url: s.logo_url || defaults.logo_url,
        description_ar: defaults.description_ar,
        description_en: defaults.description_en,
        phone: s.phone || defaults.phone,
        email: s.email || defaults.email,
        address: s.address || defaults.address,
        working_hours: s.opening_time && s.closing_time
          ? `${String(s.opening_time).slice(0,5)} صباحاً - ${String(s.closing_time).slice(0,5)} مساءً`
          : defaults.working_hours,
        instagram: s.instagram || defaults.instagram,
        twitter: s.twitter || defaults.twitter,
        snapchat: s.snapchat || defaults.snapchat,
        whatsapp_number: s.whatsapp_number || defaults.whatsapp_number,
        whatsapp_message: s.whatsapp_message || defaults.whatsapp_message,
        seo_title: s.seo_title || defaults.seo_title,
        seo_description: s.seo_description || defaults.seo_description,
        seo_keywords: s.seo_keywords || defaults.seo_keywords,
        seo_image: s.seo_image || defaults.seo_image,
        theme: s.theme || defaults.theme,
      }
    }
  } catch {}

  let categories: any[] = []
  try {
    const r = await pool.query(`
      SELECT c.id, c.name_ar, c.icon, c.sort_order,
        COUNT(s.id)::int AS service_count
      FROM categories c
      LEFT JOIN services s ON s.category_id = c.id AND s.is_active = true
      GROUP BY c.id, c.name_ar, c.icon, c.sort_order
      HAVING COUNT(s.id) > 0
      ORDER BY c.sort_order, c.name_ar
    `)
    if (r.rows.length > 0) categories = r.rows
  } catch {}

  let departments: any[] = []
  // Step 1 – safe base query using only columns confirmed to exist (from admin API)
  try {
    const r = await pool.query(`
      SELECT
        d.id, d.name_ar, d.name_en,
        COALESCE(d.description, '') AS description,
        COALESCE(d.slug, '') AS slug,
        d.image_url,
        (SELECT COUNT(*)::int FROM services s
          WHERE s.department_id = d.id AND s.is_active = true) AS service_count,
        (SELECT COUNT(*)::int FROM products p
          WHERE p.department_id = d.id AND p.is_active = true) AS product_count
      FROM departments d
      WHERE d.is_active = true
      ORDER BY d.name_ar
    `)
    departments = r.rows.filter((d: any) => d.service_count > 0 || d.product_count > 0)
  } catch {
    // Step 2 – products.department_id might not exist; try services only
    try {
      const r = await pool.query(`
        SELECT
          d.id, d.name_ar, d.name_en,
          COALESCE(d.description, '') AS description,
          COALESCE(d.slug, '') AS slug,
          d.image_url,
          (SELECT COUNT(*)::int FROM services s
            WHERE s.department_id = d.id AND s.is_active = true) AS service_count,
          0::int AS product_count
        FROM departments d
        WHERE d.is_active = true
        ORDER BY d.name_ar
      `)
      departments = r.rows.filter((d: any) => d.service_count > 0)
    } catch (e2) { console.error('Departments query failed:', e2) }
  }

  // Step 3 – try to enrich with icon/sort_order if migration 012 was applied
  if (departments.length > 0) {
    try {
      const ids = departments.map((d: any) => d.id)
      const r = await pool.query(
        `SELECT id, COALESCE(icon,'') AS icon, COALESCE(sort_order,0) AS sort_order
         FROM departments WHERE id = ANY($1)`, [ids]
      )
      const extra: {[k:string]: any} = {}
      r.rows.forEach((row: any) => { extra[row.id] = row })
      departments = departments.map((d: any) => ({
        ...d,
        icon:       extra[d.id]?.icon       ?? '',
        sort_order: extra[d.id]?.sort_order ?? 0,
      })).sort((a: any, b: any) => a.sort_order - b.sort_order || a.name_ar.localeCompare(b.name_ar))
    } catch {
      // icon/sort_order columns don't exist — add defaults
      departments = departments.map((d: any) => ({ ...d, icon: '', sort_order: 0 }))
    }
  }

  let featuredServices: any[] = []
  try {
    const r = await pool.query(`
      SELECT s.id, s.name_ar, s.duration_min, s.price,
        COALESCE(s.image_url,
          (SELECT si.url FROM service_images si
           WHERE si.service_id = s.id AND si.image_type = 'cover'
           ORDER BY si.sort_order LIMIT 1)
        ) AS image_url
      FROM services s
      WHERE s.is_active = true
        AND s.is_featured = true
        AND s.display_on_public = true
      ORDER BY s.sort_order, s.name_ar
      LIMIT 10
    `)
    if (r.rows.length > 0) featuredServices = r.rows
  } catch {}

  let featuredProducts: any[] = []
  try {
    const r = await pool.query(`
      SELECT p.id, p.name_ar, p.brand, p.price,
        COALESCE(p.image_url,
          (SELECT pi.url FROM product_images pi
           WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1)
        ) AS image_url
      FROM products p
      WHERE p.is_active = true
        AND p.is_featured = true
        AND p.display_on_public = true
        AND p.sold_in_store = true
      ORDER BY p.name_ar
      LIMIT 10
    `)
    if (r.rows.length > 0) featuredProducts = r.rows
  } catch {}

  let services: any[] = []
  try {
    const r = await pool.query(`
      SELECT s.id, s.name_ar, s.name_en, s.duration_min, s.price, s.category_id,
        COALESCE(s.image_url, si.url) AS image_url
      FROM services s
      LEFT JOIN (
        SELECT DISTINCT ON (service_id) service_id, url
        FROM service_images
        WHERE image_type = 'cover'
        ORDER BY service_id, sort_order
      ) si ON si.service_id = s.id
      WHERE s.is_active = true
      ORDER BY s.sort_order, s.name_ar
    `)
    if (r.rows.length > 0) services = r.rows
  } catch {
    try {
      const r = await pool.query('SELECT id, name_ar, name_en, duration_min, price, image_url FROM services WHERE is_active = true ORDER BY sort_order, name_ar')
      if (r.rows.length > 0) services = r.rows
    } catch {}
  }
  if (services.length === 0) {
    services = [
      { id: 'mock-1', name_ar: 'قص وتصفيف شعر', duration_min: 45, price: 120 },
      { id: 'mock-2', name_ar: 'صبغات وعلاجات', duration_min: 90, price: 350 },
      { id: 'mock-3', name_ar: 'مانيكير وباديكير', duration_min: 60, price: 180 },
    ]
  }

  let products: any[] = []
  try {
    const r = await pool.query(`
      SELECT p.id, p.name_ar, p.brand, p.price,
        COALESCE(p.image_url, pi.url) AS image_url
      FROM products p
      LEFT JOIN (
        SELECT DISTINCT ON (product_id) product_id, url
        FROM product_images
        WHERE is_primary = true
        ORDER BY product_id
      ) pi ON pi.product_id = p.id
      WHERE p.is_active = true
      ORDER BY p.name_ar
    `)
    if (r.rows.length > 0) products = r.rows
  } catch {
    try {
      const r = await pool.query('SELECT id, name_ar, brand, price, image_url FROM products WHERE is_active = true ORDER BY name_ar')
      if (r.rows.length > 0) products = r.rows
    } catch {}
  }
  if (products.length === 0) {
    products = [
      { id: 'mock-p1', name_ar: 'شامبو احترافي', brand: "L'Oreal", price: 85 },
      { id: 'mock-p2', name_ar: 'بلسم مغذي', brand: 'Kerastase', price: 120 },
    ]
  }

  let offers: any[] = []
  try {
    const r = await pool.query('SELECT * FROM public_offers WHERE is_active = true ORDER BY sort_order, id')
    if (r.rows.length > 0) offers = r.rows
  } catch {}
  if (offers.length === 0) {
    offers = [
      { id: 1, title_ar: 'عرض العروس', title_en: 'Bridal Package', description_ar: 'قص وتصفيف + مكياج + مانيكير', description_en: 'Hair styling + Makeup + Manicure', original_price: 650, offer_price: 499, valid_until: '2026-08-01', badge: 'الأكثر طلباً', image_url: '', gallery: [], before_after: [], cta_text: 'احجز الآن', cta_link: '', cta_action: 'book', linked_service_id: null, countdown_end: null, whatsapp_number: '', whatsapp_message: '', branch_id: null, seo_title: '', seo_description: '', views_count: 0, clicks_count: 0, bookings_count: 0 },
      { id: 2, title_ar: 'عناية كاملة', title_en: 'Full Care', description_ar: 'مساج + عناية بالبشرة + حمام زيت', description_en: 'Massage + Skincare + Oil bath', original_price: 520, offer_price: 399, valid_until: '2026-08-15', badge: 'وفر 23%', image_url: '', gallery: [], before_after: [], cta_text: 'تواصل عبر واتساب', cta_link: '', cta_action: 'whatsapp', linked_service_id: null, countdown_end: null, whatsapp_number: '', whatsapp_message: '', branch_id: null, seo_title: '', seo_description: '', views_count: 0, clicks_count: 0, bookings_count: 0 },
    ]
  }

  let ads: any[] = []
  try {
    const r = await pool.query('SELECT * FROM public_ads WHERE is_active = true ORDER BY sort_order, id')
    if (r.rows.length > 0) ads = r.rows
  } catch {}
  if (ads.length === 0) {
    ads = [
      { id: 1, title_ar: 'روتين العناية بالبشرة', youtube_id: 'nvfO7YFLDvY', description_ar: 'تعرفي على أفضل روتين يومي للعناية بالبشرة' },
      { id: 2, title_ar: 'هيدرا فيشل في المنزل', youtube_id: 'PilrJG3M50M', description_ar: 'نظفي بشرتك باستخدام هيدرا فيشل في المنزل' },
    ]
  }

  let reviews: any[] = []
  try {
    const r = await pool.query('SELECT * FROM public_reviews WHERE is_active = true ORDER BY sort_order, id')
    if (r.rows.length > 0) reviews = r.rows
  } catch {}
  if (reviews.length === 0) {
    reviews = [
      { id: 1, customer_name: 'سارة أحمد', rating: 5, comment_ar: 'صالون رائع وتعامل راقي، أنصح الجميع بتجربته', customer_avatar: '' },
      { id: 2, customer_name: 'نورة علي', rating: 4, comment_ar: 'خدمة ممتازة وأسعار مناسبة، سعيدة جداً بالتجربة', customer_avatar: '' },
    ]
  }

  let banners: any[] = []
  try {
    const r = await pool.query('SELECT * FROM public_banner WHERE is_active = true ORDER BY id')
    if (r.rows.length > 0) banners = r.rows
  } catch {}
  if (banners.length === 0) {
    banners = [
      { id: 1, title_ar: 'تألقي في كل مناسبة', subtitle_ar: 'اكتشفي أحدث صيحات التجميل مع خبرائنا المحترفين', image_url: '', video_url: '', cta_text_ar: 'احجزي موعدك الآن', cta_link: '', cta_action: 'book' },
    ]
  }

  let coupons: any[] = []
  try {
    const r = await pool.query('SELECT * FROM public_coupons WHERE is_active = true ORDER BY id')
    if (r.rows.length > 0) coupons = r.rows
  } catch {}

  let whatsappConfig = { number: '', message: '' }
  try {
    const r = await pool.query('SELECT * FROM public_whatsapp_config WHERE id = 1')
    if (r.rows.length > 0) whatsappConfig = r.rows[0]
  } catch {}

  let pageMeta = { title_ar: '', title_en: '', description_ar: '', description_en: '', keywords_ar: '', keywords_en: '', og_image: '' }
  try {
    const r = await pool.query('SELECT * FROM public_page_meta WHERE id = 1')
    if (r.rows.length > 0) pageMeta = r.rows[0]
  } catch {}

  // Public features
  let features: any[] = []
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public_features (
        id SERIAL PRIMARY KEY, icon VARCHAR(20) NOT NULL DEFAULT '✨',
        title_ar TEXT NOT NULL DEFAULT '', title_en TEXT NOT NULL DEFAULT '',
        description_ar TEXT NOT NULL DEFAULT '', description_en TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    const r = await pool.query(
      'SELECT * FROM public_features WHERE is_active = true ORDER BY sort_order, id'
    )
    features = r.rows
  } catch {}

  // Social links — read from file first (most reliable), then DB
  let socialLinks: any[] = []
  try {
    const { readFile } = await import('fs/promises')
    const { join } = await import('path')
    const raw = await readFile(join(process.cwd(), '..', 'social-links.json'), 'utf-8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) socialLinks = parsed
  } catch {}
  if (socialLinks.length === 0) {
    try {
      const r = await pool.query('SELECT social_links FROM salon_settings WHERE id = 1')
      if (r.rows.length > 0) {
        const val = r.rows[0].social_links
        socialLinks = Array.isArray(val) ? val : []
      }
    } catch {}
  }

  // Default bank account for payments
  let defaultBank = { bank_name: '', account_holder: '', iban: '', account_number: '' }
  try {
    const r = await pool.query(`
      SELECT bank_name, account_holder, iban, COALESCE(account_number,'') AS account_number
      FROM branch_bank_accounts
      WHERE is_active = true
      ORDER BY is_default DESC, created_at
      LIMIT 1
    `)
    if (r.rows.length > 0) defaultBank = r.rows[0]
  } catch {}

  // Public website theme — read from dedicated table (independent of admin theme)
  let publicTheme = { theme_key: settings.theme || 'gold', primary_color: '#C9A55F' }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public_website_theme (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        theme_key VARCHAR(50) NOT NULL DEFAULT 'gold',
        primary_color VARCHAR(20) NOT NULL DEFAULT '#C9A55F',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      INSERT INTO public_website_theme (id, theme_key, primary_color)
      VALUES (1, 'gold', '#C9A55F') ON CONFLICT (id) DO NOTHING;
    `)
    const r = await pool.query(
      'SELECT theme_key, primary_color FROM public_website_theme WHERE id = 1'
    )
    if (r.rows.length > 0) publicTheme = r.rows[0]
  } catch {}

  return NextResponse.json({
    salon: {
      name: settings.name, name_en: settings.name_en, logo_url: settings.logo_url,
      description_ar: settings.description_ar, description_en: settings.description_en,
      phone: settings.phone, email: settings.email, address: settings.address,
      working_hours: settings.working_hours,
      instagram: settings.instagram, twitter: settings.twitter, snapchat: settings.snapchat,
      whatsapp_number: settings.whatsapp_number, whatsapp_message: settings.whatsapp_message,
      seo_title: settings.seo_title, seo_description: settings.seo_description,
      seo_keywords: settings.seo_keywords, seo_image: settings.seo_image,
    },
    bank: defaultBank,
    theme: publicTheme.theme_key,
    primary_color: publicTheme.primary_color,
    social_links: socialLinks,
    features,
    categories, departments, featuredServices, featuredProducts,
    services, products, offers, ads, reviews, banners, coupons,
    whatsapp: whatsappConfig,
    pageMeta,
  })
}
