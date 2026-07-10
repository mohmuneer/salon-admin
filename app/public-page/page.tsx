'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import {
  Plus, Pencil, Trash2, X, Check, Tag, Video, Eye, ExternalLink,
  Image, Star, Ticket, BarChart3, Settings, MessageCircle, Globe,
  Search, ToggleLeft, ToggleRight, GripVertical, Clock, Link,
  Upload, Sparkles, CalendarDays, Smartphone, Share2, Palette
} from 'lucide-react'
import PriceInput from '@/components/PriceInput'

type Tab = 'offers' | 'ads' | 'reviews' | 'banner' | 'coupons' | 'settings' | 'stats' | 'themes' | 'features'

interface Offer {
  id: number; title_ar: string; title_en: string; description_ar: string; description_en: string
  original_price: number; offer_price: number; valid_until: string; badge: string
  is_active: boolean; sort_order: number
  image_url: string; mobile_image_url: string; thumbnail_url: string; gallery: string[]; before_after: string[]
  cta_text: string; cta_link: string; cta_action: string
  linked_service_id: string | null; countdown_end: string
  whatsapp_number: string; whatsapp_message: string; branch_id: string | null
  seo_title: string; seo_description: string
  views_count: number; clicks_count: number; bookings_count: number
}

interface Ad {
  id: number; title_ar: string; title_en: string; youtube_id: string; youtube_url: string
  description_ar: string; description_en: string; is_active: boolean; sort_order: number
  image_url: string; branch_id: string | null
}

interface Review { id: number; customer_name: string; customer_avatar: string; rating: number; comment_ar: string; comment_en: string; is_active: boolean; sort_order: number }
interface Banner { id: number; title_ar: string; title_en: string; subtitle_ar: string; subtitle_en: string; image_url: string; video_url: string; cta_text_ar: string; cta_text_en: string; cta_link: string; cta_action: string; is_active: boolean }
interface Coupon { id: number; code: string; discount_percent: number; max_uses: number; used_count: number; valid_from: string; valid_until: string; is_active: boolean }
interface Service { id: string; name_ar: string }
interface Branch { id: string; name: string; name_en: string }

const emptyOffer: Record<string, any> = { title_ar: '', title_en: '', description_ar: '', description_en: '', original_price: 0, offer_price: 0, valid_until: '', badge: '', image_url: '', mobile_image_url: '', thumbnail_url: '', gallery: [], before_after: [], cta_text: '', cta_link: '', cta_action: 'book', linked_service_id: null, countdown_end: '', whatsapp_number: '', whatsapp_message: '', branch_id: '', seo_title: '', seo_description: '' }
const emptyAd: any = { title_ar: '', title_en: '', youtube_id: '', youtube_url: '', description_ar: '', description_en: '', image_url: '', branch_id: '' }
const emptyReview: any = { customer_name: '', customer_avatar: '', rating: 5, comment_ar: '', comment_en: '' }
const emptyBanner: any = { title_ar: '', title_en: '', subtitle_ar: '', subtitle_en: '', image_url: '', video_url: '', cta_text_ar: '', cta_text_en: '', cta_link: '', cta_action: 'book' }
const emptyCoupon: any = { code: '', discount_percent: 10, max_uses: 0, valid_from: '', valid_until: '' }

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999, padding: '14px 24px', borderRadius: 14, background: type === 'success' ? '#22c55e' : '#ef4444', color: '#fff', fontSize: 14, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10, animation: 'slideUp 0.3s ease' }}><span style={{ fontSize: 18 }}>{type === 'success' ? '✓' : '✕'}</span>{msg}</div>
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return <button onClick={() => onChange(!value)} className={value ? "btn btn-toggle on" : "btn btn-toggle off"}>
    <div className="toggle-knob" />
  </button>
}

function extractYoutubeId(url: string): string {
  if (!url) return ''
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ]
  for (const p of patterns) { const m = url.match(p); if (m) return m[1] }
  return url
}

function calcDiscount(original: number, offer: number): number {
  if (original <= 0 || offer <= 0) return 0
  return Math.round((1 - offer / original) * 100)
}

/* ── منصات التواصل الاجتماعي المدعومة ── */
const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram',   icon: '📸', color: '#E1306C', prefix: 'https://instagram.com/', strip: '@' },
  { id: 'twitter',   label: 'Twitter / X', icon: '🐦', color: '#1DA1F2', prefix: 'https://x.com/',         strip: '@' },
  { id: 'snapchat',  label: 'Snapchat',    icon: '👻', color: '#FFFC00', prefix: 'https://snapchat.com/add/', strip: '@' },
  { id: 'tiktok',    label: 'TikTok',      icon: '🎵', color: '#010101', prefix: 'https://tiktok.com/@',   strip: '@' },
  { id: 'facebook',  label: 'Facebook',    icon: '📘', color: '#1877F2', prefix: 'https://facebook.com/',  strip: '' },
  { id: 'youtube',   label: 'YouTube',     icon: '▶️', color: '#FF0000', prefix: 'https://youtube.com/@',  strip: '@' },
  { id: 'linkedin',  label: 'LinkedIn',    icon: '💼', color: '#0A66C2', prefix: 'https://linkedin.com/company/', strip: '' },
  { id: 'whatsapp',  label: 'WhatsApp',    icon: '💬', color: '#25D366', prefix: 'https://wa.me/',          strip: '+' },
  { id: 'telegram',  label: 'Telegram',    icon: '✈️', color: '#26A5E4', prefix: 'https://t.me/',           strip: '@' },
  { id: 'custom',    label: 'رابط مخصص',   icon: '🔗', color: '#6B7280', prefix: '',                        strip: '' },
]

function buildUrl(platform: string, handle: string): string {
  const p = SOCIAL_PLATFORMS.find(x => x.id === platform)
  if (!p || !handle) return ''
  if (platform === 'custom') return handle.startsWith('http') ? handle : `https://${handle}`
  const clean = handle.replace(/^[@+]/, '')
  return `${p.prefix}${clean}`
}

