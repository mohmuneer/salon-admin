'use client'
import './globals.css'
import { useState, createContext, useContext, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import PortalHeader from '@/components/PortalHeader'
import QueryProvider from '@/components/QueryProvider'
import { SupplierAuthProvider } from '@/components/SupplierAuthContext'
import PwaSetup from '@/components/PwaSetup'
import { Lang } from '@/lib/translations'

export const LangContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
}>({ lang: 'ar', setLang: () => {} })

export function useLang() { return useContext(LangContext) }

export const SidebarContext = createContext<{
  open: boolean
  toggle: () => void
  close: () => void
  collapsed: boolean
  toggleCollapsed: () => void
}>({ open: false, toggle: () => {}, close: () => {}, collapsed: false, toggleCollapsed: () => {} })

export function useSidebar() { return useContext(SidebarContext) }

export type Theme = 'light' | 'dark' | 'gold' | 'blue' | 'emerald' | 'rose'

export const ThemeContext = createContext<{
  theme: Theme
  setTheme: (t: Theme) => void
}>({ theme: 'gold', setTheme: () => {} })

export function useTheme() { return useContext(ThemeContext) }

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isReceipt = pathname.startsWith('/receipt')
  const isPortal = pathname.startsWith('/portal')
  const isLogin = pathname === '/login'
  const isActivate = pathname === '/activate'
  const isPublic = pathname === '/public' || pathname.startsWith('/public/') || pathname.startsWith('/departments/')
  const isSupplierPortal = pathname.startsWith('/supplier-portal')
  const isPaymentCallback = pathname.startsWith('/payment-callback')
  const isFullPage = isActivate || isLogin || isReceipt || isPublic || isSupplierPortal || isPaymentCallback
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarLoaded, setSidebarLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('glamour-sidebar-collapsed')
    if (saved === 'true') setSidebarCollapsed(true)
    setSidebarLoaded(true)
  }, [])

  const toggleSidebar = useCallback(() => setSidebarOpen(o => !o), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const toggleCollapsed = useCallback(() => {
    setSidebarCollapsed(o => {
      const next = !o
      localStorage.setItem('glamour-sidebar-collapsed', String(next))
      return next
    })
  }, [])

  useEffect(() => { closeSidebar() }, [pathname])

  if (isFullPage || isPublic) return <SupplierAuthProvider>{children}</SupplierAuthProvider>

  if (isPortal) {
    return (
      <>
        <PortalHeader />
        <main style={{ padding: '24px' }}>{children}</main>
      </>
    )
  }

  return (
    <SidebarContext.Provider value={{
      open: sidebarOpen,
      toggle: toggleSidebar,
      close: closeSidebar,
      collapsed: sidebarCollapsed,
      toggleCollapsed,
    }}>
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="main-wrapper">{children}</main>
      </div>
    </SidebarContext.Provider>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar')
  const [theme, setTheme] = useState<Theme>('gold')
  const [themeLoaded, setThemeLoaded] = useState(false)
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    const saved = sessionStorage.getItem('glamour-theme') as Theme | null
    if (saved && ['light', 'dark', 'gold', 'blue', 'emerald', 'rose'].includes(saved)) {
      setTheme(saved)
    } else {
      fetch('/api/settings')
        .then(r => r.json())
        .then(d => {
          const t = d.theme
          if (t && ['light', 'dark', 'gold', 'blue', 'emerald', 'rose'].includes(t)) {
            setTheme(t)
            sessionStorage.setItem('glamour-theme', t)
          }
        })
        .catch(() => {})
    }
    setThemeLoaded(true)
  }, [])

  useEffect(() => {
    if (themeLoaded) {
      document.documentElement.setAttribute('data-theme', theme)
      sessionStorage.setItem('glamour-theme', theme)
    }
  }, [theme, themeLoaded])

  const [animClass, setAnimClass] = useState('')
  useEffect(() => {
    if (themeLoaded) {
      setAnimClass('theme-transition')
      const timer = setTimeout(() => setAnimClass(''), 400)
      return () => clearTimeout(timer)
    }
  }, [theme, themeLoaded])

  return (
    <html lang={lang} dir={dir} data-theme={theme} className={animClass}>
      <head>
        <title>Glamour Admin — لوحة التحكم</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Glamour Admin" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="mask-icon" href="/icon-192.png" color="#1A1A2E" />
      </head>
      <body dir={dir}>
        <QueryProvider>
          <SessionProvider>
            <LangContext.Provider value={{ lang, setLang }}>
              <ThemeContext.Provider value={{ theme, setTheme }}>
                <AdminShell>{children}</AdminShell>
              </ThemeContext.Provider>
            </LangContext.Provider>
          </SessionProvider>
        </QueryProvider>
        <PwaSetup />
      </body>
    </html>
  )
}
