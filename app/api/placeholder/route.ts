import { NextResponse } from 'next/server'

/* ── Colour palettes per content type ── */
const PALETTES = {
  dept: {
    bg1: '#071020', bg2: '#0e1f38',
    accent: '#d4a437', accent2: '#e8c25e',
    label: 'قسم',
  },
  service: {
    bg1: '#07101e', bg2: '#0c1a32',
    accent: '#7c3aed', accent2: '#a78bfa',
    label: 'خدمة',
  },
  product: {
    bg1: '#071510', bg2: '#0b1f18',
    accent: '#059669', accent2: '#34d399',
    label: 'منتج',
  },
}

/* ── Named overrides for known salon departments ── */
const DEPT_THEMES: { [key: string]: { accent: string; accent2: string } } = {
  'شعر':        { accent: '#d4a437', accent2: '#e8c25e' },
  'hair':       { accent: '#d4a437', accent2: '#e8c25e' },
  'أظافر':      { accent: '#a855f7', accent2: '#c084fc' },
  'nails':      { accent: '#a855f7', accent2: '#c084fc' },
  'مكياج':      { accent: '#ec4899', accent2: '#f9a8d4' },
  'makeup':     { accent: '#ec4899', accent2: '#f9a8d4' },
  'بشرة':       { accent: '#06b6d4', accent2: '#67e8f9' },
  'skincare':   { accent: '#06b6d4', accent2: '#67e8f9' },
  'حلاقة':      { accent: '#3b82f6', accent2: '#93c5fd' },
  'barber':     { accent: '#3b82f6', accent2: '#93c5fd' },
  'عناية':      { accent: '#22c55e', accent2: '#86efac' },
  'body':       { accent: '#22c55e', accent2: '#86efac' },
  'تصوير':      { accent: '#f97316', accent2: '#fdba74' },
  'photography':{ accent: '#f97316', accent2: '#fdba74' },
}

function x(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function resolveTheme(type: string, name: string, slug: string, customAccent?: string) {
  const palette = PALETTES[type as keyof typeof PALETTES] || PALETTES.dept
  let accent = palette.accent
  let accent2 = palette.accent2

  if (type === 'dept') {
    const key = Object.keys(DEPT_THEMES).find(k =>
      name.toLowerCase().includes(k) || (slug||'').toLowerCase().includes(k)
    )
    if (key) { accent = DEPT_THEMES[key].accent; accent2 = DEPT_THEMES[key].accent2 }
  }
  if (customAccent) { accent = `#${customAccent}`; accent2 = `#${customAccent}` }
  return { ...palette, accent, accent2 }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name  = searchParams.get('name')  || 'عنوان'
  const icon  = searchParams.get('icon')  || '✨'
  const type  = searchParams.get('type')  || 'dept'
  const slug  = searchParams.get('slug')  || ''
  const sub   = searchParams.get('sub')   || ''
  const customAccent = searchParams.get('color') || ''

  const T = resolveTheme(type, name, slug, customAccent)

  const svg = `<svg width="800" height="500" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="800" y2="500" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="${T.bg1}"/>
    <stop offset="55%" stop-color="${T.bg2}"/>
    <stop offset="100%" stop-color="${T.bg1}"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="42%" r="55%">
    <stop offset="0%" stop-color="${T.accent}" stop-opacity="0.22"/>
    <stop offset="70%" stop-color="${T.accent}" stop-opacity="0.05"/>
    <stop offset="100%" stop-color="${T.accent}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="corner" cx="0%" cy="0%" r="60%">
    <stop offset="0%" stop-color="${T.accent}" stop-opacity="0.1"/>
    <stop offset="100%" stop-color="${T.accent}" stop-opacity="0"/>
  </radialGradient>
  <filter id="blur">
    <feGaussianBlur stdDeviation="22"/>
  </filter>
</defs>

<!-- Base -->
<rect width="800" height="500" fill="url(#bg)"/>
<rect width="800" height="500" fill="url(#glow)"/>
<rect x="0" y="0" width="500" height="400" fill="url(#corner)"/>

<!-- Soft ambient glow blobs -->
<circle cx="200" cy="100" r="180" fill="${T.accent}" fill-opacity="0.05" filter="url(#blur)"/>
<circle cx="600" cy="400" r="200" fill="${T.accent2}" fill-opacity="0.06" filter="url(#blur)"/>

<!-- Decorative rings around icon -->
<circle cx="400" cy="190" r="125" fill="none" stroke="${T.accent}" stroke-opacity="0.1" stroke-width="1"/>
<circle cx="400" cy="190" r="100" fill="none" stroke="${T.accent}" stroke-opacity="0.07" stroke-width="1"/>
<circle cx="400" cy="190" r="78"  fill="${T.accent}" fill-opacity="0.07"/>
<circle cx="400" cy="190" r="78"  fill="none" stroke="${T.accent}" stroke-opacity="0.18" stroke-width="1.5"/>

<!-- Bottom accent bar -->
<rect x="250" y="497" width="300" height="3" fill="${T.accent}" fill-opacity="0.5" rx="1.5"/>

<!-- Icon -->
<text x="400" y="208" text-anchor="middle" dominant-baseline="middle"
  font-size="64" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Android Emoji, sans-serif">${x(icon)}</text>

<!-- Gold separator -->
<rect x="345" y="308" width="110" height="1.5" rx="1" fill="${T.accent}" fill-opacity="0.8"/>

<!-- Main name -->
<text x="400" y="344" text-anchor="middle" dominant-baseline="middle"
  fill="white" fill-opacity="0.96" font-size="26" font-weight="bold"
  font-family="Tajawal, Arial Unicode MS, Arial, sans-serif">${x(name)}</text>

<!-- Sub label -->
${sub
  ? `<text x="400" y="378" text-anchor="middle" dominant-baseline="middle"
      fill="${T.accent}" fill-opacity="0.75" font-size="14"
      font-family="Tajawal, Arial Unicode MS, Arial, sans-serif">${x(sub)}</text>`
  : `<text x="400" y="378" text-anchor="middle" dominant-baseline="middle"
      fill="${T.accent}" fill-opacity="0.6" font-size="13"
      font-family="Tajawal, Arial Unicode MS, Arial, sans-serif">${x(T.label)}</text>`}

<!-- Dot row -->
<circle cx="372" cy="420" r="2.5" fill="${T.accent}" fill-opacity="0.3"/>
<circle cx="388" cy="420" r="2.5" fill="${T.accent}" fill-opacity="0.3"/>
<circle cx="400" cy="420" r="3.5" fill="${T.accent2}" fill-opacity="0.6"/>
<circle cx="412" cy="420" r="2.5" fill="${T.accent}" fill-opacity="0.3"/>
<circle cx="428" cy="420" r="2.5" fill="${T.accent}" fill-opacity="0.3"/>

<!-- Shimmer diagonal -->
<line x1="0" y1="500" x2="500" y2="0" stroke="${T.accent}" stroke-opacity="0.03" stroke-width="1"/>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  })
}
