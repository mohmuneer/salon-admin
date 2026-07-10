import type { MetadataRoute } from 'next'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  try {
    const { default: pool } = await import('@/lib/db')
    const result = await pool.query(`SELECT name, name_en, logo_url FROM salon_settings WHERE id = 1`)
    if (result.rows.length > 0) {
      const r = result.rows[0]
      return buildManifest({
        name: r.name ? `Glamour Admin — ${r.name}` : defaults.name,
        short_name: defaults.short_name,
        description: r.name_en ? `${r.name} — Admin Dashboard` : `${r.name} — لوحة التحكم`,
        logo_url: r.logo_url || defaults.logo_url,
      })
    }
  } catch { /* DB unavailable */ }

  return buildManifest(defaults)
}

const defaults = {
  name: 'Glamour Admin — لوحة التحكم',
  short_name: 'Glamour Admin',
  description: 'Glamour Admin — لوحة تحكم الصالون لإدارة الحجوزات والخدمات والعملاء',
  logo_url: '/logo.png',
}

function buildManifest(s: typeof defaults): MetadataRoute.Manifest {
  const icons: MetadataRoute.Manifest['icons'] = [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ]
  if (s.logo_url) {
    icons.unshift({ src: s.logo_url, sizes: '512x512', type: 'image/png', purpose: 'any' })
  }
  return {
    name: s.name,
    short_name: s.short_name,
    description: s.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#1A1A2E',
    theme_color: '#1A1A2E',
    orientation: 'portrait',
    scope: '/',
    categories: ['lifestyle', 'beauty', 'business'],
    lang: 'ar',
    dir: 'rtl',
    icons,
    screenshots: [],
    prefer_related_applications: false,
  }
}
