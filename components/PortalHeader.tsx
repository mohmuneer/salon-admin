'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import { useSalonSettings } from '@/lib/useSalonSettings'
import SalonLogo from '@/components/SalonLogo'
import { Bell, Globe, LogOut, Sparkles, Volume2, X } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'

function playChime() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, ctx.currentTime)
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  } catch { /* audio not supported */ }
}

export default function PortalHeader() {
  const { lang, setLang } = useLang()
  const tr = t[lang]
  const { settings } = useSalonSettings()
  const { data: session } = useSession()
  const userName = session?.user?.name || ''
  const initial = userName.charAt(0)

  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [prevCount, setPrevCount] = useState(0)
  const [permitted, setPermitted] = useState<NotificationPermission | 'unset'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unset'
  )
  const ref = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  const requestPermission = useCallback(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'default') return
    Notification.requestPermission().then(p => setPermitted(p))
  }, [])

  const loadNotifications = useCallback(() => {
    fetch('/api/portal/notifications').then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : []
      setNotifications(prev => {
        prevCountRef.current = prev.length
        return list
      })
    })
  }, [])

  // Track new notifications and trigger browser notification + chime
  useEffect(() => {
    if (notifications.length > prevCountRef.current && prevCountRef.current > 0) {
      playChime()
      if (permitted === 'granted') {
        const latest = notifications[0]
        try {
          new Notification(tr.newBooking, {
            body: `${latest.customer_name} — ${latest.service_name}`,
            icon: '/icon-192.png',
            tag: 'glamour-booking',
          })
        } catch { /* notification failed */ }
      }
    }
    setPrevCount(prevCountRef.current)
  }, [notifications, permitted, tr])

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 15000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const toggleOpen = async () => {
    const next = !open
    setOpen(next)
    if (next && notifications.length > 0) {
      await fetch('/api/portal/notifications', { method: 'PATCH' })
      setNotifications([])
    }
  }

  const count = notifications.length

  return (
    <header style={{
      background: 'white', borderBottom: '1px solid #E8E4DC',
      padding: '0 24px', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <SalonLogo src={settings.logo_url} size={36} borderRadius={10} />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>{settings.name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Language */}
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            border: '1px solid #E5E7EB', background: 'white',
            cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500
          }}
        >
          <Globe size={15} />
          {lang === 'ar' ? 'English' : 'عربي'}
        </button>

        {/* Notifications */}
        <div ref={ref} style={{ position: 'relative' }}>
          <button
            onClick={toggleOpen}
            title={tr.notifications}
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}
          >
            {count > 0 ? (
              <>
                <Bell size={20} color="var(--gold)" />
                <span style={{
                  position: 'absolute', top: 0, insetInlineEnd: 0,
                  minWidth: 18, height: 18, borderRadius: 9,
                  background: '#EF4444', color: 'white',
                  fontSize: 10, fontWeight: 700, lineHeight: '18px',
                  textAlign: 'center', padding: '0 4px',
                  border: '2px solid white', animation: 'none'
                }}>
                  {count > 99 ? '99+' : count}
                </span>
              </>
            ) : (
              <Bell size={20} color="#6B7280" />
            )}
          </button>

          {open && (
            <div style={{
              position: 'absolute', insetInlineEnd: 0, top: '110%', width: 320,
              background: 'white', borderRadius: 12, border: '1px solid #E8E4DC',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 50, overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid #F1EDE4',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#1A1A2E' }}>
                  {tr.notifications}
                  {count > 0 && (
                    <span style={{ marginInlineStart: 8, fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>
                      ({count})
                    </span>
                  )}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {permitted === 'unset' && (
                    <button
                      onClick={requestPermission}
                      title="تفعيل الإشعارات"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', color: '#9CA3AF' }}
                    >
                      <Volume2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', color: '#9CA3AF' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {count === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    {tr.noNotifications}
                  </div>
                ) : notifications.map((n: any) => (
                  <div key={n.id} style={{
                    padding: '14px 16px', borderBottom: '1px solid #F8F7F4',
                    cursor: 'default', transition: 'background 0.15s'
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FFFAF0')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--gold)', flexShrink: 0
                      }} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>{tr.newBooking}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, paddingInlineStart: 14 }}>
                      {n.customer_name}
                      <span style={{ color: 'var(--gold)', margin: '0 4px' }}>—</span>
                      {n.service_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, paddingInlineStart: 14 }}>
                      {new Date(n.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                      <span style={{ margin: '0 6px' }}>·</span>
                      {n.start_time?.slice(0, 5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 14
          }}>{initial}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', lineHeight: 1.2 }}>{userName}</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{lang === 'ar' ? 'موظف' : 'Staff'}</span>
          </div>
          <button
            onClick={async () => { await signOut({ redirect: false }); window.location.href = '/login' }}
            title={tr.logout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', color: '#9CA3AF' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
