'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Truck, Zap, Bell, Maximize2, Activity, Wifi, X, Share2, ExternalLink } from 'lucide-react'

const STORAGE_KEY = 'glamour-supplier-pwa'
const DISMISS_DAYS = 7

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isInStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
}

function getStorage(): { installed?: boolean; dismissed?: boolean; expiry?: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function SupplierInstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [open, setOpen] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    if (isInStandalone()) return

    const ios = isIOS()
    setIsIOSDevice(ios)
    const stored = getStorage()

    if (stored?.installed) return
    if (stored?.dismissed && stored.expiry && stored.expiry > Date.now()) return

    if (ios) {
      const timer = setTimeout(() => {
        if (!mountedRef.current) return
        setShow(true)
        requestAnimationFrame(() => { if (mountedRef.current) setOpen(true) })
      }, 2000)
      return () => { clearTimeout(timer); mountedRef.current = false }
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      if (!mountedRef.current) return
      setDeferred(e)
      setTimeout(() => {
        if (!mountedRef.current) return
        setShow(true)
        requestAnimationFrame(() => { if (mountedRef.current) setOpen(true) })
      }, 1000)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    return () => {
      mountedRef.current = false
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferred) return
    deferred.prompt()
    const result = await deferred.userChoice
    if (result.outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ installed: true, expiry: null }))
      setOpen(false)
      setTimeout(() => setShow(false), 250)
    }
    setDeferred(null)
  }, [deferred])

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      dismissed: true,
      expiry: Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000,
    }))
    setOpen(false)
    setTimeout(() => setShow(false), 250)
  }, [])

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) dismiss()
  }, [dismiss])

  if (!show) return null

  const features = [
    { icon: <Zap size={16} />, label: 'وصول أسرع' },
    { icon: <Bell size={16} />, label: 'إشعارات فورية' },
    { icon: <Maximize2 size={16} />, label: 'يعمل بملء الشاشة' },
    { icon: <Activity size={16} />, label: 'أداء أفضل' },
    { icon: <Wifi size={16} />, label: 'العمل عند ضعف الاتصال' },
  ]

  if (isIOSDevice) {
    return (
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: open ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, transition: 'background 0.25s ease',
        }}
      >
        <div style={{
          background: 'white', borderRadius: 20, maxWidth: 400, width: '100%',
          padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
          opacity: open ? 1 : 0, transition: 'transform 0.25s ease, opacity 0.25s ease',
          position: 'relative',
        }}>
          <button onClick={dismiss} style={{
            position: 'absolute', top: 12, insetInlineEnd: 12,
            background: '#F3F4F6', border: 'none', borderRadius: '50%',
            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6B7280',
          }}>
            <X size={14} />
          </button>

          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Truck size={28} color="white" />
          </div>

          <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#1A1A2E', margin: '0 0 6px' }}>
            ثبت تطبيق الموردين
          </h2>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: '0 0 20px' }}>
            قم بتثبيت التطبيق للوصول السريع إلى الطلبات والفواتير والإشعارات وإدارة حسابك من الشاشة الرئيسية.
          </p>

          <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ background: 'var(--gold)', color: 'white', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>1</span>
                اضغط على زر المشاركة
                <Share2 size={14} style={{ color: '#6B7280', flexShrink: 0 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ background: 'var(--gold)', color: 'white', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>2</span>
                اختر &quot;إضافة إلى الشاشة الرئيسية&quot;
                <ExternalLink size={14} style={{ color: '#6B7280', flexShrink: 0 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: 'var(--gold)', color: 'white', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>3</span>
                اضغط على &quot;إضافة&quot; في الأعلى
              </div>
            </div>
          </div>

          <button onClick={dismiss} style={{
            width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: 12,
            background: 'white', color: '#6B7280', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            فهمت
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: open ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, transition: 'background 0.25s ease',
        backdropFilter: open ? 'blur(2px)' : 'none',
      }}
    >
      <div style={{
        background: 'white', borderRadius: 20, maxWidth: 400, width: '100%',
        padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        transform: open ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
        opacity: open ? 1 : 0, transition: 'transform 0.25s ease, opacity 0.25s ease',
        position: 'relative',
      }}>
        <button onClick={dismiss} style={{
          position: 'absolute', top: 12, insetInlineEnd: 12,
          background: '#F3F4F6', border: 'none', borderRadius: '50%',
          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#6B7280',
        }}>
          <X size={14} />
        </button>

        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Truck size={28} color="white" />
        </div>

        <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#1A1A2E', margin: '0 0 6px' }}>
          ثبت تطبيق الموردين
        </h2>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: '0 0 20px' }}>
          قم بتثبيت التطبيق للوصول السريع إلى الطلبات والفواتير والإشعارات وإدارة حسابك من الشاشة الرئيسية.
        </p>

        <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
          {features.map(f => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#374151',
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'var(--primary-50)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--gold)', flexShrink: 0,
              }}>
                {f.icon}
              </span>
              {f.label}
            </div>
          ))}
        </div>

        <button onClick={handleInstall} style={{
          width: '100%', padding: '12px', border: 'none', borderRadius: 12,
          background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
          color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', marginBottom: 8,
          boxShadow: '0 4px 16px color-mix(in srgb, var(--gold) 30%, transparent)',
        }}>
          تثبيت التطبيق
        </button>
        <button onClick={dismiss} style={{
          width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: 12,
          background: 'white', color: '#6B7280', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          لاحقاً
        </button>
      </div>
    </div>
  )
}
