'use client'
import { useState, useRef, useEffect } from 'react'
import { useLang, useSidebar, useTheme, Theme } from '@/app/layout'
import { t } from '@/lib/translations'
import { useSalonSettings } from '@/lib/useSalonSettings'
import { Bell, Globe, LogOut, Menu, Search, Check, Palette, ChevronDown, Settings } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import SalonLogo from '@/components/SalonLogo'
import NextLink from 'next/link'

const THEMES: { key: Theme; labelAr: string; labelEn: string }[] = [
  { key: 'light', labelAr: 'فاتح', labelEn: 'Light' },
  { key: 'dark', labelAr: 'داكن', labelEn: 'Dark' },
  { key: 'gold', labelAr: 'ذهبي', labelEn: 'Gold' },
  { key: 'blue', labelAr: 'أزرق', labelEn: 'Blue' },
  { key: 'emerald', labelAr: 'زمردي', labelEn: 'Emerald' },
  { key: 'rose', labelAr: 'وردي', labelEn: 'Rose' },
]

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { lang, setLang } = useLang()
  const { toggle } = useSidebar()
  const { theme, setTheme } = useTheme()
  const tr = t[lang]
  const { settings } = useSalonSettings()
  const { data: session } = useSession()
  const userName = session?.user?.name || 'Admin'
  const initial = userName.charAt(0).toUpperCase()

  const themeRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemeMenu(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    window.location.href = '/login'
  }

  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={toggle}
          className="mobile-menu-btn"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>
        <SalonLogo src={settings.logo_url} size={32} borderRadius={8} />
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
        <span className="show-desktop" style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
          {settings.name}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="search-bar">
          <Search size={15} color="var(--text-muted)" />
          <input type="text" placeholder={tr.search} />
        </div>

        <div ref={themeRef} style={{ position: 'relative' }}>
          <button
            className="header-icon-btn"
            onClick={() => setShowThemeMenu(o => !o)}
            title={lang === 'ar' ? 'الثيم' : 'Theme'}
          >
            <Palette size={18} />
          </button>
          {showThemeMenu && (
            <div className="dropdown-menu" style={{ minWidth: 180 }}>
              <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {lang === 'ar' ? 'الثيم' : 'Theme'}
              </div>
              {THEMES.map(({ key, labelAr, labelEn }) => (
                <button
                  key={key}
                  className="dropdown-item"
                  onClick={() => { setTheme(key); setShowThemeMenu(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}
                >
                  <span>{lang === 'ar' ? labelAr : labelEn}</span>
                  {theme === key && <Check size={14} color="var(--primary)" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="header-icon-btn"
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          title={lang === 'ar' ? 'English' : 'عربي'}
        >
          <Globe size={18} />
        </button>

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="header-icon-btn"
            onClick={() => setShowNotifications(o => !o)}
            title={tr.notifications}
          >
            <Bell size={18} />
            <span className="badge-dot" />
          </button>
          {showNotifications && (
            <div className="dropdown-menu" style={{ width: 320, insetInlineEnd: -60 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderBottom: '1px solid var(--border)'
              }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{tr.notifications}</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)' }}
                >
                  <Globe size={14} />
                </button>
              </div>
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                {tr.noNotifications}
              </div>
            </div>
          )}
        </div>

        <div ref={userRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(o => !o)}
            className="user-info"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 8px', borderRadius: 10,
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
            }}>{initial}</div>
            <div className="show-desktop" style={{ textAlign: 'start' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>{userName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lang === 'ar' ? 'مدير' : 'Admin'}</div>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" className="show-desktop" />
          </button>
          {showUserMenu && (
            <div className="dropdown-menu" style={{ minWidth: 200, insetInlineEnd: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{userName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{session?.user?.email || ''}</div>
              </div>
              <Link
                href="/settings"
                className="dropdown-item"
                onClick={() => setShowUserMenu(false)}
                style={{ textDecoration: 'none' }}
              >
                <Settings size={16} />
                {tr.settings}
              </Link>
              <button className="dropdown-item" onClick={handleLogout} style={{ color: '#EF4444' }}>
                <LogOut size={16} />
                {tr.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function Link({ href, children, className, onClick, style }: { href: string; children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <NextLink
      href={href}
      className={className}
      onClick={onClick}
      style={style}
    >
      {children}
    </NextLink>
  )
}
