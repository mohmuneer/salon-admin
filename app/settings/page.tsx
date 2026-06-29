'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLang, useTheme, Theme } from '@/app/layout'
import { t } from '@/lib/translations'
import { useSalonSettings } from '@/lib/useSalonSettings'
import {
  User, Phone, Mail, ShieldCheck, Check, Save, Image, Store, MapPin,
  Palette, Paintbrush, Type, Maximize2, Globe, Bell, Mail as MailIcon,
  MessageSquare, Smartphone, Calendar,
} from 'lucide-react'

const THEMES: { key: Theme; color: string; labelAr: string; labelEn: string }[] = [
  { key: 'light',   color: '#2563EB', labelAr: 'فاتح', labelEn: 'Light' },
  { key: 'dark',    color: '#6366F1', labelAr: 'داكن', labelEn: 'Dark' },
  { key: 'gold',    color: '#B8924A', labelAr: 'ذهبي', labelEn: 'Gold' },
  { key: 'blue',    color: '#2563EB', labelAr: 'أزرق', labelEn: 'Blue' },
  { key: 'emerald', color: '#059669', labelAr: 'زمردي', labelEn: 'Emerald' },
  { key: 'rose',    color: '#BE185D', labelAr: 'وردي', labelEn: 'Rose' },
]