function SocialLinksEditor({
  links, onChange, lang, onSave,
}: {
  links: Array<{ platform: string; handle: string; url: string }>
  onChange: (links: any[]) => void
  lang: string
  onSave?: (links: any[]) => Promise<void>
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [newPlatform, setNewPlatform] = useState('instagram')
  const [newHandle, setNewHandle] = useState('')
  const [saving, setSaving] = useState(false)

  const persist = async (newLinks: any[]) => {
    onChange(newLinks)
    if (!onSave) return
    setSaving(true)
    await onSave(newLinks).catch(() => {})
    setSaving(false)
  }

  const add = async () => {
    if (!newHandle.trim()) return
    const url = buildUrl(newPlatform, newHandle.trim())
    await persist([...links, { platform: newPlatform, handle: newHandle.trim(), url }])
    setNewHandle('')
    setNewPlatform('instagram')
    setShowAdd(false)
  }

  const remove = async (i: number) => persist(links.filter((_, j) => j !== i))

  const update = (i: number, handle: string) => {
    const updated = links.map((l, j) => j === i ? { ...l, handle, url: buildUrl(l.platform, handle) } : l)
    onChange(updated)  // Update state only, save on blur
  }

  const saveOnBlur = async (newLinks: any[]) => {
    if (onSave) { setSaving(true); await onSave(newLinks).catch(() => {}); setSaving(false) }
  }

  const isAr = lang === 'ar'
  const selected = SOCIAL_PLATFORMS.find(p => p.id === newPlatform)

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, margin: 0 }}>
          <Share2 size={15} /> {isAr ? 'وسائل التواصل الاجتماعي' : 'Social Media'}
          {saving && <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginInlineStart: 6 }}>جاري الحفظ...</span>}
        </h2>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowAdd(s => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
          <Plus size={14} /> {isAr ? 'إضافة' : 'Add'}
        </button>
      </div>
      <div className="card-body">

        {/* قائمة الروابط */}
        {links.length === 0 && !showAdd && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 13 }}>
            {isAr ? 'لم تُضَف أي منصة بعد — اضغط "إضافة"' : 'No social links yet — click "Add"'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {links.map((link, i) => {
            const p = SOCIAL_PLATFORMS.find(x => x.id === link.platform)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                {/* Icon */}
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${p?.color || '#6B7280'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {p?.icon || '🔗'}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{p?.label || link.platform}</div>
                  <input
                    className="input-field"
                    value={link.handle}
                    onChange={e => update(i, e.target.value)}
                    onBlur={() => saveOnBlur(links.map((l, j) => j === i ? { ...l, handle: link.handle, url: buildUrl(l.platform, link.handle) } : l))}
                    style={{ marginTop: 2, padding: '5px 10px', fontSize: 13, borderRadius: 7 }}
                    dir="ltr"
                    placeholder={p?.id === 'custom' ? 'https://...' : `@handle`}
                  />
                </div>
                {/* Preview link */}
                {link.url && (
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: p?.color || '#6B7280', fontSize: 20, textDecoration: 'none', flexShrink: 0 }}
                    title="معاينة">↗</a>
                )}
                {/* Delete */}
                <button
                  onClick={() => remove(i)}
                  style={{ background: '#FEE2E2', border: 'none', color: '#EF4444', cursor: 'pointer', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>

        {/* نموذج الإضافة */}
        {showAdd && (
          <div style={{ marginTop: 14, padding: 16, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8', marginBottom: 10 }}>
              {isAr ? '+ إضافة منصة جديدة' : '+ Add new platform'}
            </div>
            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              {/* اختيار المنصة */}
              <div>
                <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 5 }}>{isAr ? 'المنصة' : 'Platform'}</label>
                <select
                  className="input-field"
                  value={newPlatform}
                  onChange={e => { setNewPlatform(e.target.value); setNewHandle('') }}>
                  {SOCIAL_PLATFORMS.map(p => (
                    <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
                  ))}
                </select>
              </div>
              {/* المعرّف أو الرابط */}
              <div>
                <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 5 }}>
                  {newPlatform === 'custom' ? (isAr ? 'الرابط الكامل' : 'Full URL') : (isAr ? 'المعرّف (handle)' : 'Handle')}
                </label>
                <input
                  className="input-field"
                  value={newHandle}
                  onChange={e => setNewHandle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && add()}
                  placeholder={newPlatform === 'custom' ? 'https://...' : `${selected?.strip || ''}username`}
                  dir="ltr"
                  autoFocus
                />
              </div>
            </div>
            {/* معاينة الرابط */}
            {newHandle && newPlatform !== 'custom' && (
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 10, direction: 'ltr', fontFamily: 'monospace' }}>
                🔗 {buildUrl(newPlatform, newHandle)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowAdd(false); setNewHandle('') }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button className="btn btn-primary btn-sm" onClick={add} disabled={!newHandle.trim()}>
                <Plus size={13} /> {isAr ? 'إضافة' : 'Add'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PublicPageManagement() {
  const { lang } = useLang()
  const tr = t[lang] as Record<string, string>
  const [tab, setTab] = useState<Tab>('offers')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Data
  const [offers, setOffers] = useState<Offer[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)

  // Modal state
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [showAdForm, setShowAdForm] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showBannerForm, setShowBannerForm] = useState(false)
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
const [offerForm, setOfferForm] = useState<Record<string, any>>(emptyOffer)
const [adForm, setAdForm] = useState<Record<string, any>>(emptyAd)
const [reviewForm, setReviewForm] = useState<Record<string, any>>(emptyReview)
const [bannerForm, setBannerForm] = useState<Record<string, any>>(emptyBanner)
const [couponForm, setCouponForm] = useState<Record<string, any>>(emptyCoupon)
  const [uploading, setUploading] = useState(false)

  // Stats filters
  const [statsPeriod, setStatsPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [statsData, setStatsData] = useState<any>(null)

  // Features
  const [features, setFeatures] = useState<any[]>([])
  const [showFeatureForm, setShowFeatureForm] = useState(false)
  const [editingFeatureId, setEditingFeatureId] = useState<number|null>(null)
  const [featureForm, setFeatureForm] = useState({ icon:'✨', image_url:'', title_ar:'', title_en:'', description_ar:'', description_en:'', sort_order:0 })
  const [seedingFeatures, setSeedingFeatures] = useState(false)

  // Custom themes
  const [customThemes, setCustomThemes] = useState<any[]>([])
  const [showThemeForm, setShowThemeForm] = useState(false)
  const [themeForm, setThemeForm] = useState({ name: '', primary_color: '#C9A55F' })

  // Settings
  const [settingsForm, setSettingsForm] = useState<Record<string, any>>({})
  const [savingSettings, setSavingSettings] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    const [o, a, r, b, c, sv, br, st, pm, sl] = await Promise.all([
      fetch('/api/public-offers').then(r => r.json()).catch(() => []),
      fetch('/api/public-ads').then(r => r.json()).catch(() => []),
      fetch('/api/public-reviews').then(r => r.json()).catch(() => []),
      fetch('/api/public-banner').then(r => r.json()).catch(() => []),
      fetch('/api/public-coupons').then(r => r.json()).catch(() => []),
      fetch('/api/services').then(r => r.json()).catch(() => []),
      fetch('/api/branches').then(r => r.json()).catch(() => []),
      fetch('/api/settings').then(r => r.json()).catch(() => ({})),
      fetch('/api/public-page-meta').then(r => r.json()).catch(() => ({})),
      fetch('/api/public-social-links').then(r => r.json()).catch(() => []),
    ])
    setOffers(Array.isArray(o) ? o : [])
    setAds(Array.isArray(a) ? a : [])
    setReviews(Array.isArray(r) ? r : [])
    setBanners(Array.isArray(b) ? b : [])
    setCoupons(Array.isArray(c) ? c : [])
    setServices(Array.isArray(sv) ? sv : [])
    setBranches(Array.isArray(br) ? br : [])
    setSettings(st)
    // Merge: salon settings + page_meta + social_links (dedicated endpoint)
    setSettingsForm({ ...st, ...pm, social_links: Array.isArray(sl) ? sl : [] })
    setLoading(false)
  }

  const loadCustomThemes = async () => {
    const res = await fetch('/api/custom-themes').then(r => r.json()).catch(() => [])
    setCustomThemes(res)
  }

  const loadFeatures = async () => {
    const r = await fetch('/api/public-features').then(r => r.json()).catch(() => [])
    setFeatures(Array.isArray(r) ? r : [])
  }

  useEffect(() => { loadAll(); loadCustomThemes(); loadPublicTheme(); loadFeatures() }, [])

  // Upload helper
  const uploadFile = async (file: File): Promise<string> => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const d = await res.json()
    setUploading(false)
    return d.url || ''
  }

  // Image upload component
  const ImageUploader = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) => (
    <div>
      {label && <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{label}</label>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {value && <img src={value} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: '1px solid #E8E4DC' }} />}
        <label className="btn btn-ghost" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <Upload size={14} />{uploading ? '...' : (tr.uploadImage || 'رفع')}
          <input type="file" accept="image/*" onChange={async e => { const f = e.target.files?.[0]; if (f) { const url = await uploadFile(f); onChange(url) } }} style={{ display: 'none' }} />
        </label>
        {value && <button onClick={() => onChange('')} className="btn btn-icon-danger"><X size={16} /></button>}
      </div>
    </div>
  )

  // Gallery uploader
  const GalleryUploader = ({ images, onChange, label }: { images: string[]; onChange: (v: string[]) => void; label?: string }) => {
    const addImage = async (file: File) => {
      const url = await uploadFile(file)
      if (url) onChange([...images, url])
    }
    return (
      <div>
        {label && <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{label}</label>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {images.map((url, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
              <button onClick={() => onChange(images.filter((_, j) => j !== i))} className="btn btn-icon-danger" style={{ position: 'absolute', top: -4, right: -4 }}><X size={10} /></button>
            </div>
          ))}
          <label style={{ width: 60, height: 60, borderRadius: 8, border: '1px dashed #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}>
            <Plus size={20} />
            <input type="file" accept="image/*" onChange={async e => { const f = e.target.files?.[0]; if (f) { await addImage(f) } }} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
    )
  }

  // ==================== CRUD Operations ====================

  const toggleActive = async (type: string, id: number, active: boolean) => {
    await fetch(`/api/public-${type}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: active }) })
    loadAll()
  }

  const saveOffer = async () => {
    const body = editingId ? { ...offerForm, id: editingId } : offerForm
    try {
      const r = await fetch('/api/public-offers', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) { setToast({ msg: d.error || 'حدث خطأ في الحفظ', type: 'error' }); return }
      setShowOfferForm(false); setEditingId(null); setOfferForm(emptyOffer); loadAll()
      setToast({ msg: editingId ? 'تم تعديل العرض ✓' : 'تم إضافة العرض ✓', type: 'success' })
    } catch { setToast({ msg: 'خطأ في الاتصال بالخادم', type: 'error' }) }
  }

  const deleteOffer = async (id: number) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return
    await fetch('/api/public-offers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadAll(); setToast({ msg: 'تم حذف العرض', type: 'success' })
  }

  const editOffer = (o: Offer) => {
    setOfferForm({
      title_ar: o.title_ar, title_en: o.title_en, description_ar: o.description_ar, description_en: o.description_en,
      original_price: o.original_price, offer_price: o.offer_price, valid_until: o.valid_until?.split('T')[0] || '', badge: o.badge,
      image_url: o.image_url || '', mobile_image_url: o.mobile_image_url || '', thumbnail_url: o.thumbnail_url || '',
      gallery: o.gallery || [], before_after: o.before_after || [],
      cta_text: o.cta_text || '', cta_link: o.cta_link || '', cta_action: o.cta_action || 'book',
      linked_service_id: o.linked_service_id || null, countdown_end: o.countdown_end?.split('T')[0] || '',
      whatsapp_number: o.whatsapp_number || '', whatsapp_message: o.whatsapp_message || '',
      branch_id: o.branch_id || '', seo_title: o.seo_title || '', seo_description: o.seo_description || '',
    })
    setEditingId(o.id); setShowOfferForm(true)
  }

  const saveAd = async () => {
    const body = editingId ? { ...adForm, id: editingId } : adForm
    if (adForm.youtube_url) { body.youtube_id = extractYoutubeId(adForm.youtube_url) }
    try {
      const r = await fetch('/api/public-ads', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) { setToast({ msg: d.error || 'حدث خطأ', type: 'error' }); return }
      setShowAdForm(false); setEditingId(null); setAdForm(emptyAd); loadAll()
      setToast({ msg: editingId ? 'تم تعديل الإعلان ✓' : 'تم إضافة الإعلان ✓', type: 'success' })
    } catch { setToast({ msg: 'خطأ في الاتصال', type: 'error' }) }
  }

  const deleteAd = async (id: number) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return
    await fetch('/api/public-ads', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadAll(); setToast({ msg: 'تم حذف الإعلان', type: 'success' })
  }

  const editAd = (a: Ad) => {
    setAdForm({ title_ar: a.title_ar, title_en: a.title_en, youtube_id: a.youtube_id, youtube_url: a.youtube_url || '', description_ar: a.description_ar, description_en: a.description_en, image_url: a.image_url || '', branch_id: a.branch_id || null })
    setEditingId(a.id); setShowAdForm(true)
  }

  const saveReview = async () => {
    const body = editingId ? { ...reviewForm, id: editingId } : reviewForm
    try {
      const r = await fetch('/api/public-reviews', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) { setToast({ msg: d.error || 'حدث خطأ', type: 'error' }); return }
      setShowReviewForm(false); setEditingId(null); setReviewForm(emptyReview); loadAll()
      setToast({ msg: editingId ? 'تم تعديل التقييم ✓' : 'تم إضافة التقييم ✓', type: 'success' })
    } catch { setToast({ msg: 'خطأ في الاتصال', type: 'error' }) }
  }

  const deleteReview = async (id: number) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return
    await fetch('/api/public-reviews', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadAll(); setToast({ msg: 'تم حذف التقييم', type: 'success' })
  }

  const editReview = (r: Review) => {
    setReviewForm({ customer_name: r.customer_name, customer_avatar: r.customer_avatar, rating: r.rating, comment_ar: r.comment_ar, comment_en: r.comment_en })
    setEditingId(r.id); setShowReviewForm(true)
  }

  const saveBanner = async () => {
    const body = editingId ? { ...bannerForm, id: editingId } : bannerForm
    try {
      const r = await fetch('/api/public-banner', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) { setToast({ msg: d.error || 'حدث خطأ', type: 'error' }); return }
      setShowBannerForm(false); setEditingId(null); setBannerForm(emptyBanner); loadAll()
      setToast({ msg: editingId ? 'تم تعديل البانر ✓' : 'تم إضافة البانر ✓', type: 'success' })
    } catch { setToast({ msg: 'خطأ في الاتصال', type: 'error' }) }
  }

  const deleteBanner = async (id: number) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return
    await fetch('/api/public-banner', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadAll(); setToast({ msg: 'تم حذف البانر', type: 'success' })
  }

  const editBanner = (b: Banner) => {
    setBannerForm({ title_ar: b.title_ar, title_en: b.title_en, subtitle_ar: b.subtitle_ar, subtitle_en: b.subtitle_en, image_url: b.image_url, video_url: b.video_url, cta_text_ar: b.cta_text_ar, cta_text_en: b.cta_text_en, cta_link: b.cta_link, cta_action: b.cta_action })
    setEditingId(b.id); setShowBannerForm(true)
  }

  const saveCoupon = async () => {
    const body = editingId ? { ...couponForm, id: editingId } : couponForm
    try {
      const r = await fetch('/api/public-coupons', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) { setToast({ msg: d.error || 'حدث خطأ', type: 'error' }); return }
      setShowCouponForm(false); setEditingId(null); setCouponForm(emptyCoupon); loadAll()
      setToast({ msg: editingId ? 'تم تعديل الكوبون ✓' : 'تم إضافة الكوبون ✓', type: 'success' })
    } catch { setToast({ msg: 'خطأ في الاتصال', type: 'error' }) }
  }

  const deleteCoupon = async (id: number) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return
    await fetch('/api/public-coupons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadAll(); setToast({ msg: 'تم حذف الكوبون', type: 'success' })
  }

  const saveCustomTheme = async () => {
    await fetch('/api/custom-themes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(themeForm) })
    setShowThemeForm(false); setThemeForm({ name: '', primary_color: '#C9A55F' }); loadCustomThemes()
    setToast({ msg: 'تم إضافة الثيم', type: 'success' })
  }

  const deleteCustomTheme = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return
    await fetch('/api/custom-themes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadCustomThemes(); setToast({ msg: 'تم حذف الثيم', type: 'success' })
  }

  const presetColors: Record<string,string> = {
    gold: '#C9A55F', blue: '#2563EB', emerald: '#059669', rose: '#BE185D', light: '#2563EB', dark: '#6366F1',
  }

  const [publicTheme, setPublicTheme] = useState<{ theme: string; primary_color: string }>({ theme: 'gold', primary_color: '#C9A55F' })
  const [pendingTheme, setPendingTheme] = useState<{ theme: string; primary_color: string } | null>(null)
  const [savingTheme, setSavingTheme] = useState(false)

  const loadPublicTheme = async () => {
    const d = await fetch('/api/public-theme?t=' + Date.now()).then(r => r.json()).catch(() => ({ theme: 'gold', primary_color: '#C9A55F' }))
    setPublicTheme(d)
    setPendingTheme(null)
  }

  const selectTheme = (key: string, primaryColor?: string) => {
    const pc = primaryColor || presetColors[key] || '#C9A55F'
    setPendingTheme({ theme: key, primary_color: pc })
    try { localStorage.setItem('public_theme_preview', JSON.stringify({ theme: key, primary_color: pc })) } catch {}
  }

  const saveTheme = async (themeOverride?: { theme: string; primary_color: string }) => {
    const toSave = themeOverride || pendingTheme || publicTheme
    if (!toSave) return
    setSavingTheme(true)
    const { theme, primary_color } = toSave
    await fetch('/api/public-theme', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme, primary_color }) })
    setPublicTheme({ theme, primary_color })
    try { localStorage.removeItem('public_theme_preview') } catch {}
    setPendingTheme(null)
    setSavingTheme(false)
    setToast({ msg: lang === 'ar' ? 'تم حفظ الثيم' : 'Theme saved', type: 'success' })
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      const socialLinks = (settingsForm as any).social_links || []
      const [r1, r2, r3] = await Promise.all([
        fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settingsForm) }),
        fetch('/api/public-page-meta', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settingsForm) }),
        fetch('/api/public-social-links', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ social_links: socialLinks }) }),
      ])
      const d1 = await r1.json()
      if (!r1.ok) { setToast({ msg: d1.error || 'حدث خطأ في الحفظ', type: 'error' }); setSavingSettings(false); return }
      const d3 = await r3.json().catch(() => ({ ok: false }))
      if (!d3.db) {
        setToast({ msg: 'تم حفظ الإعدادات ✓ (وسائل التواصل محفوظة محلياً)', type: 'success' })
      } else {
        setToast({ msg: 'تم حفظ جميع الإعدادات ✓', type: 'success' })
      }
    } catch { setToast({ msg: 'خطأ في الاتصال', type: 'error' }) }
    setSavingSettings(false)
  }

  const applyDefaultSettings = () => {
    const name    = settings?.name    || 'الصالون'
    const nameEn  = settings?.name_en || 'Salon'
    const city    = settings?.city    || 'جدة'
    const phone   = settings?.phone   || ''
    setSettingsForm((f: any) => ({
      ...f,
      seo_title:       f.seo_title       || `${name} - صالون تجميل احترافي في ${city}`,
      seo_description: f.seo_description || `${name} يقدم أرقى خدمات التجميل والعناية بالشعر والبشرة في ${city}. احجزي موعدك الآن!`,
      seo_keywords:    f.seo_keywords    || `صالون تجميل, ${name}, ${city}, عناية بالشعر, مانيكير, مكياج, بشرة`,
      whatsapp_number:  f.whatsapp_number  || phone.replace(/\D/g,'').replace(/^966/, '966') || '966500000000',
      whatsapp_message: f.whatsapp_message || `مرحباً، أرغب بالاستفسار عن خدمات ${name}`,
      page_title_ar:   f.page_title_ar   || `${name} | صالون تجميل`,
      page_title_en:   f.page_title_en   || `${nameEn} | Beauty Salon`,
    }))
    setToast({ msg: 'تم تعبئة الإعدادات الافتراضية — راجعها واضغط حفظ', type: 'success' })
  }

  const loadStats = async () => {
    const data = await fetch(`/api/public-analytics?period=${statsPeriod}`).then(r => r.json()).catch(() => null)
    setStatsData(data)
  }

  useEffect(() => { if (tab === 'stats') loadStats() }, [tab, statsPeriod])

  // ==================== Form Modals ====================

  const renderOfferForm = () => (
    <div className="modal-overlay" onClick={() => { setShowOfferForm(false); setEditingId(null); setOfferForm(emptyOffer) }}>
      <div className="modal-content modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingId ? (tr.editOffer || 'تعديل العرض') : (tr.addOffer || 'إضافة عرض')}</h2>
          <button onClick={() => { setShowOfferForm(false); setEditingId(null); setOfferForm(emptyOffer) }} className="btn btn-icon"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-tabs">
            <div className="form-section">
              <h3><Tag size={16} /> {lang === 'ar' ? 'البيانات الأساسية' : 'Basic Info'}</h3>
              <div className="form-grid-2">
                <div><label>العنوان (عربي)</label><input className="input-field" value={offerForm.title_ar} onChange={e => setOfferForm(f => ({ ...f, title_ar: e.target.value }))} /></div>
                <div><label>Title (English)</label><input className="input-field" value={offerForm.title_en} onChange={e => setOfferForm(f => ({ ...f, title_en: e.target.value }))} /></div>
                <div><label>{tr.originalPrice}</label><PriceInput value={offerForm.original_price} onChange={v => setOfferForm(f => ({ ...f, original_price: v }))} /></div>
                <div><label>{tr.offerPrice}</label><PriceInput value={offerForm.offer_price} onChange={v => setOfferForm(f => ({ ...f, offer_price: v }))} />
                  {offerForm.original_price > 0 && offerForm.offer_price > 0 && (
                    <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>{tr.discountLabel}: {calcDiscount(offerForm.original_price, offerForm.offer_price)}%</span>
                  )}
                </div>
                <div><label>{tr.badge}</label><input className="input-field" value={offerForm.badge} onChange={e => setOfferForm(f => ({ ...f, badge: e.target.value }))} placeholder={lang === 'ar' ? 'مثال: الأكثر طلباً' : 'e.g. Best Seller'} /></div>
                <div><label>{tr.validUntil}</label><input className="input-field" type="date" value={offerForm.valid_until} onChange={e => setOfferForm(f => ({ ...f, valid_until: e.target.value }))} /></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label>{tr.description} (عربي)</label>
                <textarea className="input-field" rows={2} value={offerForm.description_ar} onChange={e => setOfferForm(f => ({ ...f, description_ar: e.target.value }))} />
              </div>
              <div style={{ marginTop: 8 }}>
                <label>Description (English)</label>
                <textarea className="input-field" rows={2} value={offerForm.description_en} onChange={e => setOfferForm(f => ({ ...f, description_en: e.target.value }))} />
              </div>
            </div>

            <div className="form-section">
              <h3><Image size={16} /> {lang === 'ar' ? 'الصور' : 'Images'}</h3>
              <div className="form-grid-3">
                <ImageUploader label={lang === 'ar' ? 'الصورة الرئيسية (Desktop)' : 'Main Image (Desktop)'} value={offerForm.image_url} onChange={v => setOfferForm(f => ({ ...f, image_url: v }))} />
                <ImageUploader label={lang === 'ar' ? 'صورة الجوال (Mobile)' : 'Mobile Image'} value={offerForm.mobile_image_url} onChange={v => setOfferForm(f => ({ ...f, mobile_image_url: v }))} />
                <ImageUploader label={lang === 'ar' ? 'الصورة المصغرة' : 'Thumbnail'} value={offerForm.thumbnail_url} onChange={v => setOfferForm(f => ({ ...f, thumbnail_url: v }))} />
              </div>
              <div style={{ marginTop: 12 }}>
                <GalleryUploader label={tr.gallery || 'معرض الصور'} images={offerForm.gallery} onChange={v => setOfferForm(f => ({ ...f, gallery: v }))} />
              </div>
              <div style={{ marginTop: 12 }}>
                <GalleryUploader label={tr.beforeAfter || 'صور قبل وبعد'} images={offerForm.before_after} onChange={v => setOfferForm(f => ({ ...f, before_after: v }))} />
              </div>
            </div>

            <div className="form-section">
              <h3><Sparkles size={16} /> {tr.ctaBook || 'زر الحث على الإجراء (CTA)'}</h3>
              <div className="form-grid-3">
                <div><label>{tr.ctaText}</label><input className="input-field" value={offerForm.cta_text} onChange={e => setOfferForm(f => ({ ...f, cta_text: e.target.value }))} placeholder={lang === 'ar' ? 'احجز الآن' : 'Book Now'} /></div>
                <div><label>{tr.ctaLink || 'الرابط'}</label><input className="input-field" value={offerForm.cta_link} onChange={e => setOfferForm(f => ({ ...f, cta_link: e.target.value }))} /></div>
                <div><label>{tr.ctaAction}</label>
                  <select className="input-field" value={offerForm.cta_action} onChange={e => setOfferForm(f => ({ ...f, cta_action: e.target.value }))}>
                    <option value="book">{tr.ctaBook}</option>
                    <option value="whatsapp">{tr.ctaWhatsapp}</option>
                    <option value="link">{tr.ctaLinkExternal || 'رابط خارجي'}</option>
                    <option value="details">{tr.ctaDetails}</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label>{tr.linkedService}</label>
                <select className="input-field" value={offerForm.linked_service_id || ''} onChange={e => setOfferForm(f => ({ ...f, linked_service_id: e.target.value || null }))}>
                  <option value="">{tr.noService}</option>
                  {services.map((s: Service) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
                </select>
              </div>
            </div>

            <div className="form-section">
              <h3><Clock size={16} /> {tr.countdown}</h3>
              <div><label>{tr.countdownEnd}</label><input className="input-field" type="date" value={offerForm.countdown_end} onChange={e => setOfferForm(f => ({ ...f, countdown_end: e.target.value }))} /></div>
            </div>

            <div className="form-section">
              <h3><MessageCircle size={16} /> {tr.whatsappConfig || 'واتساب'}</h3>
              <div className="form-grid-2">
                <div><label>{tr.whatsappNumber}</label><input className="input-field" value={offerForm.whatsapp_number} onChange={e => setOfferForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="9665XXXXXXXX" /></div>
                <div><label>{tr.whatsappMessage}</label><input className="input-field" value={offerForm.whatsapp_message} onChange={e => setOfferForm(f => ({ ...f, whatsapp_message: e.target.value }))} /></div>
              </div>
            </div>

            <div className="form-section">
              <h3><Globe size={16} /> {tr.seo}</h3>
              <div className="form-grid-2">
                <div><label>{tr.seoTitle}</label><input className="input-field" value={offerForm.seo_title} onChange={e => setOfferForm(f => ({ ...f, seo_title: e.target.value }))} /></div>
                <div><label>{tr.seoDescription}</label><input className="input-field" value={offerForm.seo_description} onChange={e => setOfferForm(f => ({ ...f, seo_description: e.target.value }))} /></div>
              </div>
            </div>

            {branches.length > 0 && (
              <div className="form-section">
                <h3><Smartphone size={16} /> {tr.branch}</h3>
                <select className="input-field" value={offerForm.branch_id || ''} onChange={e => setOfferForm(f => ({ ...f, branch_id: e.target.value || null }))}>
                  <option value="">{tr.allBranches}</option>
                  {branches.map((b: Branch) => <option key={b.id} value={b.id}>{b.name || b.name_en}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => { setShowOfferForm(false); setEditingId(null); setOfferForm(emptyOffer) }}>{tr.cancel}</button>
          <button className="btn btn-primary" onClick={saveOffer}>{tr.save}</button>
        </div>
      </div>
    </div>
  )

  const renderAdForm = () => (
    <div className="modal-overlay" onClick={() => { setShowAdForm(false); setEditingId(null); setAdForm(emptyAd) }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingId ? (tr.editAd || 'تعديل الإعلان') : (tr.addAd || 'إضافة إعلان')}</h2>
          <button onClick={() => { setShowAdForm(false); setEditingId(null); setAdForm(emptyAd) }} className="btn btn-icon"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid-2">
            <div><label>العنوان (عربي)</label><input className="input-field" value={adForm.title_ar} onChange={e => setAdForm(f => ({ ...f, title_ar: e.target.value }))} /></div>
            <div><label>Title (English)</label><input className="input-field" value={adForm.title_en} onChange={e => setAdForm(f => ({ ...f, title_en: e.target.value }))} /></div>
          </div>
          <ImageUploader label={tr.offerImage || 'صورة'} value={adForm.image_url} onChange={v => setAdForm(f => ({ ...f, image_url: v }))} />
          <div style={{ marginTop: 12 }}>
            <label>{tr.youtubeUrl}</label>
            <input className="input-field" value={adForm.youtube_url} onChange={e => setAdForm(f => ({ ...f, youtube_url: e.target.value, youtube_id: extractYoutubeId(e.target.value) }))} placeholder="https://youtube.com/watch?v=..." dir="ltr" />
            {adForm.youtube_id && <span style={{ fontSize: 11, color: '#6B7280' }}>ID: {adForm.youtube_id}</span>}
          </div>
          <div style={{ marginTop: 12 }}><label>{tr.description} (عربي)</label><textarea className="input-field" rows={2} value={adForm.description_ar} onChange={e => setAdForm(f => ({ ...f, description_ar: e.target.value }))} /></div>
          <div style={{ marginTop: 8 }}><label>Description (English)</label><textarea className="input-field" rows={2} value={adForm.description_en} onChange={e => setAdForm(f => ({ ...f, description_en: e.target.value }))} /></div>
          {branches.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <label>{tr.branch}</label>
              <select className="input-field" value={adForm.branch_id || ''} onChange={e => setAdForm(f => ({ ...f, branch_id: e.target.value || null }))}>
                <option value="">{tr.allBranches}</option>
                {branches.map((b: Branch) => <option key={b.id} value={b.id}>{b.name || b.name_en}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => { setShowAdForm(false); setEditingId(null); setAdForm(emptyAd) }}>{tr.cancel}</button>
          <button className="btn btn-primary" onClick={saveAd}>{tr.save}</button>
        </div>
      </div>
    </div>
  )

  const renderReviewForm = () => (
    <div className="modal-overlay" onClick={() => { setShowReviewForm(false); setEditingId(null); setReviewForm(emptyReview) }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingId ? (tr.editReview || 'تعديل التقييم') : (tr.addReview || 'إضافة تقييم')}</h2>
          <button onClick={() => { setShowReviewForm(false); setEditingId(null); setReviewForm(emptyReview) }} className="btn btn-icon"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid-2">
            <div><label>{tr.customerName}</label><input className="input-field" value={reviewForm.customer_name} onChange={e => setReviewForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
            <div><label>{tr.rating}</label>
              <select className="input-field" value={reviewForm.rating} onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))}>
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'⭐'.repeat(n)}</option>)}
              </select>
            </div>
          </div>
          <ImageUploader label={tr.customerAvatar} value={reviewForm.customer_avatar} onChange={v => setReviewForm(f => ({ ...f, customer_avatar: v }))} />
          <div style={{ marginTop: 12 }}><label>{tr.comment} (عربي)</label><textarea className="input-field" rows={2} value={reviewForm.comment_ar} onChange={e => setReviewForm(f => ({ ...f, comment_ar: e.target.value }))} /></div>
          <div style={{ marginTop: 8 }}><label>Comment (English)</label><textarea className="input-field" rows={2} value={reviewForm.comment_en} onChange={e => setReviewForm(f => ({ ...f, comment_en: e.target.value }))} /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => { setShowReviewForm(false); setEditingId(null); setReviewForm(emptyReview) }}>{tr.cancel}</button>
          <button className="btn btn-primary" onClick={saveReview}>{tr.save}</button>
        </div>
      </div>
    </div>
  )

  const renderBannerForm = () => (
    <div className="modal-overlay" onClick={() => { setShowBannerForm(false); setEditingId(null); setBannerForm(emptyBanner) }}>
      <div className="modal-content modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingId ? (tr.editBanner || 'تعديل البانر') : (tr.addBanner || 'إضافة بانر')}</h2>
          <button onClick={() => { setShowBannerForm(false); setEditingId(null); setBannerForm(emptyBanner) }} className="btn btn-icon"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid-2">
            <div><label>{tr.bannerTitle} (عربي)</label><input className="input-field" value={bannerForm.title_ar} onChange={e => setBannerForm(f => ({ ...f, title_ar: e.target.value }))} /></div>
            <div><label>Banner Title (English)</label><input className="input-field" value={bannerForm.title_en} onChange={e => setBannerForm(f => ({ ...f, title_en: e.target.value }))} /></div>
            <div><label>{tr.bannerSubtitle} (عربي)</label><input className="input-field" value={bannerForm.subtitle_ar} onChange={e => setBannerForm(f => ({ ...f, subtitle_ar: e.target.value }))} /></div>
            <div><label>Subtitle (English)</label><input className="input-field" value={bannerForm.subtitle_en} onChange={e => setBannerForm(f => ({ ...f, subtitle_en: e.target.value }))} /></div>
          </div>
          <div style={{ marginTop: 12 }}>
            <ImageUploader label={tr.bannerImage} value={bannerForm.image_url} onChange={v => setBannerForm(f => ({ ...f, image_url: v }))} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label>{tr.bannerVideo} (رابط)</label>
            <input className="input-field" value={bannerForm.video_url} onChange={e => setBannerForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." dir="ltr" />
          </div>
          <div className="form-grid-3" style={{ marginTop: 12 }}>
            <div><label>{tr.ctaText} (عربي)</label><input className="input-field" value={bannerForm.cta_text_ar} onChange={e => setBannerForm(f => ({ ...f, cta_text_ar: e.target.value }))} /></div>
            <div><label>CTA Text (English)</label><input className="input-field" value={bannerForm.cta_text_en} onChange={e => setBannerForm(f => ({ ...f, cta_text_en: e.target.value }))} /></div>
            <div><label>{tr.ctaLink || 'الرابط'}</label><input className="input-field" value={bannerForm.cta_link} onChange={e => setBannerForm(f => ({ ...f, cta_link: e.target.value }))} /></div>
            <div><label>{tr.ctaAction}</label>
              <select className="input-field" value={bannerForm.cta_action} onChange={e => setBannerForm(f => ({ ...f, cta_action: e.target.value }))}>
                <option value="book">{tr.ctaBook}</option>
                <option value="whatsapp">{tr.ctaWhatsapp}</option>
                <option value="link">{tr.ctaLinkExternal || 'رابط خارجي'}</option>
                <option value="services">{lang === 'ar' ? 'الخدمات' : 'Services'}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => { setShowBannerForm(false); setEditingId(null); setBannerForm(emptyBanner) }}>{tr.cancel}</button>
          <button className="btn btn-primary" onClick={saveBanner}>{tr.save}</button>
        </div>
      </div>
    </div>
  )

  const renderCouponForm = () => (
    <div className="modal-overlay" onClick={() => { setShowCouponForm(false); setEditingId(null); setCouponForm(emptyCoupon) }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingId ? 'تعديل الكوبون' : (tr.addCoupon || 'إضافة كوبون')}</h2>
          <button onClick={() => { setShowCouponForm(false); setEditingId(null); setCouponForm(emptyCoupon) }} className="btn btn-icon"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid-2">
            <div><label>{tr.couponCode}</label><input className="input-field" value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SALON50" dir="ltr" /></div>
            <div><label>{tr.discountPercent}</label><input className="input-field" type="number" value={couponForm.discount_percent} onChange={e => setCouponForm(f => ({ ...f, discount_percent: Number(e.target.value) }))} /></div>
            <div><label>{tr.maxUses}</label><input className="input-field" type="number" value={couponForm.max_uses} onChange={e => setCouponForm(f => ({ ...f, max_uses: Number(e.target.value) }))} placeholder="0 = غير محدود" /></div>
            <div><label>{tr.validFrom}</label><input className="input-field" type="date" value={couponForm.valid_from} onChange={e => setCouponForm(f => ({ ...f, valid_from: e.target.value }))} /></div>
            <div><label>{tr.validUntil}</label><input className="input-field" type="date" value={couponForm.valid_until} onChange={e => setCouponForm(f => ({ ...f, valid_until: e.target.value }))} /></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => { setShowCouponForm(false); setEditingId(null); setCouponForm(emptyCoupon) }}>{tr.cancel}</button>
          <button className="btn btn-primary" onClick={saveCoupon}>{tr.save}</button>
        </div>
      </div>
    </div>
  )

  // ==================== Render ====================

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{tr.publicPageTitle}</h1>
          <a href="/public" target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--gold)', textDecoration: 'none', marginTop: 4 }}>
            <Eye size={14} /> {lang === 'ar' ? 'عرض الصفحة العامة' : 'View Public Page'} <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="tabs-bar" style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'offers', icon: Tag, label: tr.offers },
          { key: 'ads', icon: Video, label: tr.ads },
          { key: 'reviews', icon: Star, label: tr.reviews },
          { key: 'banner', icon: Image, label: tr.banner },
          { key: 'coupons', icon: Ticket, label: tr.coupons },
          { key: 'features', icon: Sparkles, label: lang === 'ar' ? 'الميزات' : 'Features' },
          { key: 'settings', icon: Settings, label: lang === 'ar' ? 'الإعدادات' : 'Settings' },
          { key: 'stats', icon: BarChart3, label: tr.stats },
          { key: 'themes', icon: Palette, label: lang === 'ar' ? 'الثيمات' : 'Themes' },
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            className={tab === key ? "btn btn-tab active" : "btn btn-tab"}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ==================== OFFERS TAB ==================== */}
      {tab === 'offers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => { setEditingId(null); setOfferForm(emptyOffer); setShowOfferForm(true) }}>
              <Plus size={16} /> {tr.addOffer}
            </button>
          </div>

          <div className="card">
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>{tr.loading}</div>
            ) : offers.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>{tr.noOffers}</div>
            ) : (
              <div>
                {offers.map((o, idx) => (
                  <div key={o.id} style={{ padding: '16px 20px', borderBottom: '1px solid #F1EDE4', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ color: '#D1D5DB', cursor: 'grab', fontSize: 16 }}><GripVertical size={18} /></span>

                    {o.image_url ? (
                      <img src={o.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: '#F1EDE4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏷️</div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>{o.title_ar}</span>
                        {o.badge && <span style={{ background: o.badge === 'الأكثر طلباً' ? '#DC2626' : o.badge === 'أفضل قيمة' ? '#059669' : 'var(--gold)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 12 }}>{o.badge}</span>}
                        {o.linked_service_id && <span style={{ fontSize: 10, color: '#6B7280', background: '#F1EDE4', padding: '2px 8px', borderRadius: 8 }}>🔗 خدمة</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                        <span><span style={{ textDecoration: 'line-through', color: '#9CA3AF' }}>{Number(o.original_price).toLocaleString()}</span> <strong style={{ color: 'var(--gold)' }}>{Number(o.offer_price).toLocaleString()}</strong> {tr.sar}</span>
                        {calcDiscount(o.original_price, o.offer_price) > 0 && (
                          <span style={{ color: '#059669', fontWeight: 700, fontSize: 11 }}>-{calcDiscount(o.original_price, o.offer_price)}%</span>
                        )}
                        {o.countdown_end && <span style={{ color: '#DC2626', fontSize: 11 }}><Clock size={11} style={{ display: 'inline' }} /> {new Date(o.countdown_end).toLocaleDateString()}</span>}
                        {o.cta_text && <span style={{ fontSize: 10, background: '#F1EDE4', padding: '1px 8px', borderRadius: 6 }}>📌 {o.cta_text}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Toggle value={o.is_active} onChange={v => toggleActive('offers', o.id, v)} />
                      <button onClick={() => editOffer(o)} className="btn btn-icon"><Pencil size={15} /></button>
                      <button onClick={() => deleteOffer(o.id)} className="btn btn-icon-danger"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== ADS TAB ==================== */}
      {tab === 'ads' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => { setEditingId(null); setAdForm(emptyAd); setShowAdForm(true) }}>
              <Plus size={16} /> {tr.addAd}
            </button>
          </div>
          <div className="card">
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>{tr.loading}</div>
            ) : ads.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>{tr.noAds}</div>
            ) : (
              <div>
                {ads.map(a => (
                  <div key={a.id} style={{ padding: '16px 20px', borderBottom: '1px solid #F1EDE4', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ color: '#D1D5DB', cursor: 'grab', fontSize: 16 }}><GripVertical size={18} /></span>
                    {a.image_url ? (
                      <img src={a.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: '#F1EDE4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🎬</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{a.title_ar}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', direction: 'ltr', textAlign: 'left' }}>{a.youtube_url || a.youtube_id}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Toggle value={a.is_active} onChange={v => toggleActive('ads', a.id, v)} />
                      <button onClick={() => editAd(a)} className="btn btn-icon"><Pencil size={15} /></button>
                      <button onClick={() => deleteAd(a.id)} className="btn btn-icon-danger"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== REVIEWS TAB ==================== */}
      {tab === 'reviews' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => { setEditingId(null); setReviewForm(emptyReview); setShowReviewForm(true) }}>
              <Plus size={16} /> {tr.addReview}
            </button>
          </div>
          <div className="card">
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>{tr.loading}</div>
            ) : reviews.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>{tr.noReviews}</div>
            ) : (
              <div>
                {reviews.map(r => (
                  <div key={r.id} style={{ padding: '16px 20px', borderBottom: '1px solid #F1EDE4', display: 'flex', alignItems: 'center', gap: 14 }}>
                    {r.customer_avatar ? (
                      <img src={r.customer_avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F1EDE4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👤</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{r.customer_name}</span>
                        <span style={{ fontSize: 12 }}>{'⭐'.repeat(r.rating)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>{r.comment_ar}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Toggle value={r.is_active} onChange={v => toggleActive('reviews', r.id, v)} />
                      <button onClick={() => editReview(r)} className="btn btn-icon"><Pencil size={15} /></button>
                      <button onClick={() => deleteReview(r.id)} className="btn btn-icon-danger"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== BANNER TAB ==================== */}
      {tab === 'banner' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => { setEditingId(null); setBannerForm(emptyBanner); setShowBannerForm(true) }}>
              <Plus size={16} /> {tr.addBanner}
            </button>
          </div>
          <div className="card">
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>{tr.loading}</div>
            ) : banners.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>{tr.noBanners}</div>
            ) : (
              <div>
                {banners.map(b => (
                  <div key={b.id} style={{ padding: '16px 20px', borderBottom: '1px solid #F1EDE4', display: 'flex', alignItems: 'center', gap: 14 }}>
                    {b.image_url ? (
                      <img src={b.image_url} alt="" style={{ width: 80, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 80, height: 48, borderRadius: 10, background: '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, color: 'white' }}>🖼️</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{b.title_ar}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{b.subtitle_ar}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Toggle value={b.is_active} onChange={v => toggleActive('banner', b.id, v)} />
                      <button onClick={() => editBanner(b)} className="btn btn-icon"><Pencil size={15} /></button>
                      <button onClick={() => deleteBanner(b.id)} className="btn btn-icon-danger"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== COUPONS TAB ==================== */}
      {tab === 'coupons' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => { setEditingId(null); setCouponForm(emptyCoupon); setShowCouponForm(true) }}>
              <Plus size={16} /> {tr.addCoupon}
            </button>
          </div>
          <div className="card">
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>{tr.loading}</div>
            ) : coupons.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>{tr.noCoupons}</div>
            ) : (
              <div>
                {coupons.map(c => (
                  <div key={c.id} style={{ padding: '16px 20px', borderBottom: '1px solid #F1EDE4', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>ًںژ«</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: '#1A1A2E', letterSpacing: 1 }}>{c.code}</span>
                        <span style={{ background: '#059669', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 8 }}>-{c.discount_percent}%</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                        {c.used_count}/{c.max_uses || '∞'} {lang === 'ar' ? 'استخدام' : 'uses'}
                        {c.valid_until && <> · {lang === 'ar' ? 'ينتهي' : 'ends'} {new Date(c.valid_until).toLocaleDateString()}</>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Toggle value={c.is_active} onChange={v => toggleActive('coupons', c.id, v)} />
                      <button onClick={() => deleteCoupon(c.id)} className="btn btn-icon-danger"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== THEMES TAB ==================== */}
      {tab === 'themes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {lang === 'ar' ? 'اختيار الثيم' : 'Choose Theme'}
            </h2>
            <button className="btn btn-primary" onClick={() => { setThemeForm({ name: '', primary_color: '#C9A55F' }); setShowThemeForm(true) }}>
              <Plus size={16} /> {lang === 'ar' ? 'إضافة ثيم مخصص' : 'Add Custom Theme'}
            </button>
          </div>

          {/* ── Unsaved theme save bar ── */}
          {pendingTheme && (
            <div style={{
              position: 'sticky', top: 68, zIndex: 60, marginBottom: 20,
              background: 'linear-gradient(135deg, #059669, #10b981)',
              borderRadius: 14, padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
              boxShadow: '0 4px 24px rgba(5,150,105,0.35)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: pendingTheme.primary_color, border: '2px solid rgba(255,255,255,0.5)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    ⚠️ {lang === 'ar' ? 'ثيم غير محفوظ' : 'Unsaved Theme Change'}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    {lang === 'ar' ? 'اضغط "حفظ الثيم" لتطبيقه على الموقع العام بشكل دائم' : 'Click "Save Theme" to apply permanently to the public website'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setPendingTheme(null); try { localStorage.removeItem('public_theme_preview') } catch {} }}
                  style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={() => saveTheme(pendingTheme)} disabled={savingTheme}
                  style={{ padding: '8px 24px', borderRadius: 10, background: '#fff', color: '#059669', fontWeight: 700, fontSize: 13, border: 'none', cursor: savingTheme ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', opacity: savingTheme ? 0.7 : 1 }}>
                  <Check size={15} />
                  {savingTheme ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ الثيم' : 'Save Theme')}
                </button>
              </div>
            </div>
          )}

          {/* Predefined Themes */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 600 }}>{lang === 'ar' ? 'الثيمات الجاهزة' : 'Predefined Themes'}</h2></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { key: 'gold', color: '#C9A55F', labelAr: 'ذهبي', labelEn: 'Gold' },
                  { key: 'blue', color: '#2563EB', labelAr: 'أزرق', labelEn: 'Blue' },
                  { key: 'emerald', color: '#059669', labelAr: 'زمردي', labelEn: 'Emerald' },
                  { key: 'rose', color: '#BE185D', labelAr: 'وردي', labelEn: 'Rose' },
                  { key: 'light', color: '#2563EB', labelAr: 'فاتح', labelEn: 'Light' },
                  { key: 'dark', color: '#6366F1', labelAr: 'داكن', labelEn: 'Dark' },
                ].map(t => {
                  const active = pendingTheme || publicTheme
                  const isActive = active.theme === t.key
                  return (
                    <button key={t.key} onClick={() => selectTheme(t.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                        borderRadius: 12, cursor: 'pointer', border: isActive ? `2px solid ${t.color}` : '1px solid var(--border)',
                        background: isActive ? `${t.color}15` : 'var(--card)', transition: 'all 0.2s',
                      }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{lang === 'ar' ? t.labelAr : t.labelEn}</span>
                      {isActive && <Check size={14} color={t.color} style={{ marginInlineStart: 'auto' }} />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Custom Themes */}
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 600 }}>{lang === 'ar' ? 'الثيمات المخصصة' : 'Custom Themes'}</h2></div>
            <div className="card-body">
              {customThemes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                  {lang === 'ar' ? 'لا توجد ثيمات مخصصة. أضف ثيماً جديداً!' : 'No custom themes yet. Create one!'}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                  {customThemes.map(ct => {
                    const active = pendingTheme || publicTheme
                    const isActive = active.theme === `custom:${ct.id}`
                    return (
                      <div key={ct.id} style={{ position: 'relative' }}>
                        <button onClick={() => selectTheme(`custom:${ct.id}`, ct.primary_color)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                            borderRadius: 12, cursor: 'pointer', border: isActive ? `2px solid ${ct.primary_color}` : '1px solid var(--border)',
                            background: isActive ? `${ct.primary_color}15` : 'var(--card)', transition: 'all 0.2s', width: '100%',
                          }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: ct.primary_color, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ct.name}</span>
                          {isActive && <Check size={14} color={ct.primary_color} style={{ marginInlineStart: 'auto' }} />}
                        </button>
                        <button onClick={() => deleteCustomTheme(ct.id)}
                          style={{
                            position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%',
                            background: '#EF4444', border: '2px solid var(--card)', color: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                          }}>
                          <X size={11} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Show save hint when no pending change */}
          {!pendingTheme && (
            <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} color="#10b981" />
              {lang === 'ar'
                ? `الثيم المفعّل حالياً: ${publicTheme.theme} — اختر ثيماً جديداً لتظهر خيارات الحفظ`
                : `Active theme: ${publicTheme.theme} — Select a new theme to see save options`}
            </div>
          )}
        </div>
      )}

      {/* ==================== SETTINGS TAB ==================== */}
      {/* ==================== FEATURES TAB ==================== */}
      {tab === 'features' && (
        <div>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, color:'var(--text)', margin:0 }}>
                <Sparkles size={18} style={{ marginInlineEnd:8, verticalAlign:'middle', color:'var(--primary-500)' }} />
                {lang === 'ar' ? 'مميزات الصالون' : 'Salon Features'}
              </h2>
              <p style={{ fontSize:13, color:'var(--text-muted)', margin:'4px 0 0' }}>
                {lang === 'ar' ? 'أضف مميزات صالونك التي تظهر للزوار في الصفحة العامة' : 'Add features shown to visitors on the public page'}
              </p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-ghost" disabled={seedingFeatures}
                onClick={async () => {
                  if (!confirm(lang === 'ar' ? 'سيتم استبدال الميزات الحالية بالافتراضية. هل أنت متأكد؟' : 'This will replace current features with defaults. Sure?')) return
                  setSeedingFeatures(true)
                  const r = await fetch('/api/public-features', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ seed:true }) })
                  const d = await r.json()
                  if (Array.isArray(d)) setFeatures(d)
                  setSeedingFeatures(false)
                  setToast({ msg: lang === 'ar' ? 'تم تعبئة الميزات الافتراضية ✓' : 'Default features applied ✓', type:'success' })
                }}
                style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                <Sparkles size={14} /> {seedingFeatures ? '...' : (lang === 'ar' ? 'ميزات افتراضية' : 'Apply Defaults')}
              </button>
              <button className="btn btn-primary"
                onClick={() => { setEditingFeatureId(null); setFeatureForm({ icon:'✨', image_url:'', title_ar:'', title_en:'', description_ar:'', description_en:'', sort_order: features.length }); setShowFeatureForm(true) }}
                style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Plus size={16} /> {lang === 'ar' ? 'إضافة ميزة' : 'Add Feature'}
              </button>
            </div>
          </div>

          {/* Features grid */}
          {features.length === 0 ? (
            <div className="card">
              <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text-muted)' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>✨</div>
                <p style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>
                  {lang === 'ar' ? 'لا توجد ميزات بعد' : 'No features yet'}
                </p>
                <p style={{ fontSize:13 }}>
                  {lang === 'ar' ? 'اضغط "ميزات افتراضية" للبدء السريع أو أضف ميزة يدوياً' : 'Click "Apply Defaults" for quick start or add manually'}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
              {features.map((f: any) => (
                <div key={f.id} className="card" style={{ opacity: f.is_active ? 1 : 0.55, transition:'opacity 0.2s' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'16px 18px' }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:'var(--primary-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                      {f.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:15, color:'var(--text)', marginBottom:4 }}>{f.title_ar}</div>
                      <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>{f.description_ar}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end', gap:6, padding:'8px 14px 14px', borderTop:'1px solid var(--border)' }}>
                    <Toggle value={f.is_active} onChange={async v => {
                      await fetch('/api/public-features', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:f.id, is_active:v }) })
                      setFeatures(prev => prev.map(x => x.id===f.id ? {...x, is_active:v} : x))
                    }} />
                    <button className="btn btn-icon" onClick={() => {
                      setEditingFeatureId(f.id)
                      setFeatureForm({ icon:f.icon, image_url:f.image_url||'', title_ar:f.title_ar, title_en:f.title_en||'', description_ar:f.description_ar, description_en:f.description_en||'', sort_order:f.sort_order })
                      setShowFeatureForm(true)
                    }}><Pencil size={14} color="var(--primary-500)" /></button>
                    <button className="btn btn-icon" onClick={async () => {
                      if (!confirm(lang==='ar'?'حذف هذه الميزة؟':'Delete this feature?')) return
                      await fetch('/api/public-features', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:f.id }) })
                      setFeatures(prev => prev.filter(x => x.id!==f.id))
                      setToast({ msg: lang==='ar'?'تم الحذف':'Deleted', type:'success' })
                    }}><Trash2 size={14} color="#EF4444" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Feature Form Modal */}
          {showFeatureForm && (
            <div className="modal-overlay" onClick={() => setShowFeatureForm(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:22 }}>{featureForm.icon}</span>
                    {editingFeatureId ? (lang==='ar'?'تعديل الميزة':'Edit Feature') : (lang==='ar'?'إضافة ميزة':'Add Feature')}
                  </h2>
                  <button className="btn btn-icon" onClick={() => setShowFeatureForm(false)}><X size={18}/></button>
                </div>
                <div className="modal-body">
                  {/* ── صورة أو أيقونة ── */}
                  <div style={{ marginBottom:14, padding:14, background:'#F9FAFB', borderRadius:12, border:'1px solid #E5E7EB' }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:10 }}>
                      {lang==='ar' ? 'الأيقونة أو الصورة' : 'Icon or Image'}
                    </div>
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                      {/* Preview */}
                      <div style={{ width:72, height:72, borderRadius:14, border:'2px dashed #D1D5DB', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden', fontSize:30 }}>
                        {featureForm.image_url
                          ? <img src={featureForm.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : featureForm.icon || '✨'}
                      </div>
                      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                        {/* Emoji input */}
                        <div style={{ display:'flex', gap:8 }}>
                          <div style={{ flex:1 }}>
                            <label style={{ fontSize:11, color:'#9CA3AF', display:'block', marginBottom:3 }}>إيموجي</label>
                            <input className="input-field" value={featureForm.icon} onChange={e => setFeatureForm(f=>({...f, icon:e.target.value, image_url:''}))} style={{ fontSize:18, textAlign:'center' }} maxLength={4} placeholder="✨" />
                          </div>
                          <div style={{ flex:2 }}>
                            <label style={{ fontSize:11, color:'#9CA3AF', display:'block', marginBottom:3 }}>الترتيب</label>
                            <input className="input-field" type="number" min={0} value={featureForm.sort_order} onChange={e => setFeatureForm(f=>({...f, sort_order:+e.target.value}))} />
                          </div>
                        </div>
                        {/* Image uploader */}
                        <ImageUploader
                          label={lang==='ar' ? 'أو ارفع صورة (تستبدل الإيموجي)' : 'Or upload image (replaces emoji)'}
                          value={featureForm.image_url}
                          onChange={(v: string) => setFeatureForm(f=>({...f, image_url:v}))}
                        />
                        {featureForm.image_url && (
                          <button onClick={() => setFeatureForm(f=>({...f, image_url:''}))}
                            style={{ background:'none', border:'none', color:'#EF4444', cursor:'pointer', fontSize:12, textAlign:'start', padding:0 }}>
                            ✕ {lang==='ar'?'حذف الصورة واستخدام الإيموجي':'Remove image & use emoji'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div><label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:5 }}>العنوان (عربي) *</label><input className="input-field" value={featureForm.title_ar} onChange={e => setFeatureForm(f=>({...f, title_ar:e.target.value}))} /></div>
                    <div><label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:5 }}>Title (English)</label><input className="input-field" value={featureForm.title_en} onChange={e => setFeatureForm(f=>({...f, title_en:e.target.value}))} dir="ltr" /></div>
                  </div>
                  <div style={{ marginTop:10 }}>
                    <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:5 }}>الوصف (عربي)</label>
                    <textarea className="input-field" rows={3} value={featureForm.description_ar} onChange={e => setFeatureForm(f=>({...f, description_ar:e.target.value}))} />
                  </div>
                  <div style={{ marginTop:8 }}>
                    <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:5 }}>Description (English)</label>
                    <textarea className="input-field" rows={2} value={featureForm.description_en} onChange={e => setFeatureForm(f=>({...f, description_en:e.target.value}))} dir="ltr" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={() => setShowFeatureForm(false)}>{tr.cancel}</button>
                  <button className="btn btn-primary" disabled={!featureForm.title_ar} onClick={async () => {
                    try {
                      if (editingFeatureId) {
                        await fetch('/api/public-features', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:editingFeatureId, ...featureForm }) })
                      } else {
                        await fetch('/api/public-features', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(featureForm) })
                      }
                      await loadFeatures()
                      setShowFeatureForm(false)
                      setEditingFeatureId(null)
                      setToast({ msg: editingFeatureId ? 'تم التعديل ✓' : 'تمت الإضافة ✓', type:'success' })
                    } catch { setToast({ msg:'حدث خطأ', type:'error' }) }
                  }}>{tr.save}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div>
          {/* ── شريط الإجراءات ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{lang === 'ar' ? 'إعدادات الصفحة العامة' : 'Public Page Settings'}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{lang === 'ar' ? 'تحكم في محتوى وإعدادات موقعك العام' : 'Control your public website content and settings'}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={applyDefaultSettings} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={15} /> {lang === 'ar' ? 'إعدادات افتراضية' : 'Apply Defaults'}
              </button>
              <button className="btn btn-primary" onClick={saveSettings} disabled={savingSettings} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Settings size={15} />{savingSettings ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>

            {/* ── معلومات الصفحة ── */}
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Globe size={15} /> {lang === 'ar' ? 'معلومات الصفحة' : 'Page Info'}
                </h2>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 5, fontWeight: 500 }}>{lang === 'ar' ? 'عنوان الصفحة (عربي)' : 'Page Title (Arabic)'}</label>
                    <input className="input-field" value={settingsForm.page_title_ar || ''} onChange={e => setSettingsForm((f: any) => ({ ...f, page_title_ar: e.target.value }))} placeholder={lang === 'ar' ? `${settings?.name || 'الصالون'} | صالون تجميل` : ''} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 5, fontWeight: 500 }}>Page Title (English)</label>
                    <input className="input-field" value={settingsForm.page_title_en || ''} onChange={e => setSettingsForm((f: any) => ({ ...f, page_title_en: e.target.value }))} placeholder="Salon Name | Beauty Salon" dir="ltr" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── واتساب ── */}
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <MessageCircle size={15} /> {tr.whatsappConfig || 'إعدادات واتساب'}
                </h2>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 5, fontWeight: 500 }}>{tr.whatsappNumber || 'رقم واتساب'}</label>
                    <input className="input-field" value={settingsForm.whatsapp_number || ''} onChange={e => setSettingsForm((f: any) => ({ ...f, whatsapp_number: e.target.value }))} placeholder="9665XXXXXXXX" dir="ltr" />
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>بدون + ومع رمز الدولة (966)</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 5, fontWeight: 500 }}>{tr.whatsappMessage || 'الرسالة التلقائية'}</label>
                    <textarea className="input-field" rows={3} value={settingsForm.whatsapp_message || ''} onChange={e => setSettingsForm((f: any) => ({ ...f, whatsapp_message: e.target.value }))} placeholder="مرحباً، أرغب بالاستفسار عن الخدمات" />
                  </div>
                  {settingsForm.whatsapp_number && (
                    <a href={`https://wa.me/${settingsForm.whatsapp_number}?text=${encodeURIComponent(settingsForm.whatsapp_message || '')}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>
                      ✓ اختبار الرابط
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ── SEO ── */}
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Globe size={15} /> {tr.seo || 'تحسين محركات البحث (SEO)'}
                </h2>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 5, fontWeight: 500 }}>{tr.seoTitle || 'عنوان SEO'}</label>
                    <input className="input-field" value={settingsForm.seo_title || ''} onChange={e => setSettingsForm((f: any) => ({ ...f, seo_title: e.target.value }))} placeholder={`${settings?.name || 'الصالون'} - صالون تجميل في ${settings?.city || 'جدة'}`} />
                    <p style={{ fontSize: 11, color: (settingsForm.seo_title || '').length > 60 ? '#EF4444' : '#9CA3AF', marginTop: 4 }}>{(settingsForm.seo_title || '').length}/60 حرف</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 5, fontWeight: 500 }}>{tr.seoDescription || 'وصف SEO'}</label>
                    <textarea className="input-field" rows={3} value={settingsForm.seo_description || ''} onChange={e => setSettingsForm((f: any) => ({ ...f, seo_description: e.target.value }))} placeholder="وصف مختصر للموقع (155 حرف مثالي)" />
                    <p style={{ fontSize: 11, color: (settingsForm.seo_description || '').length > 155 ? '#EF4444' : '#9CA3AF', marginTop: 4 }}>{(settingsForm.seo_description || '').length}/155 حرف</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 5, fontWeight: 500 }}>{tr.seoKeywords || 'الكلمات المفتاحية'}</label>
                    <input className="input-field" value={settingsForm.seo_keywords || ''} onChange={e => setSettingsForm((f: any) => ({ ...f, seo_keywords: e.target.value }))} placeholder="صالون, تجميل, عناية بالبشرة, جدة" />
                  </div>
                  <ImageUploader label={tr.ogImage || 'صورة المشاركة (OG Image)'} value={settingsForm.seo_image || ''} onChange={(v: string) => setSettingsForm((f: any) => ({ ...f, seo_image: v }))} />
                </div>
              </div>
            </div>

            {/* ── وسائل التواصل الاجتماعي — ديناميكية مع حفظ فوري ── */}
            <SocialLinksEditor
              links={(settingsForm as any).social_links || []}
              onChange={(links: any[]) => setSettingsForm((f: any) => ({ ...f, social_links: links }))}
              lang={lang}
              onSave={async (links: any[]) => {
                const r = await fetch('/api/public-social-links', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ social_links: links }),
                })
                const d = await r.json()
                if (d.ok) setToast({ msg: links.length === 0 ? 'تم حذف الرابط ✓' : 'تم حفظ الروابط ✓', type: 'success' })
                else setToast({ msg: 'حُفظ محلياً (DB غير متصل)', type: 'success' })
              }}
            />

            {/* ── معاينة SEO ── */}
            {(settingsForm.seo_title || settingsForm.seo_description) && (
              <div className="card">
                <div className="card-header">
                  <h2 style={{ fontSize: 15, fontWeight: 600 }}>🔍 معاينة نتيجة البحث</h2>
                </div>
                <div className="card-body">
                  <div style={{ padding: 16, background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: 11, color: '#22863A', marginBottom: 4, direction: 'ltr' }}>localhost:3001/public</div>
                    <div style={{ fontSize: 18, color: '#1A0DAB', fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
                      {settingsForm.seo_title || settings?.name || 'عنوان الصفحة'}
                    </div>
                    <div style={{ fontSize: 13, color: '#545454', lineHeight: 1.6 }}>
                      {settingsForm.seo_description || 'وصف الصفحة سيظهر هنا...'}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ── زر الحفظ السفلي ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={applyDefaultSettings} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={15} /> {lang === 'ar' ? 'إعدادات افتراضية' : 'Apply Defaults'}
            </button>
            <button className="btn btn-primary" onClick={saveSettings} disabled={savingSettings} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 28px' }}>
              <Settings size={15} />{savingSettings ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ جميع الإعدادات' : 'Save All Settings')}
            </button>
          </div>
        </div>
      )}

      {/* ==================== STATS TAB ==================== */}
      {tab === 'stats' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['today', 'week', 'month', 'all'].map(p => (
              <button key={p} onClick={() => setStatsPeriod(p as any)}
                className={statsPeriod === p ? "btn btn-chip active" : "btn btn-chip"}>
                {p === 'today' ? tr.today : p === 'week' ? tr.thisWeek : p === 'month' ? tr.thisMonth : tr.allTime}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)' }}>{statsData?.totalViews || 0}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{tr.views}</div>
            </div>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)' }}>{statsData?.totalClicks || 0}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{tr.clicks}</div>
            </div>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)' }}>{statsData?.totalBookings || 0}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{tr.bookings}</div>
            </div>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: statsData?.conversionRate > 10 ? '#059669' : 'var(--gold)' }}>{statsData?.conversionRate || 0}%</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{tr.conversion}</div>
            </div>
          </div>

          {/* Per-offer stats */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 600 }}>{lang === 'ar' ? 'إحصائيات العروض' : 'Offer Stats'}</h2></div>
            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'العرض' : 'Offer'}</th>
                    <th>{tr.views}</th>
                    <th>{tr.clicks}</th>
                    <th>{tr.bookings}</th>
                    <th>{tr.conversion}</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.filter(o => o.is_active).map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>{o.title_ar}</td>
                      <td>{o.views_count || 0}</td>
                      <td>{o.clicks_count || 0}</td>
                      <td>{o.bookings_count || 0}</td>
                      <td>{o.views_count > 0 ? ((o.bookings_count || 0) / o.views_count * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showOfferForm && renderOfferForm()}
      {showAdForm && renderAdForm()}
      {showReviewForm && renderReviewForm()}
      {showBannerForm && renderBannerForm()}
      {showCouponForm && renderCouponForm()}

      {/* Custom Theme Form Modal */}
      {showThemeForm && (
        <div className="modal-overlay" onClick={() => { setShowThemeForm(false); setThemeForm({ name: '', primary_color: '#C9A55F' }) }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Palette size={18} /> {lang === 'ar' ? 'إضافة ثيم مخصص' : 'Add Custom Theme'}</h2>
              <button className="modal-close" onClick={() => { setShowThemeForm(false); setThemeForm({ name: '', primary_color: '#C9A55F' }) }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <div style={{ marginBottom: 14 }}>
                  <label>{lang === 'ar' ? 'اسم الثيم' : 'Theme Name'}</label>
                  <input className="input-field" value={themeForm.name} onChange={e => setThemeForm(f => ({ ...f, name: e.target.value }))} placeholder={lang === 'ar' ? 'مثال: ثيمي الأزرق' : 'My Blue Theme'} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label>{lang === 'ar' ? 'اللون الأساسي' : 'Primary Color'}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="color" value={themeForm.primary_color}
                      onChange={e => setThemeForm(f => ({ ...f, primary_color: e.target.value }))}
                      style={{ width: 48, height: 48, borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
                    <input className="input-field" value={themeForm.primary_color}
                      onChange={e => setThemeForm(f => ({ ...f, primary_color: e.target.value }))}
                      placeholder="#C9A55F" style={{ fontFamily: 'monospace', flex: 1 }} />
                  </div>
                </div>
                <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: `${themeForm.primary_color}15`, border: `1px solid ${themeForm.primary_color}30` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{lang === 'ar' ? 'معاينة' : 'Preview'}</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: themeForm.primary_color }} />
                    <button style={{ padding: '8px 18px', borderRadius: 10, background: themeForm.primary_color, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none' }}>
                      {lang === 'ar' ? 'زر تجريبي' : 'Sample Button'}
                    </button>
          </div>
          </div>
            </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setShowThemeForm(false); setThemeForm({ name: '', primary_color: '#C9A55F' }) }}>{tr.cancel}</button>
              <button className="btn btn-primary" onClick={saveCustomTheme} disabled={!themeForm.name || !themeForm.primary_color}>
                <Palette size={16} /> {lang === 'ar' ? 'إضافة الثيم' : 'Add Theme'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,0.5); }
        .modal-content { background: white; border-radius: 20px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; animation: modalIn 0.25s ease; }
        .modal-wide { max-width: 700px; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #F1EDE4; }
        .modal-header h2 { font-size: 16px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 8px; }
        .modal-close { background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 4px; border-radius: 8px; }
        .modal-close:hover { background: #F3F4F6; color: #374151; }
        .modal-body { padding: 20px 24px; }
        .modal-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid #F1EDE4; }
        .form-section { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #F1EDE4; }
        .form-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .form-section h3 { font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px; }
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .form-section label { font-size: 12px; color: #6B7280; display: block; margin-bottom: 4px; }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 640px) { .form-grid-2, .form-grid-3 { grid-template-columns: 1fr; } .modal-content { max-width: 100%; border-radius: 16px; margin: 8px; } }
      `}</style>
    </div>
  )
}

