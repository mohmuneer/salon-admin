'use client'
import { useEffect, useState, useRef, useCallback, useReducer } from 'react'
import { X, ShoppingCart, Plus, Minus, Trash2, Check, Calendar, Clock, Phone, User, MapPin, Send, LogIn, UserPlus, LogOut, Package, Eye, Star, Scissors, CreditCard, Building2, Copy } from 'lucide-react'

const C: Record<string,string> = {
  navy: '#0a1628', navyLight: '#0f1f38', navyCard: '#13203a',
  blue: '#2f7bff', gold: '#d4a437', goldLight: '#e8c25e', goldGlow: '#d4a43744',
  text: '#eaf1ff', textMuted: '#9fb2d4', textDim: '#6a7d9e',
  border: 'rgba(255,255,255,0.06)', borderH: 'rgba(255,255,255,0.12)',
  success: '#22c55e', error: '#ef4444',
}

function rgbToHex(c: string): string {
  const m = c.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
  if (m) return '#' + [m[1],m[2],m[3]].map(v => parseInt(v).toString(16).padStart(2,'0')).join('')
  return c
}

const DARK_SURFACE = '#0a1628'
const DARK_SURFACE_ALT = '#0f1f38'
const DARK_CARD = '#13203a'
const DARK_TEXT = '#eaf1ff'
const DARK_TEXT_MUTED = '#9fb2d4'
const DARK_TEXT_DIM = '#6a7d9e'
const DARK_BORDER = 'rgba(255,255,255,0.06)'

/* Apply a primary_color hex to the global C palette */
function applyThemeColor(primary: string) {
  C.navy = DARK_SURFACE; C.navyLight = DARK_SURFACE_ALT; C.navyCard = DARK_CARD
  C.text = DARK_TEXT; C.textMuted = DARK_TEXT_MUTED; C.textDim = DARK_TEXT_DIM
  C.border = DARK_BORDER; C.success = '#22c55e'; C.error = '#ef4444'; C.blue = '#2f7bff'
  const p = /^#[0-9a-fA-F]{6}$/.test(primary) ? primary : '#C9A55F'
  C.gold = p
  const r = parseInt(p.slice(1,3),16), g = parseInt(p.slice(3,5),16), b = parseInt(p.slice(5,7),16)
  C.goldLight = '#' + [Math.min(255,r+48), Math.min(255,g+48), Math.min(255,b+48)].map(v=>v.toString(16).padStart(2,'0')).join('')
  C.goldGlow = p + '44'
}

function useThemeWatcher() {
  const [, force] = useReducer(x => x + 1, 0)
  useEffect(() => {
    function refresh(pc: string) { applyThemeColor(pc); force() }

    // 1 — Check admin preview (set by public-page management)
    try {
      const raw = localStorage.getItem('public_theme_preview')
      if (raw) { const d = JSON.parse(raw); if (d?.primary_color) { refresh(d.primary_color); return } }
    } catch {}

    // 2 — Fetch from DB-backed API (runs once on mount)
    fetch('/api/public-theme?t=' + Date.now())
      .then(r => r.json())
      .then(d => { if (d.primary_color) refresh(d.primary_color) })
      .catch(() => {})
  }, [])
}

const ICONS = ['💇‍♀️','🎨','💅','💄','🧴','💆‍♀️','✨','🌸']
const PI = ['🧴','💧','🌿','✨','💎','💅','🧪','🌸']

function usr(t = 0.05, r = true) { const ref = useRef<HTMLDivElement>(null); const [v, s] = useState(false); useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { s(true); if (!r) o.unobserve(el) } else if (r) s(false) }, { threshold: t }); o.observe(el); return () => o.disconnect() }, [t, r]); return { ref, visible: v } }
function AS({ children, d = 0, className, style }: { children: React.ReactNode; d?: number; className?: string; style?: React.CSSProperties }) { const { ref, visible } = usr(); return <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(40px)', transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${d}s`, ...style }}>{children}</div> }
function MG() { const [p, s] = useState({ x: 0, y: 0 }); const h = useCallback((e: MouseEvent) => s({ x: e.clientX, y: e.clientY }), []); useEffect(() => { window.addEventListener('mousemove', h, { passive: true }); return () => window.removeEventListener('mousemove', h) }, [h]); return <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, background: `radial-gradient(600px circle at ${p.x}px ${p.y}px, ${C.gold}0a, transparent 60%)` }} /> }