export default function SettingsPage() {
  const { lang } = useLang()
  const tr = t[lang]
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const user = session?.user as any
  const { settings: loadedSettings, loaded, refresh: refreshSettings } = useSalonSettings()

  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentPrimary, setCurrentPrimary] = useState('#B8924A')

  useEffect(() => {
    setMounted(true)
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    if (primary) setCurrentPrimary(primary)
  }, [])

  useEffect(() => {
    fetch('/api/settings/theme', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme }) })
  }, [theme])

  useEffect(() => {
    if (loaded && !initialized) {
      setForm(loadedSettings)
      setInitialized(true)
    }
  }, [loaded, loadedSettings, initialized])

  const uploadLogo = async (file: File) => {
    setUploading(true); setError('')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) { throw new Error('Upload failed') }
      const data = await res.json()
      if (!data.url) { throw new Error('No URL returned') }
      setForm((f: any) => ({ ...f, logo_url: data.url }))
    } catch {
      setError(lang === 'ar' ? 'فشل رفع الشعار' : 'Logo upload failed')
    }
    setUploading(false)
  }

  const save = async () => {
    setSaving(true); setError(''); setSaved(false)
    const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, theme }) })
    const txt = await res.text()
    if (!res.ok) { setError((lang === 'ar' ? 'فشل الحفظ: ' : 'Save failed: ') + txt); setSaving(false); return }
    setSaved(true); setSaving(false); refreshSettings(); setTimeout(() => setSaved(false), 3000)
  }

  const isRtl = lang === 'ar'

  return (
    <div>
      <div className="page-header">
        <h1>{tr.settingsTitle}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>

        {/* Salon Settings */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <Store size={16} />{lang === 'ar' ? 'بيانات الصالون' : 'Salon Info'}
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{lang === 'ar' ? 'شعار الصالون' : 'Salon Logo'}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {form.logo_url && (
                    <img src={form.logo_url} alt="logo" style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', border: '1px solid var(--border)' }} />
                  )}
                  <label className="btn btn-ghost">
                    <Image size={14} />{uploading ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (lang === 'ar' ? 'اختيار شعار' : 'Choose Logo')}
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{lang === 'ar' ? 'اسم الصالون (عربي)' : 'Salon Name (Arabic)'}</label>
                <input className="input-field" type="text" value={form.name || ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{lang === 'ar' ? 'اسم الصالون (إنجليزي)' : 'Salon Name (English)'}</label>
                <input className="input-field" type="text" value={form.name_en || ''} onChange={e => setForm((f: any) => ({ ...f, name_en: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{lang === 'ar' ? 'العنوان' : 'Address'}</label>
                <input className="input-field" type="text" value={form.address || ''} onChange={e => setForm((f: any) => ({ ...f, address: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{lang === 'ar' ? 'رقم الجوال' : 'Phone'}</label>
                  <input className="input-field" type="tel" value={form.phone || ''} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input className="input-field" type="email" value={form.email || ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{lang === 'ar' ? 'فتح' : 'Opens'}</label>
                  <input className="input-field" type="time" value={form.opening_time || '10:00'} onChange={e => setForm((f: any) => ({ ...f, opening_time: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{lang === 'ar' ? 'إغلاق' : 'Closes'}</label>
                  <input className="input-field" type="time" value={form.closing_time || '22:00'} onChange={e => setForm((f: any) => ({ ...f, closing_time: e.target.value }))} />
                </div>
              </div>

              {error && <div style={{ color: '#EF4444', fontSize: 13 }}>{error}</div>}

              <button className="btn btn-primary" onClick={save} disabled={saving}>
                <Save size={16} />{saving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ البيانات' : 'Save')}
              </button>
              {saved && <span style={{ color: '#10B981', fontSize: 13 }}>{lang === 'ar' ? 'تم الحفظ بنجاح ✓' : 'Saved successfully ✓'}</span>}
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <Palette size={16} />{tr.themeSettings}
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {THEMES.map(({ key, color, labelAr, labelEn }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    border: theme === key ? `2px solid ${color}` : '1px solid var(--border)',
                    background: theme === key ? `${color}12` : 'var(--card)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{lang === 'ar' ? labelAr : labelEn}</span>
                  {theme === key && <Check size={14} color={color} style={{ marginInlineStart: 'auto' }} />}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                {lang === 'ar' ? 'خيارات التخصيص' : 'Customization Options'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    <Paintbrush size={12} style={{ marginInlineEnd: 4 }} />
                    {lang === 'ar' ? 'لون الثيم الأساسي' : 'Primary Color'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="color"
                      value={currentPrimary}
                      onChange={(e) => {
                        const v = e.target.value
                        document.documentElement.style.setProperty('--primary', v)
                        document.documentElement.style.setProperty('--primary-light', v + 'aa')
                        document.documentElement.style.setProperty('--primary-dark', v)
                        document.documentElement.style.setProperty('--primary-bg', v + '14')
                        document.documentElement.style.setProperty('--primary-border', v + '33')
                      }}
                      style={{ width: 40, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {lang === 'ar' ? 'اختر لوناً مخصصاً' : 'Pick a custom color'}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    <Maximize2 size={12} style={{ marginInlineEnd: 4 }} />
                    {lang === 'ar' ? 'زوايا البطاقات' : 'Border Radius'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {[8, 12, 16, 20, 24].map(r => (
                      <button
                        key={r}
                        onClick={() => {
                          document.documentElement.style.setProperty('--radius-sm', r - 2 + 'px')
                          document.documentElement.style.setProperty('--radius-md', r + 'px')
                          document.documentElement.style.setProperty('--radius-lg', r + 4 + 'px')
                          document.documentElement.style.setProperty('--radius-xl', r + 8 + 'px')
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    <Type size={12} style={{ marginInlineEnd: 4 }} />
                    {lang === 'ar' ? 'نوع الخط' : 'Font Family'}
                  </label>
                  <select
                    className="input-field"
                    onChange={(e) => {
                      document.documentElement.style.setProperty('--font', e.target.value)
                    }}
                    style={{ fontSize: 13 }}
                  >
                    <option value="'Segoe UI', system-ui, sans-serif">Segoe UI</option>
                    <option value="'Inter', system-ui, sans-serif">Inter</option>
                    <option value="'Tajawal', sans-serif">Tajawal</option>
                    <option value="'Cairo', sans-serif">Cairo</option>
                    <option value="'Noto Sans Arabic', sans-serif">Noto Sans Arabic</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <MailIcon size={16} />{lang === 'ar' ? 'إعدادات البريد الإلكتروني' : 'Email Settings'}
            </h2>
          </div>
          <div className="card-body">
            <div style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
              {lang === 'ar'
                ? '📧 يُستخدم لإرسال إشعارات الحجز والطلبات للعملاء. استخدم Gmail مع "App Password".'
                : '📧 Used to send booking & order notifications. Use Gmail with an App Password.'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  {lang === 'ar' ? 'بريد المرسل (Gmail)' : 'Sender Email (Gmail)'}
                </label>
                <input
                  className="input-field" type="email"
                  placeholder="example@gmail.com"
                  value={form.email_user || ''}
                  onChange={e => setForm((f: any) => ({ ...f, email_user: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  {lang === 'ar' ? 'كلمة مرور التطبيق (App Password)' : 'App Password'}
                </label>
                <input
                  className="input-field" type="password"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={form.email_pass || ''}
                  onChange={e => setForm((f: any) => ({ ...f, email_pass: e.target.value }))}
                />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {lang === 'ar'
                    ? 'احصل عليها من: Google Account ← Security ← App Passwords'
                    : 'Get it from: Google Account → Security → App Passwords'}
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                <Save size={16} />{saving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ إعدادات الإيميل' : 'Save Email Settings')}
              </button>
              {saved && <span style={{ color: '#10B981', fontSize: 13 }}>{lang === 'ar' ? 'تم الحفظ بنجاح ✓' : 'Saved ✓'}</span>}
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <User size={16} />{tr.accountInfo}
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 22, fontWeight: 700,
              }}>
                {user?.name?.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>{user?.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--primary)' }}>
                  <ShieldCheck size={12} />
                  {user?.role === 'admin' ? tr.roleAdmin : tr.roleStaff}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text)' }}>
                <User size={16} color="var(--primary)" />
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{tr.name}:</span>
                {user?.name}
              </div>
              {user?.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text)' }}>
                  <Phone size={16} color="var(--primary)" />
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{tr.phone}:</span>
                  {user.phone}
                </div>
              )}
              {user?.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text)' }}>
                  <Mail size={16} color="var(--primary)" />
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{tr.email}:</span>
                  {user.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <Globe size={16} />{lang === 'ar' ? 'إعدادات اللغة' : 'Language Settings'}
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  {lang === 'ar' ? 'لغة الواجهة' : 'Interface Language'}
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{ key: 'ar', label: 'العربية', flag: '🇸🇦' }, { key: 'en', label: 'English', flag: '🇬🇧' }].map(l => (
                    <button
                      key={l.key}
                      className={`btn btn-ghost ${lang === l.key ? 'active' : ''}`}
                      disabled={lang === l.key}
                    >
                      <span style={{ fontSize: 20 }}>{l.flag}</span>
                      <span style={{ color: 'var(--text)' }}>{l.label}</span>
                      {lang === l.key && <Check size={16} color="var(--primary)" style={{ marginInlineStart: 'auto' }} />}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>
                  {lang === 'ar' ? '💡 ملاحظة' : '💡 Note'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {lang === 'ar'
                    ? 'يمكنك التبديل بين اللغتين العربية والإنجليزية في أي وقت من أيقونة اللغة في الشريط العلوي.'
                    : 'You can switch between Arabic and English anytime using the language icon in the top header.'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  {lang === 'ar' ? 'تنسيق الأرقام والعملة' : 'Number & Currency Format'}
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { label: lang === 'ar' ? 'عربي (ر.س)' : 'Arabic (SAR)', sub: lang === 'ar' ? '١٬٢٣٤٫٥٦ ر.س' : '1,234.56 SAR' },
                    { label: 'English (SAR)', sub: 'SAR 1,234.56' },
                  ].map((f, i) => (
                    <button key={i} className="btn btn-secondary">
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{f.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{f.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <Bell size={16} />{lang === 'ar' ? 'تفضيلات الإشعارات' : 'Notification Preferences'}
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { icon: Calendar, label: lang === 'ar' ? 'حجوزات جديدة' : 'New Bookings', desc: lang === 'ar' ? 'عند إضافة حجز جديد' : 'When a new booking is made', on: true },
                { icon: Bell, label: lang === 'ar' ? 'تذكير بالمواعيد' : 'Appointment Reminders', desc: lang === 'ar' ? 'قبل الموعد بـ 30 دقيقة' : '30 min before appointment', on: true },
                { icon: MessageSquare, label: lang === 'ar' ? 'إلغاء الحجوزات' : 'Cancellations', desc: lang === 'ar' ? 'عند إلغاء أي حجز' : 'When a booking is cancelled', on: true },
                { icon: User, label: lang === 'ar' ? 'حضور الموظفين' : 'Staff Check-ins', desc: lang === 'ar' ? 'عند تسجيل دخول الموظف' : 'When staff checks in', on: false },
                { icon: Bell, label: lang === 'ar' ? 'إشعارات النظام' : 'System Updates', desc: lang === 'ar' ? 'تحديثات النظام والصيانة' : 'System updates & maintenance', on: true },
                { icon: MailIcon, label: lang === 'ar' ? 'التقارير الأسبوعية' : 'Weekly Reports', desc: lang === 'ar' ? 'تقرير أداء أسبوعي' : 'Weekly performance report', on: false },
              ].map((n, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 4px', borderBottom: i < 5 ? '1px solid var(--border-light)' : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: n.on ? 'var(--primary-bg)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <n.icon size={16} color={n.on ? 'var(--primary)' : 'var(--text-muted)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{n.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.desc}</div>
                  </div>
                  <button
                    onClick={() => {}}
                    className={`btn btn-toggle ${n.on ? 'on' : 'off'}`}
                  >
                    <div className="toggle-knob" />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Smartphone size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {lang === 'ar' ? 'إشعارات الجوال' : 'Push Notifications'}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#10B981', fontWeight: 500 }}>
                  {lang === 'ar' ? 'مفعلة ✓' : 'Enabled ✓'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MailIcon size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {lang === 'ar' ? 'الإشعارات البريدية' : 'Email Notifications'}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>
                  {lang === 'ar' ? 'بريد يومي' : 'Daily digest'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
