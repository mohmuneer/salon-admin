import { unstable_noStore as noStore } from 'next/cache'
import pool from '@/lib/db'
import LoginForm from './login-form'

const defaults = {
  name: 'صالون جلامور',
  name_en: 'Glamour Salon',
  logo_url: '/logo.png',
  theme: 'gold',
}

async function getSettings() {
  noStore()

  try {
    const result = await pool.query('SELECT name, name_en, logo_url, theme FROM salon_settings WHERE id = 1')
    if (result.rows.length > 0) {
      const r = result.rows[0]
      return { name: r.name || defaults.name, name_en: r.name_en || defaults.name_en, logo_url: r.logo_url || defaults.logo_url, theme: r.theme || defaults.theme }
    }
  } catch { /* DB unavailable */ }

  return defaults
}

export default async function LoginPage() {
  const settings = await getSettings()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
      padding: 20
    }}>
      <div className="login-container" style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        <LoginForm
          name={settings.name}
          name_en={settings.name_en}
          logo_url={settings.logo_url}
        />

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 24 }}>
          © 2025 Glamour Salon Management
        </p>
      </div>
    </div>
  )
}
