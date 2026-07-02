'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLang, useSidebar, useTheme } from '@/app/layout'
import { t } from '@/lib/translations'
import { useSalonSettings } from '@/lib/useSalonSettings'
import SalonLogo from '@/components/SalonLogo'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Calendar, Users, Scissors,
  ShoppingBag, BarChart2, ShoppingCart, Settings, LogOut, Sparkles,
  Building2, UserCog, X, Package, Globe, Layers,
  ChevronLeft, ChevronRight, DollarSign, CreditCard, Boxes, Warehouse,
} from 'lucide-react'

const navItems = [
  { key: 'dashboard',     href: '/',               icon: LayoutDashboard },
  { key: 'appointments',  href: '/appointments',   icon: Calendar },
  { key: 'staff',         href: '/staff',          icon: Users },
  { key: 'services',      href: '/services',       icon: Scissors },
  { key: 'products',      href: '/products',       icon: ShoppingBag },
  { key: 'productGroups', href: '/product-groups', icon: Boxes },
  { key: 'warehouses',    href: '/warehouses',     icon: Warehouse },
  { key: 'inventory',     href: '/inventory',      icon: Package },
  { key: 'orders',        href: '/orders',         icon: ShoppingCart },
  { key: 'payments',     href: '/payments',       icon: CreditCard },
  { key: 'customers',     href: '/customers',      icon: Users },
  { key: 'reports',       href: '/reports',        icon: BarChart2 },
  { key: 'departments',   href: '/departments',    icon: Layers },
  { key: 'branches',      href: '/branches',       icon: Building2 },
  { key: 'bankAccounts',  href: '/bank-accounts',  icon: CreditCard },
  { key: 'currencies',    href: '/currencies',     icon: DollarSign },
  { key: 'users',         href: '/users',          icon: UserCog },
  { key: 'publicPage',    href: '/public-page',    icon: Globe },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { lang } = useLang()
  const tr = t[lang]
  const { open, toggle, close, collapsed, toggleCollapsed } = useSidebar()
  const { settings } = useSalonSettings()
  const { theme } = useTheme()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const handleNavClick = () => {
    if (window.innerWidth <= 768) close()
  }

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={close} />
      <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <SalonLogo src={settings.logo_url} size={collapsed ? 32 : 38} borderRadius={10} />
          <div className="salon-info">
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {settings.name || 'Glamour'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Admin Panel</div>
          </div>
          <button
            onClick={toggleCollapsed}
            className="sidebar-toggle show-desktop"
            title={lang === 'ar' ? (collapsed ? 'توسعة الشريط' : 'تصغير الشريط') : (collapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          >
            <span className="icon">
              {lang === 'ar' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </span>
          </button>
          <button
            onClick={close}
            className="sidebar-close hide-desktop"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-nav">
          {navItems.map(({ key, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={key}
                href={href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <Icon size={18} />
                <span>{tr[key as keyof typeof tr] as string}</span>
                <span className="nav-tooltip">{tr[key as keyof typeof tr] as string}</span>
              </Link>
            )
          })}
        </div>

        <div className="sidebar-footer">
          <Link href="/settings" className="nav-link" onClick={handleNavClick}>
            <Settings size={18} />
            <span>{tr.settings}</span>
            <span className="nav-tooltip">{tr.settings}</span>
          </Link>
          <button
            className="nav-link"
            onClick={handleLogout}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'start' }}
          >
            <LogOut size={18} />
            <span>{tr.logout}</span>
            <span className="nav-tooltip">{tr.logout}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