function FO({ color, size, top, left, right, delay, duration }: { color: string; size: number; top: string; left?: string; right?: string; delay: number; duration: number }) { return <div style={{ position: 'absolute', top, left, right, width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle at 30% 30%, ${color}22, transparent)`, pointerEvents: 'none', animation: `fl ${duration}s ease-in-out ${delay}s infinite` }} /> }

interface Category { id: string; name_ar: string; icon?: string; service_count: number }
interface Dept { id: string; name_ar: string; name_en?: string; description?: string; icon?: string; slug?: string; image_url?: string; service_count: number; product_count: number }
interface Service { id: number; name_ar: string; duration_min: number; price: number; image_url?: string; category_id?: string }
interface Product { id: number; name_ar: string; brand?: string; price: number; image_url?: string }
interface Offer { id: number; title_ar: string; description_ar: string; original_price: number; offer_price: number; valid_until: string; badge: string; image_url?: string; gallery?: string[]; before_after?: string[]; cta_text?: string; cta_link?: string; cta_action?: string; countdown_end?: string; whatsapp_number?: string; whatsapp_message?: string; linked_service_id?: string | number | null }
interface Ad { id: number; title_ar: string; youtube_id: string; youtube_url?: string; description_ar: string; image_url?: string }
interface Review { id: number; customer_name: string; customer_avatar: string; rating: number; comment_ar: string }
interface Banner { id: number; title_ar: string; subtitle_ar: string; image_url: string; video_url: string; cta_text_ar: string; cta_link: string; cta_action: string }
interface Coupon { id: number; code: string; discount_percent: number; valid_until: string }
interface CItem { product: Product; qty: number }

function T({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) { useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose]); return <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999, padding: '14px 24px', borderRadius: 14, background: type === 'success' ? C.success : C.error, color: '#fff', fontSize: 14, fontWeight: 600, boxShadow: `0 8px 32px ${type === 'success' ? C.success : C.error}44`, display: 'flex', alignItems: 'center', gap: 10, animation: 'su 0.3s ease' }}><span style={{ fontSize: 18 }}>{type === 'success' ? '✓' : '✕'}</span>{msg}</div> }

function Md({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title?: string; wide?: boolean }) {
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])
  return <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} />
    <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: wide ? 600 : 480, maxHeight: '90vh', overflowY: 'auto', background: C.navyCard, borderRadius: 24, border: `1px solid ${C.border}`, padding: 28, animation: 'mi 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        {title && <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>}
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: C.textMuted, cursor: 'pointer', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.textMuted }}><X size={18} /></button>
      </div>
      {children}
    </div>
  </div>
}

function In({ label, value, onChange, type = 'text', placeholder, icon, rows }: { label?: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; icon?: React.ReactNode; rows?: number }) {
  const base: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.navy, color: C.text, fontSize: 14, outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box', fontFamily: 'inherit' }
  return <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', color: C.textMuted, fontSize: 13, marginBottom: 5, fontWeight: 500 }}>{label}</label>}
    <div style={{ position: 'relative' }}>
      {icon && <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: C.textDim, pointerEvents: 'none' }}>{icon}</div>}
      {rows ? <textarea style={{ ...base, paddingRight: icon ? 44 : 16, minHeight: 80, resize: 'vertical' }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} /> :
       <input style={{ ...base, paddingRight: icon ? 44 : 16 }} value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder} />}
    </div>
  </div>
}

function Bt({ children, onClick, variant = 'primary', fullWidth, disabled, style }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary'|'ghost'|'danger'; fullWidth?: boolean; disabled?: boolean; style?: React.CSSProperties }) {
  const vc = variant === 'primary' ? { bg: `linear-gradient(135deg,${C.gold},${C.goldLight})`, color: C.navy, h: 'brightness(1.1)' } :
    variant === 'danger' ? { bg: `${C.error}22`, color: C.error, h: `${C.error}33` } :
    { bg: 'rgba(255,255,255,0.06)', color: C.textMuted, h: 'rgba(255,255,255,0.12)' }
  return <button onClick={onClick} disabled={disabled} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: variant === 'primary' ? vc.bg : vc.bg, color: vc.color, fontWeight: 600, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, width: fullWidth ? '100%' : undefined, transition: 'all 0.25s', display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center', ...style }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.filter = vc.h; e.currentTarget.style.transform = 'translateY(-2px)' } }}
    onMouseLeave={e => { if (!disabled) { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)' } }}>{children}</button>
}

function genSlots() { const s: string[] = []; for (let h = 9; h <= 20; h++) { s.push(`${h.toString().padStart(2,'0')}:00`); if (h < 20) s.push(`${h.toString().padStart(2,'0')}:30`) } return s }

const navLinks = [
  { id: 'departments', label: 'الأقسام' },
  { id: 'features', label: 'مميزاتنا' },
  { id: 'offers', label: 'العروض' },
  { id: 'ads', label: 'الإعلانات' },
  { id: 'reviews', label: 'التقييمات' },
  { id: 'contact', label: 'اتصل بنا' },
]

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 400, background: active ? C.gold : 'rgba(255,255,255,0.06)', color: active ? C.navy : C.textMuted, transition: 'all 0.2s' }}>{children}</button>
}

export default function LamsetAlMalika() {
  useThemeWatcher()
  const [data, setData] = useState<any>(null)
  const [scrolled, setScrolled] = useState(0)
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const [cart, setCart] = useState<CItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [cartTab, setCartTab] = useState<'unpaid'|'paid'>('unpaid')
  const [paidBkIds, setPaidBkIds] = useState<Set<string>>(new Set())
  const [cartDetailItem, setCartDetailItem] = useState<any>(null)
  const [cartDetailType, setCartDetailType] = useState<'booking'|'order'>('booking')
  const [showRatingBk, setShowRatingBk] = useState<any>(null)
  const [ratingStars, setRatingStars] = useState(5)
  const [ratingText, setRatingText] = useState('')
  const [ratingLoading, setRatingLoading] = useState(false)
  const [cartPayOpen, setCartPayOpen] = useState(false)
  const [cartPayTab, setCartPayTab] = useState<'transfer'|'debit'|'card'>('transfer')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [cardFlipped, setCardFlipped] = useState(false)
  const [cartPayLoading, setCartPayLoading] = useState(false)
  const [cartPayDone, setCartPayDone] = useState(false)
  const [cartPayMethod, setCartPayMethod] = useState('')
  const [cartDebitBank, setCartDebitBank] = useState('')
  const [cartDebitAcct, setCartDebitAcct] = useState('')
  const [cartDebitOwner, setCartDebitOwner] = useState('')
  const [cartIbanVisible, setCartIbanVisible] = useState(false)
  const [cartIbanCopied, setCartIbanCopied] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File|null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string|null>(null)
  const [receiptError, setReceiptError] = useState('')
  const [receiptUploading, setReceiptUploading] = useState(false)

  // Auth
  const [authToken, setAuthToken] = useState<string|null>(null)
  const [authUser, setAuthUser] = useState<any>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPass, setRegPass] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Profile
  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [profileTab, setProfileTab] = useState<'unpaid'|'paid'>('unpaid')
  const [pubDetail,  setPubDetail]  = useState<any>(null)
  const [pubDetailT, setPubDetailT] = useState<'booking'|'order'>('booking')
  const [modifyingBk, setModifyingBk] = useState<any>(null)
  const [modBkDate, setModBkDate] = useState('')
  const [modBkTime, setModBkTime] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [confirmDlg, setConfirmDlg] = useState<{msg:string;sub?:string;label?:string;danger?:boolean;onOk:()=>void}|null>(null)
  const askConfirm = (msg:string, sub:string, onOk:()=>void, label='تأكيد', danger=true) => setConfirmDlg({msg,sub,label,danger,onOk})

  // Booking
  const [bkService, setBkService] = useState<Service|null>(null)
  const [bkName, setBkName] = useState('')
  const [bkPhone, setBkPhone] = useState('')
  const [bkDate, setBkDate] = useState('')
  const [bkTime, setBkTime] = useState('')
  const [bkLoading, setBkLoading] = useState(false)
  const [bkDone, setBkDone] = useState(false)
  const [bkId, setBkId] = useState('')

  // Checkout
  const [coOpen, setCoOpen] = useState(false)
  const [coName, setCoName] = useState('')
  const [coPhone, setCoPhone] = useState('')
  const [pubBankInfo, setPubBankInfo] = useState({ bank_name:'', account_holder:'', iban:'', account_number:'' })
  const [pubIbanVisible, setPubIbanVisible] = useState(false)
  const [pubIbanCopied, setPubIbanCopied] = useState(false)
  const [coDebitBank,  setCoDebitBank]  = useState('')
  const [coDebitAcct,  setCoDebitAcct]  = useState('')
  const [coDebitOwner, setCoDebitOwner] = useState('')
  const [coAddr, setCoAddr] = useState('')
  const [coPay, setCoPay] = useState<'cod'|'bank_transfer'|'direct_debit'>('bank_transfer')
  const [coLoading, setCoLoading] = useState(false)
  const [coDone, setCoDone] = useState(false)
  const [coId, setCoId] = useState('')

  // Contact
  const [showCt, setShowCt] = useState(false)
  const [ctName, setCtName] = useState('')
  const [ctPhone, setCtPhone] = useState('')
  const [ctMsg, setCtMsg] = useState('')
  const [ctLoading, setCtLoading] = useState(false)

  const [expAd, setExpAd] = useState<number|null>(null)
  const [searchQ, setSearchQ] = useState('')

  const openCustomerApp = () => window.open('https://salon-customer-three.vercel.app', '_blank')

  // Load cart from localStorage + fetch bank info
  useEffect(() => {
    const saved = localStorage.getItem('lamset_cart')
    if (saved) try { setCart(JSON.parse(saved)) } catch {}
    const savedBk = localStorage.getItem('lamset_paid_bk')
    if (savedBk) try { setPaidBkIds(new Set(JSON.parse(savedBk))) } catch {}
    const token = localStorage.getItem('lamset_token')
    if (token) { setAuthToken(token); fetchProfile(token) }
    // Fetch bank/payment settings
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d) setPubBankInfo({ bank_name: d.bank_name||'', account_holder: d.account_holder||'', iban: d.iban||'', account_number: d.account_number||'' })
    }).catch(() => {})
  }, [])

  useEffect(() => { localStorage.setItem('lamset_cart', JSON.stringify(cart)) }, [cart])

  useEffect(() => {
    fetch('/api/public-showcase').then(r => r.json()).then(d => {
      setData(d)
      if (d?.bank?.iban) {
        setPubBankInfo({
          bank_name:      d.bank.bank_name      || '',
          account_holder: d.bank.account_holder || '',
          iban:           d.bank.iban           || '',
          account_number: d.bank.account_number || '',
        })
      }
    })
    const os = () => { const y = window.scrollY; setScrolled(y); document.querySelectorAll('[data-s]').forEach(s => { const t = (s as HTMLElement).offsetTop - 250; if (y >= t) setActiveSection(s.getAttribute('data-s') || '') }) }
    window.addEventListener('scroll', os, { passive: true })
    return () => window.removeEventListener('scroll', os)
  }, [])

  const [activeSection, setActiveSection] = useState('')

  // SEO: apply all meta tags from settings
  useEffect(() => {
    if (!data) return
    const { salon: s, pageMeta } = data
    const setMeta = (name: string, content: string, prop?: boolean) => {
      if (!content) return
      const attr = prop ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el) }
      el.setAttribute('content', content)
    }
    // Page title
    const title = s?.seo_title || pageMeta?.title_ar || s?.name || ''
    if (title) document.title = title
    // Standard meta
    setMeta('description', s?.seo_description || pageMeta?.description_ar || '')
    setMeta('keywords', s?.seo_keywords || '')
    // Open Graph
    setMeta('og:title', s?.seo_title || s?.name || '', true)
    setMeta('og:description', s?.seo_description || '', true)
    setMeta('og:image', s?.seo_image || s?.logo_url || '', true)
    setMeta('og:type', 'website', true)
    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', s?.seo_title || s?.name || '')
    setMeta('twitter:description', s?.seo_description || '')
    setMeta('twitter:image', s?.seo_image || s?.logo_url || '')
  }, [data])

  const fetchProfile = async (token: string) => {
    setProfileLoading(true)
    try {
      const r = await fetch('/api/public-auth/profile', { headers: { 'Authorization': `Bearer ${token}` } })
      if (r.ok) {
        const d = await r.json()
        setAuthUser(d.user)
        setProfile(d)
        // Sync server-side submitted booking IDs into paidBkIds
        if (Array.isArray(d.submitted_booking_ids) && d.submitted_booking_ids.length > 0) {
          setPaidBkIds(prev => {
            const next = new Set([...prev, ...d.submitted_booking_ids.map(String)])
            try { localStorage.setItem('lamset_paid_bk', JSON.stringify([...next])) } catch {}
            return next
          })
        }
      } else {
        setAuthToken(null); setAuthUser(null); setProfile(null); localStorage.removeItem('lamset_token')
      }
    } catch {}
    setProfileLoading(false)
  }

  // Auth
  const doLogin = async () => {
    if (!loginPhone || !loginPass) { setToast({ msg: 'يرجى تعبئة جميع الحقول', type: 'error' }); return }
    setAuthLoading(true)
    try {
      const r = await fetch('/api/public-auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: loginPhone, password: loginPass }) })
      const d = await r.json()
      if (!r.ok) { setToast({ msg: d.error || 'خطأ في تسجيل الدخول', type: 'error' }); setAuthLoading(false); return }
      localStorage.setItem('lamset_token', d.token)
      setAuthToken(d.token); setAuthUser(d.user)
      setShowLogin(false); setLoginPhone(''); setLoginPass('')
      fetchProfile(d.token)
      setToast({ msg: `مرحباً ${d.user.name} 👋`, type: 'success' })
    } catch { setToast({ msg: 'حدث خطأ في الاتصال', type: 'error' }); setAuthLoading(false) }
    setAuthLoading(false)
  }

  const doRegister = async () => {
    if (!regName || !regPhone || !regPass) { setToast({ msg: 'يرجى تعبئة جميع الحقول', type: 'error' }); return }
    if (!/^05\d{8}$/.test(regPhone)) { setToast({ msg: 'رقم الجوال غير صحيح', type: 'error' }); return }
    if (regPass.length < 6) { setToast({ msg: 'كلمة المرور 6 أحرف على الأقل', type: 'error' }); return }
    setAuthLoading(true)
    try {
      const r = await fetch('/api/public-auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: regName, phone: regPhone, password: regPass }) })
      const d = await r.json()
      if (!r.ok) { setToast({ msg: d.error || 'خطأ في التسجيل', type: 'error' }); setAuthLoading(false); return }
      localStorage.setItem('lamset_token', d.token)
      setAuthToken(d.token); setAuthUser(d.user)
      setShowRegister(false); setRegName(''); setRegPhone(''); setRegPass('')
      fetchProfile(d.token)
      setToast({ msg: `مرحباً ${d.user.name}، تم إنشاء الحساب ✓`, type: 'success' })
    } catch { setToast({ msg: 'حدث خطأ في الاتصال', type: 'error' }); setAuthLoading(false) }
    setAuthLoading(false)
  }

  const doLogout = () => {
    localStorage.removeItem('lamset_token'); setAuthToken(null); setAuthUser(null); setProfile(null)
    setToast({ msg: 'تم تسجيل الخروج', type: 'success' })
  }

  const markBksPaid = (ids: string[]) => {
    setPaidBkIds(prev => {
      const next = new Set([...prev, ...ids])
      try { localStorage.setItem('lamset_paid_bk', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  // Card helpers
  const fmtCardNumber = (v: string) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()
  const fmtExpiry = (v: string) => {
    const d = v.replace(/\D/g,'').slice(0,4)
    return d.length >= 3 ? d.slice(0,2)+'/'+d.slice(2) : d
  }
  const detectCard = (n: string): { type: string; label: string; color: string } => {
    const d = n.replace(/\D/g,'')
    if (/^4/.test(d))           return { type:'visa',       label:'VISA',       color:'#1A1F71' }
    if (/^5[1-5]|^2[2-7]/.test(d)) return { type:'mastercard', label:'Mastercard', color:'#EB001B' }
    if (/^3[47]/.test(d))       return { type:'amex',       label:'AMEX',       color:'#007BC1' }
    if (/^6/.test(d))           return { type:'discover',   label:'Discover',   color:'#FF6600' }
    return { type:'', label:'', color: C.textDim }
  }
  const luhn = (n: string): boolean => {
    const d = n.replace(/\D/g,'')
    let s = 0, alt = false
    for (let i = d.length - 1; i >= 0; i--) {
      let v = parseInt(d[i])
      if (alt) { v *= 2; if (v > 9) v -= 9 }
      s += v; alt = !alt
    }
    return s % 10 === 0
  }
  const validateCard = (): string => {
    const raw = cardNumber.replace(/\D/g,'')
    if (raw.length < 15) return 'رقم البطاقة غير مكتمل'
    if (!luhn(raw)) return 'رقم البطاقة غير صحيح'
    if (!cardHolder.trim()) return 'يرجى إدخال اسم حامل البطاقة'
    const [mm, yy] = cardExpiry.split('/').map(Number)
    if (!mm || mm < 1 || mm > 12) return 'تاريخ الانتهاء غير صحيح'
    const exp = new Date(2000 + yy, mm - 1, 1)
    if (exp < new Date()) return 'البطاقة منتهية الصلاحية'
    const cvvLen = detectCard(cardNumber).type === 'amex' ? 4 : 3
    if (cardCvv.replace(/\D/g,'').length < cvvLen) return `رمز الأمان يجب أن يكون ${cvvLen} أرقام`
    return ''
  }

  const validateReceiptFile = (file: File): string => {
    const allowed = ['image/jpeg','image/png','image/webp']
    if (!allowed.includes(file.type)) return 'يُسمح فقط بصور JPG أو PNG أو WEBP'
    if (file.size > 5 * 1024 * 1024) return 'حجم الملف يجب أن لا يتجاوز 5MB'
    return ''
  }

  const handleReceiptFile = (file: File) => {
    const err = validateReceiptFile(file)
    if (err) { setReceiptError(err); setReceiptFile(null); setReceiptPreview(null); return }
    setReceiptError('')
    setReceiptFile(file)
    const reader = new FileReader()
    reader.onload = e => setReceiptPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const submitCartPayment = async (method: string) => {
    if (method === 'حوالة بنكية' && !receiptFile) {
      setReceiptError('يرجى رفع سند الحوالة البنكية')
      return
    }
    if (method === 'بطاقة بنكية') {
      const err = validateCard()
      if (err) { setToast({ msg: err, type: 'error' }); return }
    }
    setCartPayLoading(true)
    try {
      let receiptUrl = ''

      // 1. Upload receipt if bank transfer
      if (method === 'حوالة بنكية' && receiptFile) {
        setReceiptUploading(true)
        const fd = new FormData()
        fd.append('file', receiptFile)
        fd.append('customer_name', authUser?.name || '')
        fd.append('customer_phone', authUser?.phone || '')
        fd.append('amount', String(cartGrandTotal))
        fd.append('appointment_ids', JSON.stringify(cartUnpaidBk.map((b:any)=>String(b.id))))
        fd.append('payment_method', 'bank_transfer')
        const rr = await fetch('/api/public-transfer-receipt', { method: 'POST', body: fd })
        const rd = await rr.json()
        if (!rr.ok) { setToast({ msg: rd.error || 'فشل رفع السند', type: 'error' }); setCartPayLoading(false); setReceiptUploading(false); return }
        receiptUrl = rd.receipt_url
        setReceiptUploading(false)
      }

      // 2. Create product order if any
      if (cart.length > 0) {
        const pmMap: Record<string,string> = { 'حوالة بنكية': 'bank_transfer', 'خصم من حساب': 'direct_debit', 'بطاقة بنكية': 'card' }
        await fetch('/api/public-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map(i => ({ productId: i.product.id, name: i.product.name_ar, qty: i.qty, priceSar: i.product.price })),
            customerName: authUser?.name || '', customerPhone: authUser?.phone || '',
            address: '', paymentMethod: pmMap[method] || 'card',
            totalSar: cartTotal,
            ...(method === 'خصم من حساب' ? { debitBank: cartDebitBank, debitAccount: cartDebitAcct, debitHolder: cartDebitOwner } : {}),
          })
        })
      }

      // 3. Mark bookings paid + clear cart
      const bkIds = cartUnpaidBk.map((b: any) => String(b.id))
      markBksPaid(bkIds)
      setCart([])
      setReceiptFile(null); setReceiptPreview(null); setReceiptError('')
      setCardNumber(''); setCardExpiry(''); setCardCvv(''); setCardHolder(''); setCardFlipped(false)
      setCartPayMethod(method)
      setCartPayDone(true)
      setCartPayOpen(false)
      setCartDebitBank(''); setCartDebitAcct(''); setCartDebitOwner('')
      setCartTab('paid')
      setToast({ msg: 'تم إرسال طلب الدفع بنجاح ✓', type: 'success' })
      if (authToken) fetchProfile(authToken)
    } catch {
      setToast({ msg: 'حدث خطأ، حاول مرة أخرى', type: 'error' })
    }
    setCartPayLoading(false)
  }

  const submitRating = async () => {
    if (!showRatingBk) return
    setRatingLoading(true)
    try {
      await fetch('/api/public-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: authUser?.name || 'عميل',
          customer_avatar: (authUser?.name || 'ع').charAt(0),
          rating: ratingStars,
          comment_ar: ratingText,
          comment_en: ratingText,
        })
      })
      setToast({ msg: 'شكراً على تقييمك ✓', type: 'success' })
      setShowRatingBk(null); setRatingText(''); setRatingStars(5)
    } catch {
      setToast({ msg: 'حدث خطأ في إرسال التقييم', type: 'error' })
    }
    setRatingLoading(false)
  }

  const requireAuth = (action: () => void) => {
    if (!authUser) { setToast({ msg: 'يرجى تسجيل الدخول أولاً', type: 'error' }); setShowLogin(true); return }
    action()
  }

  // Cart derived (depends on profile which loads after auth)
  const profAllBkCart  = profile?.bookings || []
  const profAllOrCart  = profile?.orders   || []
  // Unpaid bookings: active status AND not yet submitted for payment
  const cartUnpaidBk = profAllBkCart.filter((b:any) =>
    ['pending','confirmed','in_progress'].includes(b.status) && !paidBkIds.has(String(b.id))
  )
  // Paid bookings: completed by salon OR submitted for payment (paidBkIds from localStorage+server)
  const cartPaidBk = profAllBkCart.filter((b:any) =>
    b.status === 'completed' || b.status === 'no_show' || paidBkIds.has(String(b.id))
  )
  // Paid orders: ALL placed orders (submitted = paid from customer perspective, admin verifies later)
  const cartPaidOr = profAllOrCart.filter((o:any) => o.status !== 'cancelled')

  // Cart
  const addToCart = (product: Product) => {
    setCart(p => { const e = p.find(i => i.product.id === product.id); if (e) return p.map(i => i.product.id === product.id ? {...i, qty: i.qty+1} : i); return [...p, {product, qty: 1}] })
    setToast({ msg: 'تمت الإضافة إلى السلة ✓', type: 'success' })
  }
  const updQty = (id: number, d: number) => setCart(p => p.map(i => i.product.id === id ? {...i, qty: Math.max(0, i.qty+d)} : i).filter(i => i.qty > 0))
  const rmCart = (id: number) => setCart(p => p.filter(i => i.product.id !== id))
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartBkTotal = cartUnpaidBk.reduce((s: number, b: any) => s + Number(b.price || b.total || 0), 0)
  const cartGrandTotal = cartTotal + cartBkTotal
  const cartUnpaidCount = cartCount + cartUnpaidBk.length
  const cartPaidCount = cartPaidBk.length + cartPaidOr.length

  const openBooking = (service: Service) => {
    if (!authUser) { setToast({ msg: 'يرجى تسجيل الدخول أولاً', type: 'error' }); setShowLogin(true); return }
    setBkService(service); setBkName(authUser.name); setBkPhone(authUser.phone); setBkDate(''); setBkTime(''); setBkDone(false)
  }

  const submitBooking = async () => {
    if (!bkDate || !bkTime) { setToast({ msg: 'يرجى اختيار التاريخ والوقت', type: 'error' }); return }
    setBkLoading(true)
    try {
      const r = await fetch('/api/public-bookings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ serviceId: bkService!.id, customerName: bkName, customerPhone: bkPhone, date: bkDate, time: bkTime, price: bkService!.price }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setBkId(d.id); setBkDone(true); setToast({ msg: 'تم الحجز بنجاح ✓', type: 'success' })
      if (authToken) fetchProfile(authToken)
    } catch { setToast({ msg: 'حدث خطأ في الحجز', type: 'error' }) }
    setBkLoading(false)
  }

  const submitOrder = async () => {
    if (!coName || !coPhone) { setToast({ msg: 'يرجى تعبئة الاسم والجوال', type: 'error' }); return }
    if (coPay === 'direct_debit' && (!coDebitBank || !coDebitAcct || !coDebitOwner)) {
      setToast({ msg: 'يرجى تعبئة بيانات الحساب البنكي', type: 'error' }); return
    }
    setCoLoading(true)
    try {
      const r = await fetch('/api/public-orders', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          items: cart.map(i => ({productId:i.product.id,name:i.product.name_ar,qty:i.qty,priceSar:i.product.price})),
          customerName: coName, customerPhone: coPhone, address: coAddr,
          paymentMethod: coPay, totalSar: cartTotal,
          ...(coPay==='direct_debit' ? { debitBank: coDebitBank, debitAccount: coDebitAcct, debitHolder: coDebitOwner } : {}),
        })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setCoId(d.id); setCoDone(true); setCart([])
      setCoDebitBank(''); setCoDebitAcct(''); setCoDebitOwner('')
      setToast({ msg: 'تم تقديم الطلب بنجاح ✓', type: 'success' })
    } catch { setToast({ msg: 'حدث خطأ في تقديم الطلب', type: 'error' }) }
    setCoLoading(false)
  }

  const submitContact = async () => {
    if (!ctName || !ctPhone || !ctMsg) { setToast({ msg: 'يرجى تعبئة جميع الحقول', type: 'error' }); return }
    setCtLoading(true)
    try {
      const r = await fetch('/api/public-contact', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: ctName, phone: ctPhone, message: ctMsg }) })
      if (!r.ok) throw new Error()
      setCtName(''); setCtPhone(''); setCtMsg(''); setShowCt(false); setToast({ msg: 'تم إرسال الرسالة ✓', type: 'success' })
    } catch { setToast({ msg: 'حدث خطأ', type: 'error' }) }
    setCtLoading(false)
  }

  if (!data) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background: C.navy, flexDirection:'column', gap: 24 }}>
    <div style={{ width:48, height:48, borderRadius:'50%', border:`3px solid ${C.gold}22`, borderTopColor: C.gold, animation:'sp .8s linear infinite' }} />
    <span style={{ color: C.gold, fontSize:14, fontWeight:500 }}>جاري التحميل...</span>
  </div>

  const { salon, categories, departments, featuredServices, featuredProducts, services, products, features, offers, ads, reviews, banners, coupons, whatsapp, social_links, primary_color: showcasePrimaryColor, bank: showcaseBank } = data
  // Sync bank info if not yet loaded (showcase is primary source)
  if (showcaseBank?.iban && !pubBankInfo.iban) {
    setPubBankInfo({ bank_name: showcaseBank.bank_name||'', account_holder: showcaseBank.account_holder||'', iban: showcaseBank.iban||'', account_number: showcaseBank.account_number||'' })
  }
  // Apply theme from DB immediately (no polling needed)
  if (showcasePrimaryColor) applyThemeColor(showcasePrimaryColor)
  const activeBanner = banners?.length > 0 ? banners[0] : null
  const today = new Date().toISOString().split('T')[0]
  const depts = (departments||[]).filter((d:Dept) => !searchQ || d.name_ar.includes(searchQ))

  // Profile modal derived
  const profAllBk  = profile?.bookings || []
  const profAllOr  = profile?.orders   || []
  const profUnpaidBk = profAllBk.filter((b:any) => ['pending','confirmed','in_progress'].includes(b.status))
  const profUnpaidOr = profAllOr.filter((o:any)  => o.payment_status!=='paid' && o.status!=='cancelled')
  const profPaidBk   = profAllBk.filter((b:any) => b.status==='completed')
  const profPaidOr   = profAllOr.filter((o:any)  => o.payment_status==='paid')
  const profBkClr  = (s:string) => s==='completed'?C.success:s==='cancelled'||s==='no_show'?C.error:s==='confirmed'?C.blue:C.gold
  const profOrClr  = (s:string) => s==='delivered'?C.success:s==='cancelled'?C.error:s==='confirmed'?C.blue:C.gold
  const profBkLbl: Record<string,string> = {pending:'قيد الانتظار',confirmed:'مؤكد',in_progress:'جارٍ',completed:'مكتمل',cancelled:'ملغي',no_show:'لم يحضر'}
  const profOrLbl: Record<string,string>  = {pending:'قيد الانتظار',confirmed:'مؤكد',preparing:'قيد التجهيز',shipped:'في الطريق',delivered:'مسلّم',cancelled:'ملغي'}

  return <div style={{ fontFamily: "'Tajawal',sans-serif", direction:'rtl', background: C.navy, color: C.text, overflowX:'hidden', minHeight:'100vh' }}>
    <MG />
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');
      @keyframes sp{to{transform:rotate(360deg)}} @keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-30px)}}
      @keyframes mi{from{opacity:0;transform:scale(0.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
      @keyframes su{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      html{scroll-behavior:smooth;scroll-padding-top:80px}
      ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:${C.navy}} ::-webkit-scrollbar-thumb{background:${C.gold}44;border-radius:3px}
      ::selection{background:${C.gold}44;color:#fff}
      .sc{transition:all 0.4s cubic-bezier(0.16,1,0.3,1);border:1px solid ${C.border}}
      .sc:hover{transform:translateY(-8px);border-color:${C.gold}44;box-shadow:0 20px 60px rgba(212,164,55,0.08)}
      .pc{transition:all 0.3s;border:1px solid ${C.border}}
      .pc:hover{transform:translateY(-6px);border-color:${C.blue}44;box-shadow:0 16px 48px rgba(47,123,255,0.08)}
      .oc{transition:all 0.4s;border:1px solid ${C.gold}22}
      .oc:hover{transform:translateY(-8px);border-color:${C.gold}66;box-shadow:0 20px 60px ${C.goldGlow}}
      .nm::after{content:'';position:absolute;bottom:0;left:50%;width:0;height:2px;background:${C.gold};transition:all 0.3s;transform:translateX(-50%)}
      .nm:hover::after,.nm.active::after{width:60%}
      @keyframes lf{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
      @keyframes lg{0%,100%{box-shadow:0 0 40px ${C.gold}33,0 0 80px ${C.gold}11}50%{box-shadow:0 0 60px ${C.gold}55,0 0 120px ${C.gold}22}}
      @keyframes ls{0%{left:-100%}100%{left:200%}}
      @media(max-width:768px){.dm{display:none!important}.mb{display:flex!important}}
      /* ── Mobile Responsive ── */
      @media(max-width:768px){
        .app-dl-btn{display:none!important}
        .hdr-inner{padding:0 14px!important;height:58px!important}
        .hero-cnt{padding:80px 18px 60px!important}
        .banner-img{object-position:center 25%!important;object-fit:cover!important}
        #hero{min-height:85vh!important}
        .hero-btns{flex-direction:column!important;align-items:stretch!important}
        .hero-btns a{text-align:center!important;padding:13px 20px!important;justify-content:center!important}
        .dept-grid{grid-template-columns:1fr!important;gap:14px!important}
        .dept-card{height:200px!important}
        .feat-grid{grid-template-columns:1fr 1fr!important;gap:12px!important}
        .offers-grid{grid-template-columns:1fr!important}
        .reviews-grid{grid-template-columns:1fr!important}
        .contact-grid{grid-template-columns:1fr!important;gap:20px!important}
        .ads-grid{grid-template-columns:1fr!important}
        .sec-pad{padding-top:56px!important;padding-bottom:56px!important}
        .footer-grid{grid-template-columns:1fr!important;gap:24px!important}
        .footer-bar{flex-direction:column!important;align-items:center!important;gap:8px!important;text-align:center!important}
      }
      @media(max-width:480px){
        .feat-grid{grid-template-columns:1fr!important}
        .hero-cnt{padding:70px 16px 50px!important}
      }
    `}</style>

    {toast && <T msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

    {/* Header */}
    <header style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background: scrolled > 60 ? `${C.navyLight}ee` : 'transparent', backdropFilter: scrolled > 60 ? 'blur(20px)' : 'none', borderBottom: scrolled > 60 ? `1px solid ${C.border}` : 'none', transition:'all 0.4s' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:68, padding:'0 20px' }}>
        <a href="#hero" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          {salon?.logo_url ? <img src={salon.logo_url} alt="" style={{ height:32, width:32, borderRadius:8, objectFit:'cover' }} /> : <span style={{ fontSize:24 }}>💎</span>}
          <span style={{ color:'#fff', fontWeight:800, fontSize:16 }}>{salon?.name || 'لمسة الملكة'}</span>
        </a>

        {/* Desktop nav */}
        <nav className="dm" style={{ display:'flex', alignItems:'center', gap:2 }}>
          {navLinks.map(l => (
            <a key={l.id} href={`#${l.id}`} className={`nm ${activeSection === l.id ? 'active' : ''}`} style={{ padding:'8px 14px', borderRadius:8, fontSize:13, textDecoration:'none', color: activeSection === l.id ? '#fff' : C.textMuted, background: activeSection === l.id ? `${C.gold}22` : 'transparent', transition:'all 0.2s', fontWeight: activeSection === l.id ? 700 : 500, position:'relative' }}>{l.label}</a>
          ))}
        </nav>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Auth */}
          {authUser ? (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <button onClick={() => { setShowProfile(true); fetchProfile(authToken!) }} style={{ padding:'6px 14px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'none', color:C.text, cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${C.gold}22`} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
                <User size={14} color={C.gold} /> {authUser.name}
              </button>
              <button onClick={doLogout} style={{ padding:6, borderRadius:8, background:'rgba(255,255,255,0.06)', border:'none', color:C.textDim, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                onMouseEnter={e => e.currentTarget.style.background = `${C.error}22`} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}><LogOut size={16} /></button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)} style={{ padding:'6px 14px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'none', color:C.textMuted, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = `${C.gold}22`} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
              <LogIn size={14} /> دخول
            </button>
          )}

          {/* Cart */}
          <div style={{ position:'relative', cursor:'pointer' }} onClick={() => { setCartOpen(true); if (authToken && !profileLoading) fetchProfile(authToken) }}>
            <div style={{ padding:'8px 12px', borderRadius:10, background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = `${C.gold}22`} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
              <ShoppingCart size={16} color={C.gold} />
              {cartUnpaidCount > 0 && <span style={{ color:C.gold, fontWeight:700, fontSize:12 }}>{cartUnpaidCount}</span>}
            </div>
          </div>

          {/* Install App */}
          <button onClick={openCustomerApp} className="app-dl-btn" style={{ padding:'6px 12px', borderRadius:10, background:`${C.gold}18`, border:`1px solid ${C.gold}33`, color:C.gold, cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5, transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${C.gold}33`; e.currentTarget.style.borderColor = `${C.gold}55` }}
            onMouseLeave={e => { e.currentTarget.style.background = `${C.gold}18`; e.currentTarget.style.borderColor = `${C.gold}33` }}>
            📱 تحميل التطبيق
          </button>

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="mb dm" style={{ display:'none', background:'none', border:'none', color:'#fff', cursor:'pointer', padding:6, fontSize:22 }}>{mobileOpen ? <X size={20} /> : '☰'}</button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && <div style={{ padding:'12px 20px 16px', borderTop:`1px solid ${C.border}`, background: C.navyCard, maxHeight:'80vh', overflowY:'auto' }}>
        {navLinks.map(l => (
          <a key={l.id} href={`#${l.id}`} onClick={() => setMobileOpen(false)} style={{ display:'block', padding:'12px 14px', borderRadius:10, color:C.textMuted, textDecoration:'none', fontSize:14, fontWeight:500, transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = `${C.gold}15`} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{l.label}</a>
        ))}
        <a href="#services" onClick={() => setMobileOpen(false)} style={{ display:'block', padding:'12px 20px', borderRadius:10, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, textDecoration:'none', fontSize:14, fontWeight:700, textAlign:'center', marginTop:8 }}>احجز الآن</a>
        <button onClick={() => { setMobileOpen(false); openCustomerApp() }} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'12px 20px', borderRadius:10, background:`${C.gold}18`, border:`1px solid ${C.gold}44`, color:C.gold, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginTop:8 }}>
          📱 تحميل التطبيق
        </button>
      </div>}
    </header>

    {/* ───── Hero ───── */}
    <section id="hero" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>

      {/* ── خلفية البانر: صورة من الإدارة أو gradient افتراضي ── */}
      {activeBanner?.image_url ? (
        <>
          <img src={activeBanner.image_url} alt="" className="banner-img" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 30%' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(7,27,59,0.75) 0%, rgba(5,18,42,0.55) 50%, rgba(7,27,59,0.82) 100%)' }} />
        </>
      ) : (
        <>
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,#071B3B 0%,#0a2647 40%,#071B3B 100%)` }} />
          {/* Decorative elements — تظهر فقط بدون صورة بانر */}
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'60vw', height:'60vw', maxWidth:700, maxHeight:700, borderRadius:'50%', background:`radial-gradient(circle at center, ${C.gold}15 0%, ${C.gold}08 30%, transparent 60%)`, pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'40vw', height:'40vw', maxWidth:500, maxHeight:500, borderRadius:'50%', background:`radial-gradient(circle at center, ${C.gold}22 0%, ${C.gold}0a 35%, transparent 55%)`, pointerEvents:'none', animation:'lg 4s ease-in-out infinite' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'50vw', height:'50vw', maxWidth:600, maxHeight:600, borderRadius:'50%', border:`1px solid ${C.gold}08`, pointerEvents:'none', animation:'sp 50s linear infinite' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'30vw', height:'30vw', maxWidth:360, maxHeight:360, borderRadius:'50%', border:`1px solid ${C.gold}06`, pointerEvents:'none', animation:'sp 35s linear infinite reverse' }} />
        </>
      )}

      {/* ── محتوى الـ Hero ── */}
      <div className="hero-cnt" style={{ textAlign:'center', padding:'120px 24px 80px', position:'relative', zIndex:1, maxWidth:780, width:'100%' }}>

        {/* اللوجو */}
        <AS>
          <div style={{ position:'relative', display:'inline-block', marginBottom:activeBanner?.image_url ? 20 : 28, animation:'lf 7s ease-in-out infinite' }}>
            <div style={{ padding: activeBanner?.image_url ? 6 : 8, borderRadius:'50%', background:'rgba(255,255,255,0.06)', backdropFilter:'blur(20px)', border:`1px solid ${C.gold}22`, boxShadow:`0 0 40px ${C.gold}22, 0 20px 60px rgba(0,0,0,0.4)` }}>
              {salon?.logo_url ? (
                <img src={salon.logo_url} alt={salon?.name||''} style={{ width: activeBanner?.image_url ? 'clamp(90px,14vw,140px)' : 'clamp(140px,22vw,220px)', height: activeBanner?.image_url ? 'clamp(90px,14vw,140px)' : 'clamp(140px,22vw,220px)', borderRadius:'50%', objectFit:'cover', display:'block' }} />
              ) : (
                <div style={{ width:'clamp(120px,20vw,200px)', height:'clamp(120px,20vw,200px)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'clamp(50px,9vw,90px)', background:`${C.gold}0a`, border:`1px solid ${C.gold}22` }}>✨</div>
              )}
            </div>
          </div>
        </AS>

        {/* اسم الصالون / عنوان البانر */}
        <AS d={0.08}>
          <h1 style={{ fontSize:'clamp(28px,5.5vw,58px)', fontWeight:900, color:'#fff', marginBottom:10, letterSpacing:'-0.02em', lineHeight:1.15, textShadow: activeBanner?.image_url ? '0 2px 20px rgba(0,0,0,0.5)' : 'none' }}>
            {activeBanner?.title_ar || salon?.name || 'لمسة الملكة'}
          </h1>
          <div style={{ width:64, height:3, background:`linear-gradient(90deg,transparent,${C.gold},transparent)`, margin:'14px auto', borderRadius:2 }} />
          <p style={{ fontSize:'clamp(15px,2.2vw,22px)', color:C.goldLight, fontWeight:400, marginBottom:activeBanner?.subtitle_ar ? 10 : 0, letterSpacing:'0.01em', textShadow: activeBanner?.image_url ? '0 1px 12px rgba(0,0,0,0.4)' : 'none' }}>
            {activeBanner?.subtitle_ar || salon?.description_ar || 'صالون تجميل راقي'}
          </p>
          {!activeBanner?.subtitle_ar && !salon?.description_ar && (
            <p style={{ color:'rgba(248,248,248,0.45)', fontSize:14, maxWidth:460, margin:'0 auto 0', lineHeight:1.8 }}>للرجال والنساء — خدمات التجميل والعناية في أجواء فاخرة</p>
          )}
        </AS>

        {/* أزرار الـ CTA */}
        <AS d={0.18}>
          <div className="hero-btns" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginTop:36 }}>
            {activeBanner?.cta_text_ar ? (
              <a href={activeBanner.cta_action === 'book' ? '#departments' : activeBanner.cta_action === 'whatsapp' ? `https://wa.me/${salon?.whatsapp_number || ''}` : (activeBanner.cta_link || '#departments')}
                target={activeBanner.cta_link && activeBanner.cta_action === 'link' ? '_blank' : undefined}
                style={{ padding:'14px 38px', borderRadius:14, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:'#071B3B', fontWeight:700, fontSize:15, textDecoration:'none', boxShadow:`0 8px 32px ${C.goldGlow}`, transition:'all 0.3s' }}>
                {activeBanner.cta_text_ar}
              </a>
            ) : (
              <a href="#departments" style={{ padding:'14px 38px', borderRadius:14, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:'#071B3B', fontWeight:700, fontSize:15, textDecoration:'none', boxShadow:`0 8px 32px ${C.goldGlow}`, transition:'all 0.3s' }}>
                استعرض الأقسام
              </a>
            )}
            <a href="#contact" style={{ padding:'14px 38px', borderRadius:14, border:`1px solid ${C.gold}44`, background:'rgba(255,255,255,0.06)', backdropFilter:'blur(8px)', color:'#F8F8F8', fontWeight:600, fontSize:15, textDecoration:'none', transition:'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor=`${C.gold}77` }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor=`${C.gold}44` }}>
              اتصل بنا
            </a>
          </div>
        </AS>
      </div>

      {/* gradient fade للأسفل */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:120, background:`linear-gradient(to top,${C.navy},transparent)`, zIndex:1 }} />
    </section>

    {/* ───────────────── Departments ───────────────── */}
    <section id="departments" data-s="departments" style={{ padding:'90px 20px 60px', maxWidth:1240, margin:'0 auto' }}>
      <AS><div style={{ textAlign:'center', marginBottom:44 }}>
        <span style={{ display:'inline-block', padding:'6px 22px', borderRadius:20, background:`${C.gold}15`, color:C.gold, fontSize:12, fontWeight:700, marginBottom:12 }}>✦ تصفح أقسامنا</span>
        <h2 style={{ fontSize:'clamp(26px,4vw,44px)', fontWeight:900, color:'#fff', marginBottom:8, letterSpacing:'-0.02em' }}>أقسام الصالون</h2>
        <p style={{ color:C.textMuted, fontSize:15, maxWidth:520, margin:'0 auto 32px', lineHeight:1.9 }}>اختر القسم الذي يناسبك لاستعراض جميع خدماته ومنتجاته</p>
        {/* Search */}
        <div style={{ maxWidth:480, margin:'0 auto', position:'relative' }}>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="ابحث عن قسم..." style={{ width:'100%', padding:'13px 46px 13px 18px', borderRadius:14, border:`1px solid ${searchQ ? C.gold+'66' : C.border}`, background:C.navyCard, color:C.text, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border 0.25s' }}
            onFocus={e => e.currentTarget.style.borderColor=`${C.gold}66`}
            onBlur={e => { if(!searchQ) e.currentTarget.style.borderColor=C.border }} />
          <span style={{ position:'absolute', left:15, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none' }}>🔍</span>
        </div>
      </div></AS>

      {depts.length === 0 && (
        <AS d={0.1}><div style={{ textAlign:'center', padding:'60px 0', color:C.textDim, fontSize:14 }}>
          {searchQ ? `لا توجد نتائج لـ "${searchQ}"` : 'لا توجد أقسام متاحة حالياً'}
        </div></AS>
      )}

      <div className="dept-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:24 }}>
        {depts.map((d:Dept, i:number) => (
          <AS key={d.id} d={i*0.07}>
            <a href={d.slug ? `/departments/${d.slug}` : '#'} style={{ textDecoration:'none', display:'block' }}>
              <div style={{ borderRadius:22, overflow:'hidden', position:'relative', height:250, cursor:'pointer', transition:'all 0.4s cubic-bezier(0.16,1,0.3,1)', border:`1px solid ${C.border}` }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-10px)'; e.currentTarget.style.borderColor=`${C.gold}55`; e.currentTarget.style.boxShadow=`0 24px 64px rgba(212,164,55,0.14)` }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.boxShadow='none' }}>
                {/* Background */}
                <img
                  src={d.image_url || `/api/placeholder?name=${encodeURIComponent(d.name_ar)}&icon=${encodeURIComponent(d.icon||'💎')}&type=dept&slug=${encodeURIComponent(d.slug||'')}`}
                  alt="" style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0, transition:'transform 0.6s ease' }} />
                {/* Overlay */}
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(7,27,59,0.96) 0%,rgba(7,27,59,0.45) 55%,rgba(7,27,59,0.05) 100%)' }} />
                {/* Shimmer */}
                <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 80% 10%,${C.gold}10 0%,transparent 60%)`, pointerEvents:'none' }} />
                {/* Icon */}
                {d.icon && <div style={{ position:'absolute', top:16, right:16, fontSize:34, filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>{d.icon}</div>}
                {/* Content */}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'22px 20px 20px' }}>
                  <h3 style={{ color:'#fff', fontSize:20, fontWeight:800, marginBottom:5, letterSpacing:'-0.01em' }}>{d.name_ar}</h3>
                  {d.description && <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.65, marginBottom:12, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>{d.description}</p>}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {d.service_count > 0 && <span style={{ padding:'3px 12px', borderRadius:20, background:`${C.gold}25`, color:C.goldLight, fontSize:11, fontWeight:600, backdropFilter:'blur(4px)', border:`1px solid ${C.gold}30` }}>{d.service_count} خدمة</span>}
                    {d.product_count > 0 && <span style={{ padding:'3px 12px', borderRadius:20, background:`${C.blue}25`, color:'#7fb3ff', fontSize:11, fontWeight:600, backdropFilter:'blur(4px)', border:`1px solid ${C.blue}30` }}>{d.product_count} منتج</span>}
                    <span style={{ marginRight:'auto', padding:'3px 14px', borderRadius:20, background:`${C.gold}`, color:C.navy, fontSize:11, fontWeight:700 }}>استعرض ←</span>
                  </div>
                </div>
              </div>
            </a>
          </AS>
        ))}
      </div>
    </section>

    {/* ───────────────── Featured Services ───────────────── */}
    {featuredServices && featuredServices.length > 0 && (
    <section id="featured" data-s="featured" style={{ padding:'80px 0', background:C.navyLight }}>
      <div style={{ maxWidth:1240, margin:'0 auto', padding:'0 20px' }}>
        <AS><div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:36, flexWrap:'wrap', gap:12 }}>
          <div>
            <span style={{ display:'inline-block', padding:'4px 14px', borderRadius:20, background:`${C.gold}15`, color:C.gold, fontSize:11, fontWeight:700, marginBottom:8 }}>⭐ مميزة</span>
            <h2 style={{ fontSize:'clamp(22px,3.5vw,36px)', fontWeight:900, color:'#fff', margin:0 }}>خدمات مختارة</h2>
          </div>
          <a href="#departments" style={{ color:C.gold, fontSize:13, textDecoration:'none', fontWeight:600, display:'flex', alignItems:'center', gap:4, opacity:0.8 }}>عرض كل الأقسام ←</a>
        </div></AS>
        <div style={{ display:'flex', gap:20, overflowX:'auto', paddingBottom:16, scrollbarWidth:'thin', scrollbarColor:`${C.gold}33 transparent` }}>
          {(featuredServices||[]).map((s:Service,i:number) => (
            <div key={s.id} style={{ minWidth:230, flexShrink:0 }}>
              <div style={{ borderRadius:18, background:C.navyCard, overflow:'hidden', border:`1px solid ${C.border}`, transition:'all 0.3s cubic-bezier(0.16,1,0.3,1)', height:'100%', display:'flex', flexDirection:'column' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=`${C.gold}44`; e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow=`0 16px 48px ${C.goldGlow}` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}>
                <div style={{ height:150, overflow:'hidden', position:'relative', flexShrink:0 }}>
                  <img src={s.image_url || `/api/placeholder?name=${encodeURIComponent(s.name_ar)}&icon=${encodeURIComponent(ICONS[i%ICONS.length])}&type=service`}
                    alt={s.name_ar} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 40%,rgba(19,32,58,0.7))' }} />
                </div>
                <div style={{ padding:'14px 16px 18px', flex:1, display:'flex', flexDirection:'column' }}>
                  <h3 style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:5, flex:1 }}>{s.name_ar}</h3>
                  <div style={{ fontSize:11, color:C.textDim, marginBottom:12, display:'flex', alignItems:'center', gap:3 }}><Clock size={10} /> {s.duration_min} دقيقة</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                    <span style={{ fontSize:17, fontWeight:800, color:C.gold }}>{s.price}<span style={{ fontSize:9, color:C.textDim, marginRight:2 }}> ر.س</span></span>
                    <button onClick={() => openBooking(s)} style={{ padding:'7px 16px', borderRadius:10, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, fontWeight:700, fontSize:11, border:'none', cursor:'pointer', transition:'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>احجز</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
    )}

    {/* ───────────────── Featured Products ───────────────── */}
    {featuredProducts && featuredProducts.length > 0 && (
    <section style={{ padding:'80px 20px', maxWidth:1240, margin:'0 auto' }}>
      <AS><div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:36, flexWrap:'wrap', gap:12 }}>
        <div>
          <span style={{ display:'inline-block', padding:'4px 14px', borderRadius:20, background:`${C.blue}15`, color:C.blue, fontSize:11, fontWeight:700, marginBottom:8 }}>⭐ مميزة</span>
          <h2 style={{ fontSize:'clamp(22px,3.5vw,36px)', fontWeight:900, color:'#fff', margin:0 }}>منتجات مختارة</h2>
        </div>
        <a href="#departments" style={{ color:C.blue, fontSize:13, textDecoration:'none', fontWeight:600, display:'flex', alignItems:'center', gap:4, opacity:0.8 }}>تسوقي حسب القسم ←</a>
      </div></AS>
      <div style={{ display:'flex', gap:18, overflowX:'auto', paddingBottom:16, scrollbarWidth:'thin', scrollbarColor:`${C.blue}33 transparent` }}>
        {(featuredProducts||[]).map((p:Product,i:number) => (
          <div key={p.id} style={{ minWidth:200, flexShrink:0 }}>
            <div style={{ borderRadius:18, background:C.navyCard, overflow:'hidden', border:`1px solid ${C.border}`, transition:'all 0.3s', display:'flex', flexDirection:'column' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=`${C.blue}44`; e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow=`0 14px 40px rgba(47,123,255,0.12)` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}>
              <div style={{ height:150, overflow:'hidden', flexShrink:0 }}>
                <img src={p.image_url || `/api/placeholder?name=${encodeURIComponent(p.name_ar)}&icon=${encodeURIComponent(PI[i%PI.length])}&type=product${p.brand?`&sub=${encodeURIComponent(p.brand)}`:''}`}
                  alt={p.name_ar} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.5s' }}
                  onMouseEnter={e => e.currentTarget.style.transform='scale(1.07)'}
                  onMouseLeave={e => e.currentTarget.style.transform='scale(1)'} />
              </div>
              <div style={{ padding:'12px 14px 16px', flex:1, display:'flex', flexDirection:'column', textAlign:'center' }}>
                <h3 style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:4 }}>{p.name_ar}</h3>
                {p.brand && <span style={{ display:'inline-block', padding:'1px 8px', borderRadius:8, background:`${C.blue}15`, color:C.blue, fontSize:10, fontWeight:600, marginBottom:6 }}>{p.brand}</span>}
                <div style={{ fontSize:16, fontWeight:800, color:C.gold, marginBottom:10, marginTop:'auto', paddingTop:6 }}>{p.price}<span style={{ fontSize:9, color:C.textDim }}> ر.س</span></div>
                <button onClick={() => addToCart(p)} style={{ padding:'8px 12px', borderRadius:10, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, fontWeight:700, fontSize:11, border:'none', cursor:'pointer', width:'100%', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}
                  onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                  <Plus size={11} /> أضف إلى السلة
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
    )}

    {/* ───────────────── Features / مميزاتنا ───────────────── */}
    {features && features.length > 0 && (
    <section id="features" data-s="features" style={{ padding:'90px 20px', background:C.navyLight }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <AS><div style={{ textAlign:'center', marginBottom:52 }}>
          <span style={{ display:'inline-block', padding:'6px 20px', borderRadius:20, background:`${C.gold}15`, color:C.gold, fontSize:12, fontWeight:700, marginBottom:10 }}>✦ مميزاتنا</span>
          <h2 style={{ fontSize:'clamp(24px,4vw,42px)', fontWeight:900, color:'#fff', marginBottom:8 }}>لماذا تختارنا؟</h2>
          <p style={{ color:C.textMuted, fontSize:14, maxWidth:480, margin:'0 auto', lineHeight:1.8 }}>نقدم لك تجربة تجميل استثنائية بأعلى معايير الجودة والرقي</p>
        </div></AS>

        <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:22 }}>
          {features.map((f: any, i: number) => (
            <AS key={f.id} d={i * 0.07}>
              <div style={{ padding:'30px 24px', borderRadius:20, background:C.navyCard, border:`1px solid ${C.border}`, textAlign:'center', transition:'all 0.35s cubic-bezier(0.16,1,0.3,1)', position:'relative', overflow:'hidden' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-8px)'; e.currentTarget.style.borderColor=`${C.gold}44`; e.currentTarget.style.boxShadow=`0 20px 56px rgba(212,164,55,0.1)` }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.boxShadow='none' }}>
                {/* Glow */}
                <div style={{ position:'absolute', top:-40, left:'50%', transform:'translateX(-50%)', width:120, height:120, borderRadius:'50%', background:`${C.gold}08`, pointerEvents:'none' }} />
                {/* Icon or Image */}
                <div style={{ width:72, height:72, borderRadius:18, background:`${C.gold}12`, border:`1px solid ${C.gold}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 18px', position:'relative', zIndex:1, overflow:'hidden', flexShrink:0 }}>
                  {f.image_url
                    ? <img src={f.image_url} alt={f.title_ar} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
                    : (f.icon || '✨')}
                </div>
                <h3 style={{ color:'#fff', fontSize:17, fontWeight:700, marginBottom:10 }}>{f.title_ar}</h3>
                {f.description_ar && (
                  <p style={{ color:C.textMuted, fontSize:13, lineHeight:1.8, margin:0 }}>{f.description_ar}</p>
                )}
              </div>
            </AS>
          ))}
        </div>
      </div>
    </section>
    )}

    {/* Offers */}
    <section id="offers" data-s="offers" style={{ padding:'100px 20px', maxWidth:1100, margin:'0 auto' }}>
      <AS><div style={{ textAlign:'center', marginBottom:50 }}>
        <span style={{ display:'inline-block', padding:'6px 20px', borderRadius:20, background:`${C.gold}15`, color:C.gold, fontSize:12, fontWeight:700, marginBottom:10 }}>✦ عروض خاصة</span>
        <h2 style={{ fontSize:'clamp(26px,4vw,38px)', fontWeight:900, color:'#fff', marginBottom:8 }}>الباقات والعروض الحصرية</h2>
        <p style={{ color:C.textMuted, fontSize:14, maxWidth:480, margin:'0 auto', lineHeight:1.8 }}>عروض مميزة بأسعار تنافسية لفترة محدودة</p>
      </div></AS>
      <div className="offers-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
        {(offers||[]).map((o:Offer,i:number) => {
          const discount = o.original_price > 0 && o.offer_price > 0 ? Math.round((1 - o.offer_price / o.original_price) * 100) : 0
          const ctaAction = () => {
            const action = o.cta_action || 'book'
            if (action === 'whatsapp') { window.open(`https://wa.me/${o.whatsapp_number || salon?.whatsapp_number || ''}?text=${encodeURIComponent(o.whatsapp_message || 'مرحباً، أرغب بالحجز')}`, '_blank') }
            else if (action === 'link' && o.cta_link) { window.open(o.cta_link, '_blank') }
            else { 
              const linkedService = o.linked_service_id ? services?.find((sv:Service) => sv.id === o.linked_service_id) : null
              if (linkedService) openBooking(linkedService)
            }
          }
          return (
          <AS key={o.id} d={i*0.08}>
            <div className="oc" style={{ borderRadius:20, background:C.navyCard, overflow:'hidden', display:'flex', flexDirection:'column' }}>

              {/* ── صورة العرض دائمة (حقيقية أو placeholder) ── */}
              <div style={{ position:'relative', height:200, overflow:'hidden', flexShrink:0 }}>
                <img
                  src={o.image_url || `/api/placeholder?name=${encodeURIComponent(o.title_ar)}&icon=🏷️&type=dept`}
                  alt={o.title_ar}
                  loading="lazy"
                  style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.5s ease' }}
                  onMouseEnter={e => e.currentTarget.style.transform='scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                />
                {/* Gradient overlay */}
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 30%, rgba(10,22,40,0.85))' }} />

                {/* Badges على الصورة */}
                {o.badge && (
                  <div style={{ position:'absolute', top:12, right:12, background: o.badge==='الأكثر طلباً' ? C.error : o.badge==='أفضل قيمة' ? C.success : C.gold, color:'#fff', fontSize:10, fontWeight:700, padding:'3px 12px', borderRadius:14, backdropFilter:'blur(4px)' }}>
                    {o.badge}
                  </div>
                )}
                {discount > 0 && (
                  <div style={{ position:'absolute', top:12, left:12, background:C.error, color:'#fff', fontSize:11, fontWeight:800, padding:'4px 12px', borderRadius:8 }}>
                    -{discount}%
                  </div>
                )}

                {/* السعر على الصورة */}
                <div style={{ position:'absolute', bottom:12, right:14, display:'flex', alignItems:'baseline', gap:6 }}>
                  <span style={{ fontSize:24, fontWeight:900, color:'#fff' }}>{o.offer_price}</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.75)' }}>ر.س</span>
                  {o.original_price > 0 && <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', textDecoration:'line-through' }}>{o.original_price}</span>}
                </div>
              </div>

              {/* ── محتوى العرض ── */}
              <div style={{ padding:'18px 20px 22px', flex:1, display:'flex', flexDirection:'column' }}>
                <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:5 }}>{o.title_ar}</h3>
                {o.description_ar && <p style={{ fontSize:12, color:C.textMuted, marginBottom:12, lineHeight:1.75, flex:1 }}>{o.description_ar}</p>}

                <div style={{ fontSize:11, color:C.textDim, display:'flex', alignItems:'center', gap:4, flexWrap:'wrap', marginBottom:10 }}>
                  <Calendar size={11} />
                  صالح حتى: {o.valid_until ? new Date(o.valid_until).toLocaleDateString('ar-SA', {year:'numeric',month:'long',day:'numeric'}) : 'غير محدد'}
                  {o.countdown_end && <> · <span style={{ color:C.error }}>⏳ {Math.max(0, Math.ceil((new Date(o.countdown_end).getTime() - Date.now()) / (1000*60*60*24)))} يوم</span></>}
                </div>

                {/* معرض الصور المصغّرة */}
                {o.gallery && o.gallery.length > 0 && (
                  <div style={{ display:'flex', gap:5, marginBottom:10, flexWrap:'wrap' }}>
                    {o.gallery.slice(0,5).map((url,j) => (
                      <img key={j} src={url} alt="" loading="lazy"
                        style={{ width:46, height:46, borderRadius:8, objectFit:'cover', border:`1px solid ${C.border}`, cursor:'pointer' }} />
                    ))}
                  </div>
                )}

                {/* صور قبل وبعد */}
                {o.before_after && o.before_after.length > 0 && (
                  <div style={{ marginBottom:10 }}>
                    <span style={{ fontSize:11, color:C.textDim, display:'block', marginBottom:5, fontWeight:500 }}>📸 قبل وبعد</span>
                    <div style={{ display:'flex', gap:5 }}>
                      {o.before_after.slice(0,2).map((url,j) => (
                        <div key={j} style={{ flex:1, position:'relative' }}>
                          <img src={url} alt="" loading="lazy" style={{ width:'100%', height:72, borderRadius:8, objectFit:'cover' }} />
                          <span style={{ position:'absolute', bottom:4, right:4, background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:9, padding:'1px 6px', borderRadius:6 }}>
                            {j===0?'قبل':'بعد'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* زر CTA */}
                {o.cta_text && (
                  <button onClick={ctaAction}
                    style={{ marginTop:'auto', paddingTop: o.gallery?.length || o.before_after?.length ? 0 : 4, width:'100%', padding:'11px 20px', borderRadius:10, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, fontWeight:700, fontSize:13, border:'none', cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${C.goldGlow}` }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}>
                    {o.cta_text}
                  </button>
                )}
              </div>
            </div>
          </AS>
        )})}
      </div>
    </section>

    {/* ───────────────── Ads / Videos ───────────────── */}
    {ads && ads.length > 0 && (
    <section id="ads" data-s="ads" style={{ padding:'90px 20px', background:C.navyLight }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <AS><div style={{ textAlign:'center', marginBottom:48 }}>
          <span style={{ display:'inline-block', padding:'6px 20px', borderRadius:20, background:`${C.blue}15`, color:C.blue, fontSize:12, fontWeight:700, marginBottom:10 }}>▶ إعلانات ومقاطع</span>
          <h2 style={{ fontSize:'clamp(24px,4vw,38px)', fontWeight:900, color:'#fff', marginBottom:8 }}>شاهد أحدث مقاطعنا</h2>
          <p style={{ color:C.textMuted, fontSize:14, maxWidth:480, margin:'0 auto', lineHeight:1.8 }}>اكتشف أحدث أعمالنا وخدماتنا من خلال مقاطعنا المرئية</p>
        </div></AS>

        <div className="ads-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:22 }}>
          {ads.map((a: Ad, i: number) => (
            <AS key={a.id} d={i * 0.07}>
              <div style={{ borderRadius:18, background:C.navyCard, overflow:'hidden', border:`1px solid ${C.border}`, transition:'all 0.35s cubic-bezier(0.16,1,0.3,1)', cursor:'pointer' }}
                onClick={() => window.open(a.youtube_url || `https://www.youtube.com/watch?v=${a.youtube_id}`, '_blank')}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-8px)'; e.currentTarget.style.borderColor=`${C.blue}44`; e.currentTarget.style.boxShadow=`0 20px 56px rgba(47,123,255,0.14)` }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.boxShadow='none' }}>

                {/* Thumbnail */}
                <div style={{ position:'relative', paddingTop:'56.25%', overflow:'hidden', background:'#000' }}>
                  <img
                    src={a.image_url || `https://img.youtube.com/vi/${a.youtube_id}/hqdefault.jpg`}
                    alt={a.title_ar}
                    loading="lazy"
                    style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.5s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                  />
                  {/* Overlay */}
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(10,22,40,0.6) 100%)' }} />
                  {/* Play button */}
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', border:'2px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.25s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.3)'; e.currentTarget.style.transform='translate(-50%,-50%) scale(1.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.15)'; e.currentTarget.style.transform='translate(-50%,-50%) scale(1)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ marginRight:'-3px' }}>
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  {/* YouTube badge */}
                  <div style={{ position:'absolute', bottom:10, left:10, display:'flex', alignItems:'center', gap:5, background:'rgba(255,0,0,0.85)', borderRadius:6, padding:'3px 8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M23.5 6.19a3 3 0 0 0-2.1-2.1C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.4.59a3 3 0 0 0-2.1 2.1A31.1 31.1 0 0 0 0 12a31.1 31.1 0 0 0 .5 5.81A3 3 0 0 0 2.6 19.9c1.86.59 9.4.59 9.4.59s7.54 0 9.4-.59a3 3 0 0 0 2.1-2.09A31.1 31.1 0 0 0 24 12a31.1 31.1 0 0 0-.5-5.81zM9.75 15.52V8.48L15.85 12l-6.1 3.52z"/></svg>
                    <span style={{ color:'#fff', fontSize:10, fontWeight:700 }}>YouTube</span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding:'16px 18px 20px' }}>
                  <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:5, lineHeight:1.4 }}>{a.title_ar}</h3>
                  {a.description_ar && (
                    <p style={{ fontSize:12, color:C.textMuted, lineHeight:1.7, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>
                      {a.description_ar}
                    </p>
                  )}
                  <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:6, color:C.blue, fontSize:12, fontWeight:600 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    مشاهدة المقطع
                  </div>
                </div>
              </div>
            </AS>
          ))}
        </div>
      </div>
    </section>
    )}

    {/* Reviews */}
    {reviews && reviews.length > 0 && (
    <section id="reviews" style={{ padding:'100px 20px', background: C.navyLight }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <AS><div style={{ textAlign:'center', marginBottom:50 }}>
          <span style={{ display:'inline-block', padding:'6px 20px', borderRadius:20, background:`${C.gold}15`, color:C.gold, fontSize:12, fontWeight:700, marginBottom:10 }}>✦ آراء العملاء</span>
          <h2 style={{ fontSize:'clamp(26px,4vw,38px)', fontWeight:900, color:'#fff', marginBottom:8 }}>ماذا يقولون عنا</h2>
          <p style={{ color:C.textMuted, fontSize:14, maxWidth:480, margin:'0 auto', lineHeight:1.8 }}>نفخر بثقة عملائنا ونسعى دائماً لتقديم الأفضل</p>
        </div></AS>
        <div className="offers-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
          {reviews.map((r: Review, i: number) => (
            <AS key={r.id} d={i*0.08}>
              <div style={{ padding:'24px', borderRadius:18, background: C.navyCard, border:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  {r.customer_avatar ? <img src={r.customer_avatar} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} /> :
                    <div style={{ width:44, height:44, borderRadius:'50%', background:`${C.gold}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>👤</div>}
                  <div>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:14 }}>{r.customer_name}</div>
                    <div style={{ fontSize:12, color:C.gold }}>{'⭐'.repeat(r.rating)}</div>
                  </div>
                </div>
                <p style={{ color:C.textMuted, fontSize:13, lineHeight:1.8, margin:0 }}>"{r.comment_ar}"</p>
              </div>
            </AS>
          ))}
        </div>
      </div>
    </section>
    )}

    {/* ─── Contact ─── */}
    <section id="contact" data-s="contact" style={{ padding:'90px 20px', background:C.navyLight }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <AS><div style={{ textAlign:'center', marginBottom:48 }}>
          <span style={{ display:'inline-block', padding:'6px 20px', borderRadius:20, background:`${C.gold}15`, color:C.gold, fontSize:12, fontWeight:700, marginBottom:10 }}>✦ اتصل بنا</span>
          <h2 style={{ fontSize:'clamp(24px,4vw,38px)', fontWeight:900, color:'#fff', marginBottom:6 }}>نحن هنا لخدمتك</h2>
          <p style={{ color:C.textMuted, fontSize:14, lineHeight:1.8, maxWidth:480, margin:'0 auto' }}>تواصل معنا عبر أي من القنوات التالية</p>
        </div></AS>

        <div className="contact-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, alignItems:'start' }}>

          {/* ── بيانات التواصل ── */}
          <AS d={0.05}>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { label:'الهاتف', value:salon?.phone, href:`tel:${salon?.phone}`, icon:'📞' },
                { label:'البريد الإلكتروني', value:salon?.email, href:`mailto:${salon?.email}`, icon:'✉️' },
                { label:'العنوان', value:salon?.address, icon:'📍' },
                { label:'مواعيد العمل', value:salon?.working_hours, icon:'🕐' },
              ].filter(c => c.value).map((c,i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'16px 18px', borderRadius:14, background:C.navyCard, border:`1px solid ${C.border}`, transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=`${C.gold}44`; e.currentTarget.style.transform='translateX(-4px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform='translateX(0)' }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:`${C.gold}12`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize:11, color:C.textDim, marginBottom:3, fontWeight:500 }}>{c.label}</div>
                    {c.href
                      ? <a href={c.href} style={{ color:C.gold, fontWeight:600, fontSize:14, textDecoration:'none' }}>{c.value}</a>
                      : <span style={{ color:C.text, fontWeight:600, fontSize:14 }}>{c.value}</span>}
                  </div>
                </div>
              ))}

              {/* واتساب */}
              {(salon?.whatsapp_number || whatsapp?.number) && (
                <a href={`https://wa.me/${salon?.whatsapp_number || whatsapp?.number}?text=${encodeURIComponent(salon?.whatsapp_message || whatsapp?.message || 'مرحباً')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px', borderRadius:14, background:'#25D36612', border:'1px solid #25D36633', color:'#25D366', textDecoration:'none', fontWeight:700, fontSize:14, transition:'all 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#25D36620';e.currentTarget.style.borderColor='#25D36655'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#25D36612';e.currentTarget.style.borderColor='#25D36633'}}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  تواصل عبر واتساب
                </a>
              )}

              {/* Social links */}
              {social_links && social_links.length > 0 && (
                <div>
                  <div style={{ fontSize:12, color:C.textDim, marginBottom:10, fontWeight:500 }}>وسائل التواصل الاجتماعي</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {social_links.map((link: any, i: number) => {
                      const icons: Record<string,string> = { instagram:'📸', twitter:'🐦', snapchat:'👻', tiktok:'🎵', facebook:'📘', youtube:'▶️', linkedin:'💼', whatsapp:'💬', telegram:'✈️', custom:'🔗' }
                      const labels: Record<string,string> = { instagram:'Instagram', twitter:'Twitter', snapchat:'Snapchat', tiktok:'TikTok', facebook:'Facebook', youtube:'YouTube', linkedin:'LinkedIn', whatsapp:'WhatsApp', telegram:'Telegram', custom:'رابط' }
                      return (
                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" title={labels[link.platform]}
                          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, color:C.textMuted, fontSize:12, textDecoration:'none', transition:'all 0.2s' }}
                          onMouseEnter={e=>{e.currentTarget.style.background=`${C.gold}18`;e.currentTarget.style.borderColor=`${C.gold}44`;e.currentTarget.style.color='#fff'}}
                          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMuted}}>
                          <span style={{ fontSize:14 }}>{icons[link.platform] || '🔗'}</span>
                          <span style={{ fontWeight:500 }}>{labels[link.platform] || link.platform}</span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </AS>

          {/* ── نموذج التواصل ── */}
          <AS d={0.15}>
            <div style={{ background:C.navyCard, borderRadius:20, padding:'28px 26px', border:`1px solid ${C.border}` }}>
              <h3 style={{ color:'#fff', fontSize:17, fontWeight:700, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                <Send size={16} color={C.gold} /> أرسل لنا رسالة
              </h3>
              <In label="الاسم" value={ctName} onChange={setCtName} icon={<User size={15} />} />
              <In label="رقم الجوال" value={ctPhone} onChange={setCtPhone} type="tel" placeholder="05XXXXXXXX" icon={<Phone size={15} />} />
              <In label="الرسالة" value={ctMsg} onChange={setCtMsg} rows={4} placeholder="اكتب رسالتك هنا..." />
              <Bt fullWidth onClick={submitContact} disabled={ctLoading} style={{ padding:'13px' }}>
                {ctLoading ? 'جاري الإرسال...' : 'إرسال الرسالة'}
              </Bt>
            </div>
          </AS>
        </div>
      </div>
    </section>

    {/* Confirm Dialog */}
    {confirmDlg && (
      <div style={{ position:'fixed', inset:0, zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
        onClick={()=>setConfirmDlg(null)}>
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)' }} />
        <div onClick={e=>e.stopPropagation()} style={{ position:'relative', background:C.navyCard, borderRadius:22, padding:'28px 26px', maxWidth:380, width:'100%', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 24px 64px rgba(0,0,0,0.5)', animation:'mi .25s ease' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(239,68,68,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:28 }}>
            {''}&#9888;{''}
          </div>
          <h3 style={{ color:'#fff', fontSize:17, fontWeight:700, textAlign:'center', marginBottom:8 }}>{confirmDlg.msg}</h3>
          {confirmDlg.sub && <p style={{ color:C.textMuted, fontSize:13, textAlign:'center', lineHeight:1.7, marginBottom:22 }}>{confirmDlg.sub}</p>}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setConfirmDlg(null)}
              style={{ flex:1, padding:'12px', borderRadius:12, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.06)', color:C.textMuted, cursor:'pointer', fontSize:14, fontFamily:'inherit', fontWeight:500 }}>
              إلغاء الأمر
            </button>
            <button onClick={()=>{ const fn=confirmDlg.onOk; setConfirmDlg(null); fn() }}
              style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:C.error, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14, fontFamily:'inherit' }}>
              {confirmDlg.label||'تأكيد'}
            </button>
          </div>
        </div>
      </div>
    )}

        {/* Floating WhatsApp */}
    {(salon?.whatsapp_number || whatsapp?.number) ? (
      <a href={`https://wa.me/${salon?.whatsapp_number || whatsapp?.number}?text=${encodeURIComponent(salon?.whatsapp_message || whatsapp?.message || 'مرحباً')}`} target="_blank" rel="noopener noreferrer" style={{ position:'fixed', bottom:24, left:24, zIndex:999, width:56, height:56, borderRadius:'50%', background:'#25D366', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(37,211,102,0.4)', transition:'all 0.3s', cursor:'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(37,211,102,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,211,102,0.4)' }}>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    ) : null}

    {/* Footer */}
    <footer style={{ background:C.navy, borderTop:`1px solid ${C.border}` }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'50px 20px 28px' }}>
        <div className="footer-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:32 }}>

          {/* ─ الصالون + Social Links ─ */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:14 }}>
              {salon?.logo_url
                ? <img src={salon.logo_url} alt="" style={{ height:34, width:34, borderRadius:8, objectFit:'cover' }} />
                : <span style={{ fontSize:24 }}>✨</span>}
              <span style={{ color:'#fff', fontWeight:800, fontSize:16 }}>{salon?.name || 'لمسة الملكة'}</span>
            </div>
            <p style={{ color:C.textMuted, fontSize:13, lineHeight:1.85, marginBottom:16 }}>
              {salon?.description_ar || 'صالون تجميل راقي'}
            </p>
            {/* Dynamic social links from settings — icon + name */}
            {social_links && social_links.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {social_links.map((link: any, i: number) => {
                  const icons:  Record<string,string> = { instagram:'📸', twitter:'🐦', snapchat:'👻', tiktok:'🎵', facebook:'📘', youtube:'▶️', linkedin:'💼', whatsapp:'💬', telegram:'✈️', custom:'🔗' }
                  const labels: Record<string,string> = { instagram:'Instagram', twitter:'Twitter / X', snapchat:'Snapchat', tiktok:'TikTok', facebook:'Facebook', youtube:'YouTube', linkedin:'LinkedIn', whatsapp:'WhatsApp', telegram:'Telegram', custom:'رابط مخصص' }
                  return (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'7px 13px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, color:C.textMuted, fontSize:13, textDecoration:'none', transition:'all 0.2s', width:'fit-content' }}
                      onMouseEnter={e => { e.currentTarget.style.background=`${C.gold}20`; e.currentTarget.style.borderColor=`${C.gold}44`; e.currentTarget.style.color='#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMuted }}>
                      <span style={{ fontSize:16 }}>{icons[link.platform] || '🔗'}</span>
                      <span style={{ fontWeight:500 }}>{labels[link.platform] || link.platform}</span>
                    </a>
                  )
                })}
              </div>
            ) : (
              /* Fallback to old fields if no dynamic links */
              <div style={{ display:'flex', gap:7 }}>
                {salon?.instagram && <a href={`https://instagram.com/${salon.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, textDecoration:'none', transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.background=`${C.gold}22`;e.currentTarget.style.borderColor=`${C.gold}44`}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor=C.border}}>📸</a>}
                {salon?.twitter && <a href={`https://x.com/${salon.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, textDecoration:'none', transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.background=`${C.gold}22`;e.currentTarget.style.borderColor=`${C.gold}44`}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor=C.border}}>🐦</a>}
                {salon?.snapchat && <a href={`https://snapchat.com/add/${salon.snapchat.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, textDecoration:'none', transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.background=`${C.gold}22`;e.currentTarget.style.borderColor=`${C.gold}44`}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor=C.border}}>👻</a>}
              </div>
            )}
          </div>

          {/* ─ روابط سريعة ─ */}
          <div>
            <h4 style={{ color:'#fff', fontWeight:700, fontSize:14, marginBottom:14 }}>روابط سريعة</h4>
            {navLinks.map((l, i) => (
              <a key={i} href={`#${l.id}`} style={{ display:'block', color:C.textMuted, fontSize:13, padding:'4px 0', textDecoration:'none', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color=C.gold; e.currentTarget.style.paddingRight='5px' }}
                onMouseLeave={e => { e.currentTarget.style.color=C.textMuted; e.currentTarget.style.paddingRight='0' }}>
                {l.label}
              </a>
            ))}
          </div>

          {/* ─ إجراء سريع ─ */}
          <div>
            <h4 style={{ color:'#fff', fontWeight:700, fontSize:14, marginBottom:14 }}>إجراء سريع</h4>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <a href="#contact" style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:11, background:`${C.gold}12`, border:`1px solid ${C.gold}22`, color:C.gold, fontSize:13, fontWeight:600, textDecoration:'none', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.background=`${C.gold}22`}} onMouseLeave={e=>{e.currentTarget.style.background=`${C.gold}12`}}>
                <Send size={14}/> أرسل لنا رسالة
              </a>
              <a href="#departments" style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:11, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, color:C.textMuted, fontSize:13, textDecoration:'none', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)'}}>
                🏷️ تصفح الأقسام
              </a>
              {(salon?.whatsapp_number || whatsapp?.number) && (
                <a href={`https://wa.me/${salon?.whatsapp_number || whatsapp?.number}?text=${encodeURIComponent(salon?.whatsapp_message || whatsapp?.message || 'مرحباً')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:11, background:'#25D36614', border:'1px solid #25D36633', color:'#25D366', fontSize:13, fontWeight:600, textDecoration:'none', transition:'all 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#25D36622'}} onMouseLeave={e=>{e.currentTarget.style.background='#25D36614'}}>
                  💬 واتساب
                </a>
              )}
            </div>
          </div>

        </div>

        {/* ─ Bottom bar ─ */}
        <div className="footer-bar" style={{ marginTop:36, paddingTop:18, borderTop:`1px solid ${C.border}`, textAlign:'center' }}>
          <span style={{ color:C.textDim, fontSize:12 }}>
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()} — {salon?.name || 'لمسة الملكة'}
          </span>
        </div>
      </div>
    </footer>

    {/* Login Modal */}
    {showLogin && <Md onClose={() => setShowLogin(false)} title="تسجيل الدخول">
      <p style={{ color:C.textMuted, fontSize:13, marginBottom:16 }}>سجّلي دخولك لمتابعة الحجز والشراء</p>
      <In label="رقم الجوال" value={loginPhone} onChange={setLoginPhone} type="tel" placeholder="05XXXXXXXX" icon={<Phone size={15} />} />
      <In label="كلمة المرور" value={loginPass} onChange={setLoginPass} type="password" icon={<LogIn size={15} />} />
      <Bt fullWidth onClick={doLogin} disabled={authLoading} style={{ padding:'13px' }}>{authLoading ? 'جاري تسجيل الدخول...' : 'دخول'}</Bt>
      <div style={{ textAlign:'center', marginTop:14 }}>
        <span style={{ color:C.textDim, fontSize:13 }}>ليس لديك حساب؟ </span>
        <button onClick={() => { setShowLogin(false); setShowRegister(true) }} style={{ background:'none', border:'none', color:C.gold, cursor:'pointer', fontSize:13, fontWeight:600, textDecoration:'underline' }}>إنشاء حساب جديد</button>
      </div>
    </Md>}

    {/* Register Modal */}
    {showRegister && <Md onClose={() => setShowRegister(false)} title="إنشاء حساب جديد">
      <p style={{ color:C.textMuted, fontSize:13, marginBottom:16 }}>أنشئي حساباً لتتمكني من حجز المواعيد وشراء المنتجات</p>
      <In label="الاسم" value={regName} onChange={setRegName} icon={<User size={15} />} />
      <In label="رقم الجوال" value={regPhone} onChange={setRegPhone} type="tel" placeholder="05XXXXXXXX" icon={<Phone size={15} />} />
      <In label="كلمة المرور" value={regPass} onChange={setRegPass} type="password" icon={<LogIn size={15} />} />
      <Bt fullWidth onClick={doRegister} disabled={authLoading} style={{ padding:'13px' }}>{authLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}</Bt>
      <div style={{ textAlign:'center', marginTop:14 }}>
        <span style={{ color:C.textDim, fontSize:13 }}>لديك حساب بالفعل؟ </span>
        <button onClick={() => { setShowRegister(false); setShowLogin(true) }} style={{ background:'none', border:'none', color:C.gold, cursor:'pointer', fontSize:13, fontWeight:600, textDecoration:'underline' }}>تسجيل دخول</button>
      </div>
    </Md>}

    {/* Profile Modal */}
    {showProfile && <Md onClose={() => { setShowProfile(false); setModifyingBk(null); setPubDetail(null) }} title={`مرحباً ${authUser?.name || ''}`} wide>

      {/* User info bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, marginBottom:0 }}>
        <div style={{ width:42, height:42, borderRadius:'50%', background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:19, color:C.navy, flexShrink:0 }}>
          {(authUser?.name||'?').charAt(0)}
        </div>
        <div>
          <div style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{authUser?.name}</div>
          <div style={{ color:C.textDim, fontSize:12 }}>{authUser?.phone}</div>
        </div>
      </div>

      {/* Tabs: غير مدفوعة / مدفوعة */}
      <div style={{ display:'flex', marginTop:14, borderBottom:`1px solid ${C.border}`, marginBottom:16 }}>
        {([['unpaid','غير مدفوعة',profUnpaidBk.length+profUnpaidOr.length],['paid','مدفوعة',profPaidBk.length+profPaidOr.length]] as const).map(([k,l,cnt])=>(
          <button key={k} type="button" onClick={()=>{setProfileTab(k);setModifyingBk(null);setPubDetail(null)}}
            style={{ flex:1, padding:'12px 8px', background:'transparent', border:'none', borderBottom:profileTab===k?`3px solid ${C.gold}`:'3px solid transparent', marginBottom:-1, color:profileTab===k?C.gold:C.textMuted, fontWeight:profileTab===k?700:400, fontSize:14, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
            {l}
            {cnt>0&&<span style={{ background:profileTab===k?C.gold:'rgba(255,255,255,.12)', color:profileTab===k?C.navy:'#fff', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20 }}>{cnt}</span>}
          </button>
        ))}
      </div>

      {!profile
        ? <div style={{ textAlign:'center', padding:40, color:C.textDim }}>جاري التحميل...</div>
        : <>

          {/* ═══ TAB 1: غير مدفوعة ═══ */}
          {profileTab==='unpaid' && (
            <div>
              {profUnpaidBk.length===0 && profUnpaidOr.length===0
                ? <div style={{ textAlign:'center', padding:48 }}>
                    <div style={{ fontSize:52, marginBottom:10 }}>✅</div>
                    <p style={{ color:C.textDim }}>لا توجد مدفوعات معلقة</p>
                  </div>
                : <>
                    {profUnpaidBk.length>0&&<><p style={{ color:C.textDim, fontSize:12, fontWeight:600, marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>✂️ خدمات محجوزة</p>
                    {profUnpaidBk.map((b:any)=>{
                  const isActive = true
                  return (
                    <div key={b.id} style={{ borderRadius:16, background:C.navyCard, border:`1.5px solid ${C.gold}55`, marginBottom:12, overflow:'hidden' }}>
                      <div style={{ padding:'14px 16px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ color:'#fff', fontWeight:800, fontSize:15, marginBottom:4 }}>{b.service_name}</div>
                            <div style={{ fontSize:12, color:C.textDim }}>
                              {b.staff_name&&<span style={{ marginLeft:8 }}>👤 {b.staff_name}</span>}
                              {b.branch_name&&<span>🏢 {b.branch_name}</span>}
                            </div>
                          </div>
                          <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0, background:`${profBkClr(b.status)}22`, color:profBkClr(b.status) }}>
                            {profBkLbl[b.status]||b.status}
                          </span>
                        </div>

                        {/* Date + time row */}
                        <div style={{ display:'flex', gap:16, fontSize:12, color:C.textMuted, marginBottom:10 }}>
                          <span>📅 {new Date(b.date).toLocaleDateString('ar-SA',{weekday:'short',year:'numeric',month:'short',day:'numeric'})}</span>
                          <span>🕐 {b.start_time?.slice(0,5)}{b.end_time?` – ${b.end_time?.slice(0,5)}`:''}</span>
                        </div>

                        {/* Price row */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                          <span style={{ color:C.gold, fontWeight:800, fontSize:17 }}>
                            {Number(b.price||b.total||0).toLocaleString()} ر.س
                          </span>
                          {b.duration_min&&<span style={{ fontSize:11, color:C.textDim }}>⏱ {b.duration_min} دقيقة</span>}
                        </div>
                      </div>

                      {/* Actions for active bookings */}
                      {isActive&&(<div style={{ borderTop:`1px solid ${C.border}`, padding:'10px 14px' }}>
                        {modifyingBk?.id===b.id ? (
                          <div>
                            <div style={{ fontSize:12, color:C.textMuted, marginBottom:8 }}>اختر تاريخاً ووقتاً جديدَين:</div>
                            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                              <input type="date" value={modBkDate||b.date} min={new Date().toISOString().split('T')[0]} onChange={e=>setModBkDate(e.target.value)}
                                style={{ flex:1, padding:'8px 10px', borderRadius:9, border:`1px solid ${C.border}`, background:C.navy, color:C.text, fontSize:13, outline:'none', fontFamily:'inherit' }} />
                              <select value={modBkTime||b.start_time?.slice(0,5)} onChange={e=>setModBkTime(e.target.value)}
                                style={{ flex:1, padding:'8px 10px', borderRadius:9, border:`1px solid ${C.border}`, background:C.navy, color:C.text, fontSize:13, outline:'none', fontFamily:'inherit' }}>
                                {['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'].map(t=><option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div style={{ display:'flex', gap:8 }}>
                              <button type="button" onClick={()=>setModifyingBk(null)} style={{ flex:1, padding:'9px', borderRadius:10, background:'rgba(255,255,255,.07)', border:`1px solid ${C.border}`, color:C.textMuted, cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>إلغاء</button>
                              <button type="button" disabled={actionBusy} onClick={async()=>{
                                setActionBusy(true)
                                const r=await fetch('/api/public-my-bookings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:b.id,action:'modify',date:modBkDate||b.date,time:modBkTime||b.start_time?.slice(0,5)})})
                                const d=await r.json()
                                if(r.ok){setToast({msg:'تم تعديل الحجز ✓',type:'success'});setModifyingBk(null);fetchProfile(authToken!)}
                                else setToast({msg:d.error||'خطأ',type:'error'})
                                setActionBusy(false)
                              }} style={{ flex:2, padding:'9px', borderRadius:10, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, border:'none', color:C.navy, fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'inherit', opacity:actionBusy?.6:1 }}>
                                {actionBusy?'...':'✓ حفظ التعديل'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display:'flex', gap:8 }}>
                            <button type="button" onClick={()=>{setModifyingBk(b);setModBkDate(b.date);setModBkTime(b.start_time?.slice(0,5)||'')}}
                              style={{ flex:1, padding:'9px', borderRadius:10, background:`${C.blue}18`, border:`1px solid ${C.blue}44`, color:C.blue, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>
                              ✏️ تعديل الموعد
                            </button>
                            <button type="button" disabled={actionBusy} onClick={()=>askConfirm(
                              'إلغاء الحجز','هل أنت متأكد من إلغاء هذا الحجز؟',
                              async()=>{setActionBusy(true)
                                const r=await fetch('/api/public-my-bookings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:b.id,action:'cancel'})})
                                const d=await r.json()
                                if(r.ok){setToast({msg:'تم إلغاء الحجز',type:'success'});fetchProfile(authToken!)}
                                else setToast({msg:d.error||'خطأ',type:'error'})
                                setActionBusy(false)
                              },'إلغاء الحجز')}
                              style={{ flex:1, padding:'9px', borderRadius:10, background:`${C.error}15`, border:`1px solid ${C.error}44`, color:C.error, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', opacity:actionBusy?.6:1 }}>
                              ✕ إلغاء
                            </button>
                          </div>
                        )}
                      </div>)}
                    </div>
                  )
                })}</>}

                    {/* Unpaid orders */}
                    {profUnpaidOr.length>0&&<>
                      <p style={{ color:C.textDim, fontSize:12, fontWeight:600, marginBottom:10, marginTop:profUnpaidBk.length>0?16:0, display:'flex', alignItems:'center', gap:5 }}>📦 طلبات معلقة</p>
                      {profUnpaidOr.map((o:any)=>{
                        const items:any[]=Array.isArray(o.items)?o.items:[]
                        return (
                          <div key={o.id} style={{ borderRadius:16, background:C.navyCard, border:`1.5px solid ${C.gold}55`, marginBottom:12, overflow:'hidden' }}>
                            <div style={{ padding:'14px 16px' }}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                                <div><div style={{ color:'#fff', fontWeight:800, fontSize:14 }}>طلب #{String(o.id).slice(0,8).toUpperCase()}</div>
                                  <div style={{ fontSize:11, color:C.textDim, marginTop:2 }}>📅 {new Date(o.created_at).toLocaleDateString('ar-SA',{month:'short',day:'numeric'})}{o.branch_name&&` · 🏢 ${o.branch_name}`}</div></div>
                                <span style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:`${profOrClr(o.status)}22`, color:profOrClr(o.status) }}>{profOrLbl[o.status]||o.status}</span>
                              </div>
                              {items.length>0&&<div style={{ background:'rgba(255,255,255,.04)', borderRadius:10, padding:'8px 12px', marginBottom:10 }}>
                                {items.map((it:any,i:number)=><div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:i<items.length-1?`1px solid ${C.border}`:'none' }}><span style={{ color:'#fff' }}>{it.name} × {it.qty}</span><span style={{ color:C.gold, fontWeight:700 }}>{(Number(it.price||0)*it.qty).toLocaleString()} ر.س</span></div>)}
                              </div>}
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                                <span style={{ fontSize:11, fontWeight:700, color:'#F59E0B', background:'rgba(245,158,11,.15)', padding:'3px 10px', borderRadius:12 }}>○ معلق</span>
                                <span style={{ color:C.gold, fontWeight:900, fontSize:18 }}>{Number(o.total||0).toLocaleString()} ر.س</span>
                              </div>
                            </div>
                            <div style={{ borderTop:`1px solid ${C.border}`, padding:'10px 14px' }}>
                              <button type="button" disabled={actionBusy} onClick={()=>askConfirm('إلغاء الطلب','هل أنت متأكد؟',async()=>{setActionBusy(true);const r=await fetch('/api/public-my-orders',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:o.id,action:'cancel'})});const d=await r.json();if(r.ok){setToast({msg:'تم إلغاء الطلب ✓',type:'success'});fetchProfile(authToken!)}else setToast({msg:d.error||'خطأ',type:'error'});setActionBusy(false)},'إلغاء الطلب')}
                                style={{ width:'100%', padding:'10px', borderRadius:10, background:`${C.error}15`, border:`1px solid ${C.error}44`, color:C.error, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', opacity:actionBusy?.6:1 }}>✕ إلغاء الطلب</button>
                            </div>
                          </div>
                        )
                      })}
                    </>}
                  </>
            }
            </div>
          )}

          {/* ═══ TAB 2: مدفوعة ═══ */}
          {profileTab==='paid' && (
            <div>
              {profPaidBk.length===0 && profPaidOr.length===0
                ? <div style={{ textAlign:'center', padding:48 }}><div style={{ fontSize:52, marginBottom:10 }}>📭</div><p style={{ color:C.textDim }}>لا توجد طلبات مدفوعة بعد</p></div>
                : <>
                    {/* Paid bookings */}
                    {profPaidBk.length>0&&<>
                      <p style={{ color:C.textDim, fontSize:12, fontWeight:600, marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>✂️ خدمات تم سدادها</p>
                      {profPaidBk.map((b:any)=>(
                        <div key={b.id} style={{ borderRadius:16, background:C.navyCard, border:`1.5px solid ${C.success}55`, marginBottom:12, overflow:'hidden' }}>
                          <div style={{ padding:'14px 16px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                              <div style={{ flex:1 }}>
                                <div style={{ color:'#fff', fontWeight:800, fontSize:15, marginBottom:4 }}>{b.service_name}</div>
                                <div style={{ fontSize:12, color:C.textDim }}>{b.staff_name&&<span style={{ marginLeft:10 }}>👤 {b.staff_name}</span>}{b.branch_name&&<span>🏢 {b.branch_name}</span>}</div>
                              </div>
                              <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:`${C.success}22`, color:C.success, display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>✓ تم السداد</span>
                            </div>
                            <div style={{ display:'flex', gap:14, fontSize:12, color:C.textMuted, marginBottom:10 }}>
                              <span>📅 {new Date(b.date).toLocaleDateString('ar-SA',{weekday:'short',month:'short',day:'numeric'})}</span>
                              <span>🕐 {b.start_time?.slice(0,5)}{b.end_time?` – ${b.end_time.slice(0,5)}`:''}</span>
                              {b.duration_min&&<span>⏱ {b.duration_min}د</span>}
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                              <span style={{ color:C.gold, fontWeight:900, fontSize:18 }}>{Number(b.price||b.total||0).toLocaleString()} ر.س</span>
                              <button type="button" onClick={()=>{setPubDetailT('booking');setPubDetail(b)}}
                                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, color:C.text, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit' }}>👁 عرض التفاصيل</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>}
                    {/* Paid orders */}
                    {profPaidOr.length>0&&<>
                      <p style={{ color:C.textDim, fontSize:12, fontWeight:600, marginBottom:10, marginTop:profPaidBk.length>0?16:0, display:'flex', alignItems:'center', gap:5 }}>📦 طلبات مدفوعة</p>
                      {profPaidOr.map((o:any)=>{
                        const items:any[]=Array.isArray(o.items)?o.items:[]
                        return (
                          <div key={o.id} style={{ borderRadius:16, background:C.navyCard, border:`1.5px solid ${C.success}55`, marginBottom:12, overflow:'hidden' }}>
                            <div style={{ padding:'14px 16px' }}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                                <div><div style={{ color:'#fff', fontWeight:800, fontSize:14 }}>طلب #{String(o.id).slice(0,8).toUpperCase()}</div>
                                  <div style={{ fontSize:11, color:C.textDim, marginTop:2 }}>📅 {new Date(o.created_at).toLocaleDateString('ar-SA',{month:'short',day:'numeric'})}{o.branch_name&&` · 🏢 ${o.branch_name}`}</div></div>
                                <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:`${C.success}22`, color:C.success }}>✓ مدفوع</span>
                              </div>
                              {items.length>0&&<div style={{ background:'rgba(255,255,255,.04)', borderRadius:10, padding:'8px 12px', marginBottom:10 }}>
                                {items.slice(0,3).map((it:any,i:number)=><div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:i<Math.min(items.length,3)-1?`1px solid ${C.border}`:'none' }}><span style={{ color:'#fff' }}>{it.name} × {it.qty}</span><span style={{ color:C.gold, fontWeight:700 }}>{(Number(it.price||0)*it.qty).toLocaleString()} ر.س</span></div>)}
                                {items.length>3&&<div style={{ fontSize:11, color:C.textDim, marginTop:4 }}>+{items.length-3} منتجات أخرى</div>}
                              </div>}
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                                <span style={{ color:C.gold, fontWeight:900, fontSize:18 }}>{Number(o.total||0).toLocaleString()} ر.س</span>
                                <button type="button" onClick={()=>{setPubDetailT('order');setPubDetail(o)}}
                                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, color:C.text, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit' }}>👁 عرض التفاصيل</button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </>}
                  </>
            }
            </div>
          )}
        </>
      }

      {/* Detail modals */}
      {pubDetail&&pubDetailT==='booking'&&(
        <div onClick={()=>setPubDetail(null)} style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.navyCard, borderRadius:20, padding:26, maxWidth:400, width:'100%', border:`1px solid ${C.border}`, maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div><h3 style={{ color:'#fff', fontWeight:800, fontSize:17, margin:0 }}>تفاصيل الخدمة</h3><p style={{ color:C.textDim, fontSize:11, margin:'4px 0 0' }}>#{String(pubDetail.id).slice(0,8).toUpperCase()}</p></div>
              <button type="button" onClick={()=>setPubDetail(null)} style={{ background:'rgba(255,255,255,.08)', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18 }}>×</button>
            </div>
            <div style={{ background:`${C.gold}0f`, border:`1px solid ${C.gold}33`, borderRadius:12, padding:'12px 14px', marginBottom:14 }}>
              <div style={{ color:'#fff', fontWeight:800, fontSize:16, marginBottom:3 }}>{pubDetail.service_name}</div>
              {pubDetail.staff_name&&<div style={{ color:C.textDim, fontSize:12 }}>👤 {pubDetail.staff_name}</div>}
            </div>
            {[['📅','التاريخ',new Date(pubDetail.date).toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})],
              ['🕐','الوقت',`${pubDetail.start_time?.slice(0,5)||''}${pubDetail.end_time?` – ${pubDetail.end_time.slice(0,5)}`:''}`],
              ['🏢','الفرع',pubDetail.branch_name||'—'],
              ['⏱','المدة',pubDetail.duration_min?`${pubDetail.duration_min} دقيقة`:'—'],
            ].map(([e,l,v])=><div key={String(l)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}><span style={{ color:C.textDim, fontSize:13 }}>{e} {l}</span><span style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{v}</span></div>)}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:12, borderTop:`2px solid ${C.gold}` }}>
              <span style={{ color:C.textDim, fontWeight:600 }}>سعر الخدمة</span>
              <span style={{ color:C.gold, fontWeight:900, fontSize:22 }}>{Number(pubDetail.price||pubDetail.total||0).toLocaleString()} ر.س</span>
            </div>
            <button type="button" onClick={()=>setPubDetail(null)} style={{ width:'100%', marginTop:16, padding:'12px', borderRadius:12, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, border:'none', color:C.navy, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>إغلاق</button>
          </div>
        </div>
      )}
      {pubDetail&&pubDetailT==='order'&&(
        <div onClick={()=>setPubDetail(null)} style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.navyCard, borderRadius:20, padding:26, maxWidth:400, width:'100%', border:`1px solid ${C.border}`, maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div><h3 style={{ color:'#fff', fontWeight:800, fontSize:17, margin:0 }}>تفاصيل الطلب</h3><p style={{ color:C.textDim, fontSize:11, margin:'4px 0 0' }}>#{String(pubDetail.id).slice(0,10).toUpperCase()}</p></div>
              <button type="button" onClick={()=>setPubDetail(null)} style={{ background:'rgba(255,255,255,.08)', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18 }}>×</button>
            </div>
            {[['📅','التاريخ',new Date(pubDetail.created_at).toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})],
              ['🏢','الفرع',pubDetail.branch_name||'—'],
              ['💳','الدفع',pubDetail.payment_method==='bank_transfer'?'تحويل بنكي':pubDetail.payment_method==='direct_debit'?'خصم من حساب':'كاش'],
            ].map(([e,l,v])=><div key={String(l)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}><span style={{ color:C.textDim, fontSize:13 }}>{e} {l}</span><span style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{v}</span></div>)}
            <div style={{ marginTop:12 }}>
              <p style={{ color:C.textDim, fontSize:12, fontWeight:600, marginBottom:8 }}>📦 المنتجات</p>
              {(Array.isArray(pubDetail.items)?pubDetail.items:[]).map((it:any,i:number)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,.04)', borderRadius:10, padding:'9px 12px', marginBottom:6 }}>
                  <div><div style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{it.name}</div><div style={{ fontSize:11, color:C.textDim }}>{it.qty} × {Number(it.price||0).toLocaleString()} ر.س</div></div>
                  <span style={{ color:C.gold, fontWeight:700 }}>{(Number(it.price||0)*it.qty).toLocaleString()} ر.س</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, paddingTop:12, borderTop:`2px solid ${C.gold}` }}>
              <span style={{ color:C.textDim, fontWeight:600 }}>الإجمالي</span>
              <span style={{ color:C.gold, fontWeight:900, fontSize:22 }}>{Number(pubDetail.total||0).toLocaleString()} ر.س</span>
            </div>
            <button type="button" onClick={()=>setPubDetail(null)} style={{ width:'100%', marginTop:16, padding:'12px', borderRadius:12, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, border:'none', color:C.navy, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>إغلاق</button>
          </div>
        </div>
      )}
    </Md>}


    {/* Booking Modal */}
    {bkService && !bkDone && <Md onClose={() => setBkService(null)} title="حجز موعد">
      <div style={{ background:`${C.gold}0a`, borderRadius:12, padding:14, marginBottom:18, border:`1px solid ${C.gold}22` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <strong style={{ color:'#fff', fontSize:14 }}>{bkService.name_ar}</strong>
          <span style={{ color:C.gold, fontWeight:700, fontSize:16 }}>{bkService.price} <span style={{ fontSize:11, color:C.textDim }}>ر.س</span></span>
        </div>
        <div style={{ color:C.textDim, fontSize:13, marginTop:2, display:'flex', alignItems:'center', gap:4 }}><Clock size={12} /> {bkService.duration_min} دقيقة</div>
      </div>
      <div style={{ color:C.textMuted, fontSize:13, marginBottom:12 }}><User size={14} style={{ marginLeft:4 }} /> {authUser?.name}</div>
      <div style={{ color:C.textMuted, fontSize:13, marginBottom:16 }}><Phone size={14} style={{ marginLeft:4 }} /> {authUser?.phone}</div>
      <In label="اختيار التاريخ" value={bkDate} onChange={setBkDate} type="date" />
      {bkDate && <div style={{ marginBottom:16 }}>
        <label style={{ display:'block', color:C.textMuted, fontSize:13, marginBottom:6, fontWeight:500 }}>اختيار الوقت</label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(72px,1fr))', gap:6 }}>
          {genSlots().map(t => <button key={t} onClick={() => setBkTime(t)} style={{ padding:'8px 6px', borderRadius:8, border:`1px solid ${bkTime===t ? C.gold : C.border}`, background: bkTime===t ? `${C.gold}22` : 'transparent', color: bkTime===t ? C.gold : C.textMuted, fontSize:12, fontWeight: bkTime===t ? 700 : 400, cursor:'pointer', transition:'all 0.2s' }}>{t}</button>)}
        </div>
      </div>}
      <Bt fullWidth onClick={submitBooking} disabled={bkLoading} style={{ padding:'13px' }}>{bkLoading ? 'جاري الحجز...' : 'تأكيد الحجز'}</Bt>
    </Md>}

    {bkDone && <Md onClose={() => { setBkService(null); setBkDone(false) }} title="تم الحجز بنجاح ✓">
      <div style={{ textAlign:'center', padding:'16px 0' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:`${C.success}22`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:28 }}>✅</div>
        <p style={{ color:C.textMuted, fontSize:14, marginBottom:6 }}>تم حجز موعدك في خدمة</p>
        <p style={{ color:'#fff', fontSize:17, fontWeight:700, marginBottom:4 }}>{bkService?.name_ar}</p>
        <p style={{ color:C.gold, fontSize:13 }}>{bkDate} الساعة {bkTime}</p>
        <div style={{ marginTop:16, padding:12, background:`${C.gold}0a`, borderRadius:10, border:`1px solid ${C.gold}22`, color:C.textDim, fontSize:13 }}>رقم الحجز: {bkId||'BK'+Date.now().toString(36).toUpperCase()}</div>
        <Bt onClick={() => { setBkService(null); setBkDone(false) }} style={{ marginTop:20 }}>تم</Bt>
      </div>
    </Md>}

    {/* Cart Drawer */}
    {cartOpen && <div style={{ position:'fixed', inset:0, zIndex:1000 }} onClick={() => setCartOpen(false)}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()} style={{ position:'absolute', left:0, top:0, bottom:0, width:'100%', maxWidth:420, background:C.navyCard, borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', animation:'su 0.3s ease' }}>

        {/* Header */}
        <div style={{ padding:'20px 20px 0', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ color:'#fff', fontSize:18, fontWeight:700, margin:0, display:'flex', alignItems:'center', gap:6 }}>
              <ShoppingCart size={18} color={C.gold} /> طلباتي
              {cartUnpaidCount > 0 && <span style={{ background:C.gold, color:C.navy, fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20 }}>{cartUnpaidCount}</span>}
            </h2>
            <button onClick={() => setCartOpen(false)} style={{ background:'rgba(255,255,255,0.06)', border:'none', color:C.textMuted, cursor:'pointer', borderRadius:8, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16} /></button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, marginBottom:0 }}>
            {([['unpaid','غير مدفوعة', cartUnpaidCount],['paid','مدفوعة', cartPaidCount]] as const).map(([k,l,cnt]) => (
              <button key={k} type="button" onClick={() => setCartTab(k)}
                style={{ flex:1, padding:'11px 0', border:'none', background:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:cartTab===k?700:400, color:cartTab===k?C.gold:C.textMuted, borderBottom:cartTab===k?`2px solid ${C.gold}`:'2px solid transparent', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {l}
                {cnt > 0 && <span style={{ background:cartTab===k?C.gold:'rgba(255,255,255,0.15)', color:cartTab===k?C.navy:'#fff', fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:20 }}>{cnt}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 20px' }}>

          {/* ══ TAB 1: غير مدفوعة ══ */}
          {cartTab === 'unpaid' && (
            cartUnpaidCount === 0
              ? <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:C.textDim, gap:10, paddingTop:60 }}>
                  <span style={{ fontSize:40 }}>🛒</span>
                  <span style={{ fontSize:14 }}>السلة فارغة</span>
                  <span style={{ fontSize:12, color:C.textDim, textAlign:'center', maxWidth:200 }}>أضف منتجات أو احجز خدمة لتظهر هنا</span>
                  <Bt variant="ghost" onClick={() => setCartOpen(false)}>تصفح الخدمات</Bt>
                </div>
              : <>
                  {/* Products */}
                  {cart.length > 0 && (
                    <div style={{ marginBottom:18 }}>
                      <div style={{ color:C.textDim, fontSize:11, fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                        <Package size={12} /> منتجات السلة
                      </div>
                      {cart.map(i => (
                        <div key={i.product.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 0', borderBottom:`1px solid ${C.border}` }}>
                          <span style={{ fontSize:24 }}>{PI[i.product.id%PI.length]}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ color:'#fff', fontWeight:600, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{i.product.name_ar}</div>
                            <div style={{ color:C.gold, fontWeight:700, fontSize:13 }}>{(i.product.price*i.qty).toLocaleString()} ر.س</div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                            <button onClick={() => updQty(i.product.id,-1)} style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:C.textMuted, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Minus size={11} /></button>
                            <span style={{ color:'#fff', fontWeight:700, fontSize:13, minWidth:20, textAlign:'center' }}>{i.qty}</span>
                            <button onClick={() => updQty(i.product.id,1)} style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:C.textMuted, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Plus size={11} /></button>
                          </div>
                          <button onClick={() => rmCart(i.product.id)} style={{ width:26, height:26, borderRadius:6, border:'none', background:`${C.error}22`, color:C.error, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Trash2 size={11} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Service bookings */}
                  {cartUnpaidBk.length > 0 && (
                    <div style={{ marginBottom:18 }}>
                      <div style={{ color:C.textDim, fontSize:11, fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                        <Scissors size={12} /> الخدمات المحجوزة
                      </div>
                      {cartUnpaidBk.map((b:any) => (
                        <div key={b.id} style={{ borderRadius:14, background:`${C.gold}08`, border:`1px solid ${C.gold}33`, marginBottom:10, padding:'12px 14px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ color:'#fff', fontWeight:700, fontSize:14 }}>{b.service_name}</div>
                              {b.staff_name && <div style={{ color:C.textDim, fontSize:11, marginTop:2 }}>👤 {b.staff_name}</div>}
                            </div>
                            <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:`${C.gold}22`, color:C.gold, whiteSpace:'nowrap', marginRight:8 }}>
                              {b.status==='confirmed'?'مؤكد':b.status==='in_progress'?'جارٍ':'قيد الانتظار'}
                            </span>
                          </div>
                          <div style={{ display:'flex', gap:12, fontSize:11, color:C.textMuted, marginBottom:8 }}>
                            <span>📅 {new Date(b.date).toLocaleDateString('ar-SA',{month:'short',day:'numeric'})}</span>
                            <span>🕐 {b.start_time?.slice(0,5)}</span>
                            {b.duration_min && <span>⏱ {b.duration_min}د</span>}
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                            <span style={{ color:C.gold, fontWeight:800, fontSize:15 }}>{Number(b.price||b.total||0).toLocaleString()} ر.س</span>
                            <button type="button" disabled={actionBusy} onClick={() => askConfirm('إلغاء الحجز','هل أنت متأكد؟',async()=>{setActionBusy(true);const r=await fetch('/api/public-my-bookings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:b.id,action:'cancel'})});if(r.ok){setToast({msg:'تم إلغاء الحجز',type:'success'});if(authToken)fetchProfile(authToken)}else setToast({msg:'خطأ في الإلغاء',type:'error'});setActionBusy(false)},'إلغاء')}
                              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, background:`${C.error}18`, border:`1px solid ${C.error}33`, color:C.error, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'inherit' }}>
                              <Trash2 size={11} /> إزالة
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Grand total */}
                  <div style={{ borderRadius:14, background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, padding:'12px 14px' }}>
                    {cart.length > 0 && cartUnpaidBk.length > 0 && (
                      <>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:C.textDim, marginBottom:5 }}>
                          <span>المنتجات</span><span>{cartTotal.toLocaleString()} ر.س</span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:C.textDim, marginBottom:8 }}>
                          <span>الخدمات</span><span>{cartBkTotal.toLocaleString()} ر.س</span>
                        </div>
                      </>
                    )}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ color:'#fff', fontWeight:700, fontSize:14 }}>الإجمالي الكلي</span>
                      <span style={{ color:C.gold, fontWeight:900, fontSize:22 }}>{cartGrandTotal.toLocaleString()} <span style={{ fontSize:12, color:C.textDim }}>ر.س</span></span>
                    </div>
                  </div>
                </>
          )}

          {/* ══ TAB 2: مدفوعة ══ */}
          {cartTab === 'paid' && (
            !authUser
              ? /* Not logged in */
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:C.textDim, gap:12, paddingTop:60 }}>
                  <span style={{ fontSize:44 }}>🔐</span>
                  <span style={{ fontSize:14, color:'#fff' }}>سجل دخولك لعرض طلباتك</span>
                  <span style={{ fontSize:12, textAlign:'center', maxWidth:220, lineHeight:1.6 }}>قم بتسجيل الدخول لمتابعة طلباتك ومدفوعاتك</span>
                  <button type="button" onClick={() => { setCartOpen(false); setShowLogin(true) }}
                    style={{ marginTop:6, padding:'11px 28px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                    تسجيل الدخول
                  </button>
                </div>
            : profileLoading
              ? /* Loading */
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, paddingTop:60 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', border:`3px solid ${C.border}`, borderTopColor:C.gold, animation:'sp .8s linear infinite' }} />
                  <span style={{ fontSize:13, color:C.textDim }}>جارٍ تحميل طلباتك...</span>
                </div>
            : cartPaidCount === 0
              ? /* Empty state */
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:C.textDim, gap:10, paddingTop:60 }}>
                  <span style={{ fontSize:40 }}>📭</span>
                  <span style={{ fontSize:14 }}>لا توجد طلبات مدفوعة بعد</span>
                  <button type="button" onClick={() => authToken && fetchProfile(authToken)}
                    style={{ marginTop:4, padding:'8px 18px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, color:C.textMuted, cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>
                    🔄 تحديث
                  </button>
                </div>
              : <>
                  {/* Refresh bar */}
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
                    <button type="button" onClick={() => authToken && fetchProfile(authToken)} disabled={profileLoading}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, color:C.textDim, cursor:'pointer', fontSize:11, fontFamily:'inherit', opacity:profileLoading?0.5:1 }}>
                      <span style={{ display:'inline-block', animation:profileLoading?'sp .8s linear infinite':'none' }}>🔄</span> تحديث
                    </button>
                  </div>
                  {/* Paid bookings */}
                  {cartPaidBk.length > 0 && (
                    <div style={{ marginBottom:18 }}>
                      <div style={{ color:C.textDim, fontSize:11, fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                        <Scissors size={12} /> خدمات تم سدادها
                      </div>
                      {cartPaidBk.map((b:any) => (
                        <div key={b.id} style={{ borderRadius:14, background:`rgba(34,197,94,0.06)`, border:`1px solid rgba(34,197,94,0.25)`, marginBottom:10, padding:'12px 14px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                            <div>
                              <div style={{ color:'#fff', fontWeight:700, fontSize:14 }}>{b.service_name}</div>
                              {b.staff_name && <div style={{ color:C.textDim, fontSize:11, marginTop:2 }}>👤 {b.staff_name}</div>}
                            </div>
                            <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:'rgba(34,197,94,0.2)', color:C.success, whiteSpace:'nowrap', marginRight:8 }}>
                              {b.status==='completed'?'✓ مكتمل':b.status==='no_show'?'لم يحضر':'⏳ قيد المراجعة'}
                            </span>
                          </div>
                          <div style={{ display:'flex', gap:12, fontSize:11, color:C.textMuted, marginBottom:8 }}>
                            <span>📅 {new Date(b.date).toLocaleDateString('ar-SA',{month:'short',day:'numeric'})}</span>
                            <span>🕐 {b.start_time?.slice(0,5)}</span>
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                            <span style={{ color:C.gold, fontWeight:800, fontSize:15 }}>{Number(b.price||b.total||0).toLocaleString()} ر.س</span>
                            <div style={{ display:'flex', gap:6 }}>
                              {b.status === 'completed' && (
                                <button type="button" onClick={() => { setShowRatingBk(b); setRatingStars(5); setRatingText('') }}
                                  style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, background:`${C.gold}18`, border:`1px solid ${C.gold}33`, color:C.gold, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'inherit' }}>
                                  <Star size={11} /> تقييم
                                </button>
                              )}
                              <button type="button" onClick={() => { setCartDetailItem(b); setCartDetailType('booking') }}
                                style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, background:'rgba(255,255,255,0.07)', border:`1px solid ${C.border}`, color:C.textMuted, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'inherit' }}>
                                <Eye size={11} /> تفاصيل
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Paid orders */}
                  {cartPaidOr.length > 0 && (
                    <div>
                      <div style={{ color:C.textDim, fontSize:11, fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                        <Package size={12} /> طلبات المنتجات
                      </div>
                      {cartPaidOr.map((o:any) => {
                        const items:any[] = Array.isArray(o.items) ? o.items : []
                        const isVerified = o.payment_status === 'paid'
                        const isCancelled = o.status === 'cancelled'
                        const badgeBg = isVerified ? 'rgba(34,197,94,0.2)' : isCancelled ? 'rgba(239,68,68,0.2)' : `${C.gold}22`
                        const badgeColor = isVerified ? C.success : isCancelled ? C.error : C.gold
                        const badgeLabel = isVerified ? '✓ موثق' : isCancelled ? '✕ ملغى' : '⏳ قيد المراجعة'
                        const borderColor = isVerified ? 'rgba(34,197,94,0.25)' : isCancelled ? 'rgba(239,68,68,0.2)' : `${C.gold}33`
                        return (
                          <div key={o.id} style={{ borderRadius:14, background:`rgba(255,255,255,0.04)`, border:`1px solid ${borderColor}`, marginBottom:10, padding:'12px 14px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                              <div>
                                <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>طلب #{String(o.id).slice(0,8).toUpperCase()}</div>
                                <div style={{ color:C.textDim, fontSize:11, marginTop:2 }}>📅 {new Date(o.created_at).toLocaleDateString('ar-SA',{month:'short',day:'numeric'})} · {items.length} منتج</div>
                              </div>
                              <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:badgeBg, color:badgeColor, whiteSpace:'nowrap', marginRight:8 }}>{badgeLabel}</span>
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                              <span style={{ color:C.gold, fontWeight:800, fontSize:15 }}>{Number(o.total||0).toLocaleString()} ر.س</span>
                              <button type="button" onClick={() => { setCartDetailItem(o); setCartDetailType('order') }}
                                style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, background:'rgba(255,255,255,0.07)', border:`1px solid ${C.border}`, color:C.textMuted, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'inherit' }}>
                                <Eye size={11} /> تفاصيل
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
          )}
        </div>

        {/* Pay All button (unpaid tab only) */}
        {cartTab === 'unpaid' && cartUnpaidCount > 0 && (
          <div style={{ padding:'14px 20px', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
            <Bt fullWidth onClick={() => requireAuth(() => { if (!authUser) return; setCartPayOpen(true); setCartPayTab('transfer'); setCartPayDone(false) })}
              style={{ padding:'13px', fontSize:14 }}>
              <CreditCard size={16} /> إتمام الدفع · {cartGrandTotal.toLocaleString()} ر.س
            </Bt>
          </div>
        )}
      </div>
    </div>}

    {/* ── Cart Payment Modal ── */}
    {cartPayOpen && (
      <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
        onClick={e => { if(e.target===e.currentTarget) setCartPayOpen(false) }}>
        <div style={{ width:'100%', maxWidth:460, background:C.navyCard, borderRadius:'24px 24px 0 0', maxHeight:'90vh', overflowY:'auto', paddingBottom:32, border:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 20px 0' }}>
            <div>
              <h2 style={{ color:'#fff', fontSize:17, fontWeight:800, margin:0 }}>إتمام الدفع</h2>
              <p style={{ color:C.textDim, fontSize:12, margin:'3px 0 0' }}>{cartUnpaidCount} عنصر</p>
            </div>
            <button type="button" onClick={() => { setCartPayOpen(false); setReceiptFile(null); setReceiptPreview(null); setReceiptError('') }} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:'50%', width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.textMuted }}><X size={16} /></button>
          </div>

          {/* Summary */}
          <div style={{ margin:'14px 20px 0', background:'rgba(255,255,255,0.04)', borderRadius:14, padding:'12px 14px', border:`1px solid ${C.border}` }}>
            {cart.map(i => (
              <div key={i.product.id} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'3px 0' }}>
                <span style={{ color:C.textMuted }}>{i.product.name_ar} ×{i.qty}</span>
                <span style={{ fontWeight:600, color:C.gold }}>{(i.product.price*i.qty).toLocaleString()} ر.س</span>
              </div>
            ))}
            {cart.length > 0 && cartUnpaidBk.length > 0 && <div style={{ borderTop:`1px dashed ${C.border}`, margin:'6px 0' }} />}
            {cartUnpaidBk.map((b:any) => (
              <div key={b.id} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'3px 0' }}>
                <span style={{ color:C.textMuted }}>{b.service_name}</span>
                <span style={{ fontWeight:600, color:C.gold }}>{Number(b.price||b.total||0).toLocaleString()} ر.س</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:`1px solid ${C.gold}44` }}>
              <span style={{ fontWeight:800, fontSize:14, color:'#fff' }}>الإجمالي</span>
              <span style={{ fontWeight:900, fontSize:18, color:C.gold }}>{cartGrandTotal.toLocaleString()} ر.س</span>
            </div>
          </div>

          {/* Payment tabs */}
          <div style={{ margin:'14px 20px 0', display:'flex', gap:8 }}>
            {([['transfer', Building2, 'حوالة بنكية'],['card', CreditCard, 'بطاقة بنكية'],['debit', Building2, 'خصم من حساب']] as [string,any,string][]).map(([k, Icon, label]) => (
              <button key={k} type="button" onClick={() => setCartPayTab(k as any)}
                style={{ flex:1, padding:'10px 6px', borderRadius:12, border:cartPayTab===k?`2px solid ${C.gold}`:`1px solid ${C.border}`, background:cartPayTab===k?`${C.gold}18`:'transparent', color:cartPayTab===k?C.gold:C.textMuted, fontWeight:cartPayTab===k?700:500, fontSize:11, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5, whiteSpace:'nowrap' }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* Bank transfer */}
          {cartPayTab === 'transfer' && (
            <div style={{ margin:'14px 20px 0' }}>
              <div style={{ background:`linear-gradient(135deg,#071B3B,#0F3460)`, borderRadius:16, padding:'16px 18px', marginBottom:14 }}>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginBottom:4 }}>الآيبان — IBAN</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:800, color:'white', direction:'ltr', letterSpacing:2 }}>
                    {cartIbanVisible ? pubBankInfo.iban : (pubBankInfo.iban.slice(0,4)+' **** **** **** '+pubBankInfo.iban.slice(-4))}
                  </span>
                  <div style={{ display:'flex', gap:6 }}>
                    <button type="button" onClick={() => setCartIbanVisible(s=>!s)} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'5px 8px', cursor:'pointer', color:'rgba(255,255,255,0.7)', display:'flex' }}>
                      {cartIbanVisible ? '🙈' : '👁'}
                    </button>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(pubBankInfo.iban).catch(()=>{}); setCartIbanCopied(true); setTimeout(()=>setCartIbanCopied(false),2000) }}
                      style={{ background:cartIbanCopied?`${C.success}33`:C.gold, border:'none', borderRadius:8, padding:'5px 12px', cursor:'pointer', color:'white', fontSize:11, fontWeight:700, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                      {cartIbanCopied ? <><Check size={12} /> تم</> : <><Copy size={12} /> نسخ</>}
                    </button>
                  </div>
                </div>
              </div>
              {[['البنك', pubBankInfo.bank_name],['المستفيد', pubBankInfo.account_holder],['الحساب', pubBankInfo.account_number]].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ color:C.textDim, fontSize:12 }}>{l}</span>
                  <span style={{ color:'#fff', fontWeight:700, fontSize:12 }}>{v||'—'}</span>
                </div>
              ))}
              <div style={{ background:`${C.gold}0a`, border:`1px solid ${C.gold}22`, borderRadius:10, padding:'10px 14px', marginTop:12, fontSize:12, color:C.textDim, lineHeight:1.7 }}>
                ⚠️ بعد إتمام التحويل، ارفع سند الحوالة ثم اضغط تأكيد.
              </div>

              {/* ── Receipt upload ── */}
              <div style={{ marginTop:14 }}>
                <label style={{ display:'block', color:C.textDim, fontSize:12, fontWeight:700, marginBottom:8 }}>
                  📎 رفع سند الحوالة <span style={{ color:C.error }}>*</span>
                </label>
                <label style={{
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  padding: receiptPreview ? 0 : '18px 12px',
                  border:`2px dashed ${receiptError ? C.error : receiptFile ? C.success : C.gold}66`,
                  borderRadius:14, cursor:'pointer', background:'rgba(255,255,255,0.03)',
                  overflow:'hidden', minHeight: receiptPreview ? 0 : 80,
                }}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display:'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptFile(f) }} />
                  {receiptPreview
                    ? <img src={receiptPreview} alt="سند" style={{ width:'100%', maxHeight:160, objectFit:'contain' }} />
                    : <div style={{ textAlign:'center', color:C.textDim }}>
                        <div style={{ fontSize:28, marginBottom:6 }}>📸</div>
                        <div style={{ fontSize:12 }}>اضغط لرفع صورة السند</div>
                        <div style={{ fontSize:10, marginTop:3, color:C.textDim }}>JPG / PNG / WEBP · حد أقصى 5MB</div>
                      </div>
                  }
                </label>
                {receiptPreview && (
                  <div style={{ display:'flex', gap:8, marginTop:8 }}>
                    <div style={{ flex:1, fontSize:11, color:C.success, display:'flex', alignItems:'center', gap:5 }}>
                      <Check size={12} /> تم اختيار السند بنجاح
                    </div>
                    <button type="button" onClick={() => { setReceiptFile(null); setReceiptPreview(null); setReceiptError('') }}
                      style={{ background:`${C.error}22`, border:'none', borderRadius:8, padding:'4px 10px', cursor:'pointer', color:C.error, fontSize:11, fontFamily:'inherit' }}>
                      تغيير
                    </button>
                  </div>
                )}
                {receiptError && <div style={{ color:C.error, fontSize:12, marginTop:6, display:'flex', alignItems:'center', gap:5 }}>⚠️ {receiptError}</div>}
              </div>

              <button type="button" disabled={cartPayLoading || !receiptFile} onClick={() => submitCartPayment('حوالة بنكية')}
                style={{ width:'100%', marginTop:14, padding:14, borderRadius:14, border:'none', background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', opacity:(cartPayLoading||!receiptFile)?0.65:1 }}>
                {receiptUploading ? 'جارٍ رفع السند...' : cartPayLoading ? 'جارٍ المعالجة...' : `تأكيد التحويل — ${cartGrandTotal.toLocaleString()} ر.س`}
              </button>
            </div>
          )}

          {/* ── Card payment ── */}
          {cartPayTab === 'card' && (() => {
            const cd = detectCard(cardNumber)
            const rawNum = cardNumber.replace(/\D/g,'')
            const isAmex = cd.type === 'amex'
            const cvvLen = isAmex ? 4 : 3
            const cardOk = rawNum.length >= (isAmex ? 15 : 16) && cardHolder.trim() && cardExpiry.length === 5 && cardCvv.replace(/\D/g,'').length >= cvvLen
            const cardBrands = [
              { t:'visa',       l:'VISA',       s:'#1A1F71', bg:'#f0f4ff' },
              { t:'mastercard', l:'MC',         s:'#EB001B', bg:'#fff0f0' },
              { t:'amex',       l:'AMEX',       s:'#007BC1', bg:'#f0f7ff' },
              { t:'discover',   l:'DISC',       s:'#FF6600', bg:'#fff5f0' },
            ]
            return (
              <div style={{ margin:'14px 20px 20px' }}>
                {/* Card brands */}
                <div style={{ display:'flex', gap:6, justifyContent:'flex-end', marginBottom:14 }}>
                  {cardBrands.map(b => (
                    <div key={b.t} style={{ width:42, height:28, borderRadius:6, border:`1.5px solid ${cd.type===b.t?b.s:'rgba(255,255,255,0.1)'}`, background: cd.type===b.t?b.bg+'22':'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color: cd.type===b.t?b.s:'rgba(255,255,255,0.25)', transition:'all 0.2s', letterSpacing:0.5 }}>
                      {b.l}
                    </div>
                  ))}
                </div>

                {/* Visual card preview */}
                <div style={{ borderRadius:16, padding:'18px 20px', marginBottom:16, minHeight:120, background: cd.type ? `linear-gradient(135deg,${cd.color}dd,${cd.color}88)` : `linear-gradient(135deg,#1e3a5f,#0a1628)`, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-20, right:-20, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
                  <div style={{ position:'absolute', bottom:-30, left:-10, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, position:'relative' }}>
                    <div style={{ width:40, height:28, borderRadius:6, background:'linear-gradient(135deg,#FFD700,#FFA500)', boxShadow:'0 2px 8px rgba(0,0,0,0.3)' }} />
                    {cd.label && <span style={{ color:'white', fontWeight:900, fontSize:15, letterSpacing:1, opacity:0.9 }}>{cd.label}</span>}
                  </div>
                  <div style={{ fontFamily:'monospace', fontSize:16, fontWeight:700, color:'white', letterSpacing:3, marginBottom:14, position:'relative' }}>
                    {rawNum.length > 0 ? fmtCardNumber(cardNumber).replace(/\d/g, cardFlipped ? '•' : '$&') : '•••• •••• •••• ••••'}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', position:'relative' }}>
                    <div>
                      <div style={{ color:'rgba(255,255,255,0.5)', fontSize:9, marginBottom:2 }}>CARDHOLDER</div>
                      <div style={{ color:'white', fontWeight:600, fontSize:12, letterSpacing:1 }}>{cardHolder || 'YOUR NAME'}</div>
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ color:'rgba(255,255,255,0.5)', fontSize:9, marginBottom:2 }}>EXPIRES</div>
                      <div style={{ color:'white', fontWeight:600, fontSize:12, letterSpacing:1, fontFamily:'monospace' }}>{cardExpiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>

                {/* Card number */}
                <div style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:12, color:C.textDim, marginBottom:5, fontWeight:600 }}>رقم البطاقة</label>
                  <div style={{ position:'relative' }}>
                    <input value={cardNumber} inputMode="numeric" placeholder="1234 5678 9012 3456" maxLength={19}
                      onChange={e => setCardNumber(fmtCardNumber(e.target.value))}
                      style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1px solid ${rawNum.length===16&&luhn(rawNum)?C.success:C.border}`, background:C.navy, color:'#fff', fontSize:15, fontFamily:'monospace', letterSpacing:2, outline:'none', boxSizing:'border-box' }} />
                    {rawNum.length >= 15 && (
                      <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:10, fontWeight:800, color: luhn(rawNum)?C.success:C.error }}>
                        {luhn(rawNum) ? '✓' : '✕'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cardholder name */}
                <div style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:12, color:C.textDim, marginBottom:5, fontWeight:600 }}>الاسم على البطاقة</label>
                  <input value={cardHolder} placeholder="MOHAMMED ALI" autoCapitalize="characters"
                    onChange={e => setCardHolder(e.target.value.toUpperCase())}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1px solid ${C.border}`, background:C.navy, color:'#fff', fontSize:13, fontFamily:'monospace', letterSpacing:1, outline:'none', boxSizing:'border-box' }} />
                </div>

                {/* Expiry + CVV */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:12, color:C.textDim, marginBottom:5, fontWeight:600 }}>تاريخ الانتهاء</label>
                    <input value={cardExpiry} inputMode="numeric" placeholder="MM/YY" maxLength={5}
                      onChange={e => setCardExpiry(fmtExpiry(e.target.value))}
                      style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1px solid ${C.border}`, background:C.navy, color:'#fff', fontSize:14, fontFamily:'monospace', letterSpacing:2, outline:'none', boxSizing:'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:12, color:C.textDim, marginBottom:5, fontWeight:600 }}>رمز الأمان {isAmex ? '(4 أرقام)' : '(CVV)'}</label>
                    <input value={cardCvv} inputMode="numeric" placeholder={isAmex?'••••':'•••'} maxLength={cvvLen} type="password"
                      onFocus={() => setCardFlipped(true)} onBlur={() => setCardFlipped(false)}
                      onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,cvvLen))}
                      style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1px solid ${C.border}`, background:C.navy, color:'#fff', fontSize:14, fontFamily:'monospace', letterSpacing:3, outline:'none', boxSizing:'border-box' }} />
                  </div>
                </div>

                {/* Security note */}
                <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'flex-start', gap:8 }}>
                  <span style={{ fontSize:14 }}>🔒</span>
                  <span style={{ fontSize:11, color:C.textDim, lineHeight:1.6 }}>معلوماتك محمية بتشفير SSL 256-bit. لا يتم حفظ بيانات بطاقتك على خوادمنا.</span>
                </div>

                <button type="button" disabled={cartPayLoading || !cardOk} onClick={() => submitCartPayment('بطاقة بنكية')}
                  style={{ width:'100%', padding:14, borderRadius:14, border:'none', background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', opacity:(cartPayLoading||!cardOk)?0.6:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <CreditCard size={16} />
                  {cartPayLoading ? 'جارٍ المعالجة...' : `ادفع الآن — ${cartGrandTotal.toLocaleString()} ر.س`}
                </button>
              </div>
            )
          })()}

          {/* Direct debit */}
          {cartPayTab === 'debit' && (
            <div style={{ margin:'14px 20px 0' }}>
              {[['اسم البنك', cartDebitBank, setCartDebitBank, 'البنك الأهلي'],['رقم الحساب / الآيبان', cartDebitAcct, setCartDebitAcct, 'SA00...'],['اسم مالك الحساب', cartDebitOwner, setCartDebitOwner, 'الاسم كما في البطاقة']].map(([label,val,set,ph]) => (
                <div key={String(label)} style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:12, color:C.textDim, marginBottom:5, fontWeight:600 }}>{label as string}</label>
                  <input value={val as string} onChange={e => (set as any)(e.target.value)} placeholder={ph as string}
                    style={{ width:'100%', padding:'11px 14px', borderRadius:12, border:`1px solid ${C.border}`, background:C.navy, color:'#fff', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}
              <button type="button" disabled={cartPayLoading || !cartDebitBank || !cartDebitAcct || !cartDebitOwner} onClick={() => submitCartPayment('خصم من حساب')}
                style={{ width:'100%', marginTop:6, padding:14, borderRadius:14, border:'none', background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', opacity:(cartPayLoading||!cartDebitBank||!cartDebitAcct||!cartDebitOwner)?0.6:1 }}>
                {cartPayLoading ? 'جارٍ المعالجة...' : `تأكيد الخصم — ${cartGrandTotal.toLocaleString()} ر.س`}
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* ── Cart Detail Modal ── */}
    {cartDetailItem && cartDetailType === 'booking' && (
      <div onClick={() => setCartDetailItem(null)} style={{ position:'fixed', inset:0, zIndex:1200, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:C.navyCard, borderRadius:20, padding:24, maxWidth:380, width:'100%', border:`1px solid ${C.border}`, maxHeight:'85vh', overflowY:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div><h3 style={{ color:'#fff', fontWeight:800, fontSize:16, margin:0 }}>تفاصيل الخدمة</h3><p style={{ color:C.textDim, fontSize:11, margin:'3px 0 0' }}>#{String(cartDetailItem.id).slice(0,8).toUpperCase()}</p></div>
            <button type="button" onClick={() => setCartDetailItem(null)} style={{ background:'rgba(255,255,255,.08)', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18 }}>×</button>
          </div>
          <div style={{ background:`${C.gold}0f`, border:`1px solid ${C.gold}33`, borderRadius:12, padding:'12px 14px', marginBottom:14 }}>
            <div style={{ color:'#fff', fontWeight:800, fontSize:15 }}>{cartDetailItem.service_name}</div>
            {cartDetailItem.staff_name && <div style={{ color:C.textDim, fontSize:12, marginTop:3 }}>👤 {cartDetailItem.staff_name}</div>}
          </div>
          {[['📅','التاريخ',new Date(cartDetailItem.date).toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})],
            ['🕐','الوقت',`${cartDetailItem.start_time?.slice(0,5)||''}${cartDetailItem.end_time?` – ${cartDetailItem.end_time.slice(0,5)}`:''}`],
            ['🏢','الفرع',cartDetailItem.branch_name||'—'],
            ['⏱','المدة',cartDetailItem.duration_min?`${cartDetailItem.duration_min} دقيقة`:'—'],
          ].map(([e,l,v])=>(
            <div key={String(l)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
              <span style={{ color:C.textDim, fontSize:12 }}>{e} {l}</span><span style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:12, borderTop:`2px solid ${C.gold}`, marginTop:4 }}>
            <span style={{ color:C.textDim, fontWeight:600, fontSize:13 }}>سعر الخدمة</span>
            <span style={{ color:C.gold, fontWeight:900, fontSize:20 }}>{Number(cartDetailItem.price||cartDetailItem.total||0).toLocaleString()} ر.س</span>
          </div>
          {cartDetailItem.status === 'completed' && (
            <button type="button" onClick={() => { setCartDetailItem(null); setShowRatingBk(cartDetailItem); setRatingStars(5); setRatingText('') }}
              style={{ width:'100%', marginTop:12, padding:'11px', borderRadius:12, background:`${C.gold}18`, border:`1px solid ${C.gold}44`, color:C.gold, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Star size={14} /> تقييم الخدمة
            </button>
          )}
          <button type="button" onClick={() => setCartDetailItem(null)} style={{ width:'100%', marginTop:10, padding:'12px', borderRadius:12, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, border:'none', color:C.navy, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>إغلاق</button>
        </div>
      </div>
    )}

    {cartDetailItem && cartDetailType === 'order' && (
      <div onClick={() => setCartDetailItem(null)} style={{ position:'fixed', inset:0, zIndex:1200, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:C.navyCard, borderRadius:20, padding:24, maxWidth:380, width:'100%', border:`1px solid ${C.border}`, maxHeight:'88vh', overflowY:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div><h3 style={{ color:'#fff', fontWeight:800, fontSize:16, margin:0 }}>تفاصيل الطلب</h3><p style={{ color:C.textDim, fontSize:11, margin:'3px 0 0' }}>#{String(cartDetailItem.id).slice(0,10).toUpperCase()}</p></div>
            <button type="button" onClick={() => setCartDetailItem(null)} style={{ background:'rgba(255,255,255,.08)', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18 }}>×</button>
          </div>
          {[['📅','التاريخ',new Date(cartDetailItem.created_at).toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})],
            ['🏢','الفرع',cartDetailItem.branch_name||'—'],
            ['💳','الدفع',cartDetailItem.payment_method==='bank_transfer'?'تحويل بنكي':cartDetailItem.payment_method==='direct_debit'?'خصم من حساب':'كاش'],
          ].map(([e,l,v])=>(
            <div key={String(l)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
              <span style={{ color:C.textDim, fontSize:12 }}>{e} {l}</span><span style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop:12 }}>
            <p style={{ color:C.textDim, fontSize:12, fontWeight:600, marginBottom:8 }}>📦 المنتجات</p>
            {(Array.isArray(cartDetailItem.items)?cartDetailItem.items:[]).map((it:any,i:number)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,.04)', borderRadius:10, padding:'9px 12px', marginBottom:6 }}>
                <div><div style={{ color:'#fff', fontWeight:600, fontSize:12 }}>{it.name}</div><div style={{ fontSize:11, color:C.textDim }}>{it.qty} × {Number(it.price||0).toLocaleString()} ر.س</div></div>
                <span style={{ color:C.gold, fontWeight:700, fontSize:12 }}>{(Number(it.price||0)*it.qty).toLocaleString()} ر.س</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, paddingTop:12, borderTop:`2px solid ${C.gold}` }}>
            <span style={{ color:C.textDim, fontWeight:600, fontSize:13 }}>الإجمالي</span>
            <span style={{ color:C.gold, fontWeight:900, fontSize:20 }}>{Number(cartDetailItem.total||0).toLocaleString()} ر.س</span>
          </div>
          <button type="button" onClick={() => setCartDetailItem(null)} style={{ width:'100%', marginTop:14, padding:'12px', borderRadius:12, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, border:'none', color:C.navy, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>إغلاق</button>
        </div>
      </div>
    )}

    {/* ── Rating Modal ── */}
    {showRatingBk && (
      <div onClick={() => setShowRatingBk(null)} style={{ position:'fixed', inset:0, zIndex:1300, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:C.navyCard, borderRadius:20, padding:28, maxWidth:360, width:'100%', border:`1px solid ${C.border}` }}>
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:`${C.gold}18`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Star size={24} color={C.gold} />
            </div>
            <h3 style={{ color:'#fff', fontWeight:800, fontSize:17, margin:'0 0 4px' }}>تقييم الخدمة</h3>
            <p style={{ color:C.textDim, fontSize:13, margin:0 }}>{showRatingBk.service_name}</p>
          </div>
          {/* Stars */}
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:18 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setRatingStars(n)}
                style={{ background:'none', border:'none', cursor:'pointer', padding:4, display:'flex' }}>
                <Star size={32} fill={n <= ratingStars ? C.gold : 'none'} color={n <= ratingStars ? C.gold : C.textDim} />
              </button>
            ))}
          </div>
          <textarea value={ratingText} onChange={e => setRatingText(e.target.value)} placeholder="اكتب تعليقك (اختياري)..."
            rows={3}
            style={{ width:'100%', padding:'11px 14px', borderRadius:12, border:`1px solid ${C.border}`, background:C.navy, color:'#fff', fontSize:13, fontFamily:'inherit', outline:'none', resize:'none', boxSizing:'border-box', marginBottom:14 }} />
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={() => setShowRatingBk(null)}
              style={{ flex:1, padding:'11px', borderRadius:12, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, color:C.textMuted, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>إلغاء</button>
            <button type="button" disabled={ratingLoading} onClick={submitRating}
              style={{ flex:2, padding:'11px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', opacity:ratingLoading?0.7:1 }}>
              {ratingLoading ? 'جارٍ الإرسال...' : '⭐ إرسال التقييم'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Checkout Modal */}
    {coOpen && !coDone && <Md onClose={() => setCoOpen(false)} title="إتمام الطلب">
      {/* Cart summary */}
      <div style={{ background:`rgba(255,255,255,0.04)`, borderRadius:12, padding:'10px 14px', marginBottom:16 }}>
        {cart.map(i => (
          <div key={i.product.id} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${C.border}`, fontSize:12 }}>
            <span style={{ color:C.text }}>{i.product.name_ar} × {i.qty}</span>
            <span style={{ color:C.gold, fontWeight:600 }}>{(i.product.price*i.qty).toLocaleString()} ر.س</span>
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 0', fontSize:15 }}>
          <span style={{ color:'#fff', fontWeight:700 }}>الإجمالي</span>
          <span style={{ color:C.gold, fontWeight:900, fontSize:18 }}>{cartTotal.toLocaleString()} ر.س</span>
        </div>
      </div>

      {/* Customer info */}
      <In label="الاسم" value={coName} onChange={setCoName} icon={<User size={15} />} />
      <In label="رقم الجوال" value={coPhone} onChange={setCoPhone} type="tel" placeholder="05XXXXXXXX" icon={<Phone size={15} />} />
      <In label="العنوان (اختياري)" value={coAddr} onChange={setCoAddr} icon={<MapPin size={15} />} />

      {/* Payment method tabs */}
      <div style={{ marginBottom:16 }}>
        <label style={{ display:'block', color:C.textMuted, fontSize:13, marginBottom:10, fontWeight:600 }}>طريقة الدفع</label>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {([
            ['bank_transfer','🏦 حوالة بنكية'],
            ['direct_debit', '💳 خصم من حساب'],
            ['cod',          '💵 الدفع عند الاستلام'],
          ] as const).map(([v,l]) => (
            <button key={v} type="button" onClick={() => setCoPay(v as any)}
              style={{ flex:1, padding:'10px 6px', borderRadius:10, border:`1px solid ${coPay===v?C.gold:C.border}`, background: coPay===v?`${C.gold}15`:'transparent', color: coPay===v?C.gold:C.textMuted, cursor:'pointer', fontSize:11, fontWeight: coPay===v?700:400, transition:'all 0.2s', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── حوالة بنكية details ── */}
        {coPay==='bank_transfer' && (
          <div style={{ background:`rgba(255,255,255,0.04)`, borderRadius:14, padding:16, border:`1px solid ${C.border}` }}>
            {/* IBAN highlight row */}
            <div style={{ background:'rgba(201,165,95,0.08)', border:`1px solid ${C.gold}33`, borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
              <div style={{ color:C.textDim, fontSize:11, marginBottom:4 }}>الآيبان — IBAN</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:800, color:'#fff', direction:'ltr', letterSpacing:2 }}>
                  {pubIbanVisible ? pubBankInfo.iban : (pubBankInfo.iban.slice(0,4)+' **** **** **** '+pubBankInfo.iban.slice(-4))}
                </span>
                <div style={{ display:'flex', gap:6 }}>
                  <button type="button" onClick={() => setPubIbanVisible(s=>!s)}
                    style={{ background:'rgba(255,255,255,.08)', border:'none', borderRadius:7, padding:'5px 9px', cursor:'pointer', color:C.textMuted, display:'flex', alignItems:'center', fontSize:12 }}>
                    {pubIbanVisible ? '🙈' : '👁'}
                  </button>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(pubBankInfo.iban).catch(()=>{}); setPubIbanCopied(true); setTimeout(()=>setPubIbanCopied(false),2000) }}
                    style={{ background: pubIbanCopied?`${C.success}22`:C.gold+'22', border:`1px solid ${pubIbanCopied?C.success:C.gold}55`, borderRadius:7, padding:'5px 12px', cursor:'pointer', color: pubIbanCopied?C.success:C.gold, fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                    {pubIbanCopied ? '✓ تم' : '📋 نسخ'}
                  </button>
                </div>
              </div>
            </div>
            {/* Bank details */}
            {[['البنك', pubBankInfo.bank_name], ['المستفيد', pubBankInfo.account_holder], ['رقم الحساب', pubBankInfo.account_number]].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ color:C.textDim, fontSize:12 }}>{l}</span>
                <span style={{ color:'#fff', fontWeight:700, fontSize:13 }}>{v||'—'}</span>
              </div>
            ))}
            <div style={{ background:`${C.gold}0a`, border:`1px solid ${C.gold}22`, borderRadius:10, padding:'10px 14px', marginTop:14, fontSize:12, color:C.textDim, lineHeight:1.7 }}>
              ⚠️ بعد إتمام التحويل اضغط "تأكيد الطلب" وسيتم التحقق من دفعتك وتأكيد طلبك.
            </div>
          </div>
        )}

        {/* ── خصم من حساب form ── */}
        {coPay==='direct_debit' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              ['اسم البنك', coDebitBank, setCoDebitBank, 'البنك الأهلي السعودي'],
              ['رقم الحساب / الآيبان', coDebitAcct, setCoDebitAcct, 'SA00 0000 0000 0000'],
              ['اسم مالك الحساب', coDebitOwner, setCoDebitOwner, 'الاسم كما في البطاقة'],
            ].map(([label, val, set, ph]) => (
              <div key={String(label)}>
                <label style={{ display:'block', color:C.textMuted, fontSize:12, marginBottom:5, fontWeight:500 }}>{label as string}</label>
                <input value={val as string} onChange={e => (set as any)(e.target.value)} placeholder={ph as string}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1px solid ${C.border}`, background:'rgba(255,255,255,0.04)', color:'#fff', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ background:`${C.success}0a`, border:`1px solid ${C.success}22`, borderRadius:10, padding:'10px 14px', fontSize:12, color:C.textDim }}>
              🔒 بياناتك محمية بتشفير كامل وتُستخدم فقط لإتمام هذه المعاملة.
            </div>
          </div>
        )}

        {/* ── COD info ── */}
        {coPay==='cod' && (
          <div style={{ background:`rgba(255,255,255,0.04)`, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px', color:C.textDim, fontSize:13, lineHeight:1.8 }}>
            💵 سيتم الدفع نقداً عند استلام الطلب أو عند الزيارة.
          </div>
        )}
      </div>

      <Bt fullWidth onClick={submitOrder} disabled={coLoading || (coPay==='direct_debit' && (!coDebitBank||!coDebitAcct||!coDebitOwner))}
        style={{ padding:'14px', fontSize:15 }}>
        {coLoading ? 'جارٍ تقديم الطلب...' : `تأكيد الطلب — ${cartTotal.toLocaleString()} ر.س`}
      </Bt>
    </Md>}

    {coDone && <Md onClose={() => { setCoOpen(false); setCoDone(false) }} title="تم تقديم الطلب ✓">
      <div style={{ textAlign:'center', padding:'16px 0' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:`${C.success}22`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:28 }}>✅</div>
        <p style={{ color:C.textMuted, fontSize:14, marginBottom:4 }}>تم تقديم طلبك بنجاح</p>
        <p style={{ color:C.gold, fontWeight:700, fontSize:16, marginBottom:14 }}>سنقوم بالتواصل معك قريباً</p>
        <div style={{ padding:12, background:`${C.gold}0a`, borderRadius:10, border:`1px solid ${C.gold}22`, color:C.textDim, fontSize:13 }}>رقم الطلب: {coId||'OR'+Date.now().toString(36).toUpperCase()}</div>
        <Bt onClick={() => { setCoOpen(false); setCoDone(false) }} style={{ marginTop:20 }}>تم</Bt>
      </div>
    </Md>}
  </div>
}

