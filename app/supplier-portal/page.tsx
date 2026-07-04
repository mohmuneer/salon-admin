'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Truck, LogOut, CalendarPlus, Building2, Clock, MessageSquare, X, Loader2, Phone, Package, Paperclip, FileText,
  LayoutGrid, BarChart3, Settings as SettingsIcon, Warehouse, Layers, Mail, KeyRound, Check, Palette,
  Search, ChevronRight, ChevronLeft, Star, TrendingUp,
} from 'lucide-react'
import { useSupplierAuth } from '@/components/SupplierAuthContext'

const STATUS_LABEL: Record<string, string> = {
  pending: 'قيد الانتظار',
  approved: 'تمت الموافقة',
  rejected: 'مرفوض',
  completed: 'مكتمل',
  cancelled: 'ملغى',
}
const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
  completed: '#6366F1',
  cancelled: '#9CA3AF',
}

const THEMES: { key: string; label: string; color: string }[] = [
  { key: 'gold', label: 'ذهبي', color: '#C9A24B' },
  { key: 'light', label: 'فاتح', color: '#2563EB' },
  { key: 'dark', label: 'داكن', color: '#111827' },
  { key: 'blue', label: 'أزرق', color: '#2563EB' },
  { key: 'emerald', label: 'زمردي', color: '#059669' },
  { key: 'rose', label: 'وردي', color: '#BE185D' },
]

type Tab = 'overview' | 'stats' | 'items' | 'settings'

export default function SupplierDashboardPage() {
  const router = useRouter()
  const { supplier, loading, logout } = useSupplierAuth()
  const [profile, setProfile] = useState<any>(null)
  const [theme, setTheme] = useState('gold')
  const [tab, setTab] = useState<Tab>('overview')

  useEffect(() => {
    if (!loading && !supplier) router.replace('/supplier-portal/login')
  }, [loading, supplier, router])

  const loadProfile = () => {
    if (!supplier) return
    fetch(`/api/public-supplier-profile?id=${supplier.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setProfile(data)
          if (data.theme) setTheme(data.theme)
        }
      })
      .catch(() => {})
  }

  useEffect(() => { loadProfile() }, [supplier?.id])

  if (loading || !supplier) return null

  return (
    <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--bg, #F7F7FA)', display: 'flex', flexDirection: 'column' }}>
      <HeaderBar supplier={supplier} logout={logout} />
      <TabBar tab={tab} setTab={setTab} />
      <div style={{ flex: 1, padding: '24px 16px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        {tab === 'overview' && <OverviewTab supplier={supplier} />}
        {tab === 'stats' && <StatsTab profile={profile} goToItems={() => setTab('items')} />}
        {tab === 'items' && <ItemsTab supplierId={supplier.id} />}
        {tab === 'settings' && (
          <SettingsTab
            supplier={supplier}
            profile={profile}
            theme={theme}
            onSaved={updated => { setProfile((p: any) => ({ ...p, ...updated })); if (updated.theme) setTheme(updated.theme) }}
          />
        )}
      </div>
    </div>
  )
}

function HeaderBar({ supplier, logout }: { supplier: { name_ar: string }; logout: () => void }) {
  return (
    <div style={{
      padding: '16px 20px', background: 'var(--card, #fff)', borderBottom: '1px solid var(--border, #eee)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Truck size={22} color="var(--primary, #C9A24B)" />
        <div style={{ fontWeight: 800, fontSize: 16 }}>بوابة الموردين</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{supplier.name_ar}</span>
        <button className="btn btn-ghost" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <LogOut size={16} /> تسجيل الخروج
        </button>
      </div>
    </div>
  )
}

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'نظرة عامة', icon: <LayoutGrid size={15} /> },
    { key: 'stats', label: 'الإحصائيات', icon: <BarChart3 size={15} /> },
    { key: 'items', label: 'الأصناف', icon: <Package size={15} /> },
    { key: 'settings', label: 'الإعدادات', icon: <SettingsIcon size={15} /> },
  ]
  return (
    <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '0 16px', display: 'flex', gap: 4, maxWidth: 720, margin: '0 auto', width: '100%', overflowX: 'auto' }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => setTab(t.key)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px', border: 'none', background: 'none',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
          }}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  )
}

function OverviewTab({ supplier }: { supplier: { id: string; name_ar: string; name_en?: string; phone: string; email?: string } }) {
  const [branches, setBranches] = useState<any[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBook, setShowBook] = useState(false)
  const [form, setForm] = useState({ branchId: '', visitDate: '', visitTime: '', purpose: '', attachmentUrl: '', attachmentName: '' })
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/public-branches').then(r => r.ok ? r.json() : []).then(setBranches).catch(() => setBranches([])),
      fetch(`/api/public-supplier-visits?supplierId=${supplier.id}`).then(r => r.ok ? r.json() : []).then(setVisits).catch(() => setVisits([])),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [supplier.id])

  const uploadAttachment = async (file: File) => {
    setUploadError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/public-supplier-visit-attachment', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error || 'فشل رفع الملف'); return }
      setForm(f => ({ ...f, attachmentUrl: data.url, attachmentName: data.name }))
    } catch {
      setUploadError('تعذر رفع الملف')
    } finally {
      setUploading(false)
    }
  }

  const submitVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.visitDate || !form.visitTime) { setError('التاريخ والوقت مطلوبان'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/public-supplier-visits', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: supplier.id, branchId: form.branchId || null, visitDate: form.visitDate, visitTime: form.visitTime,
          purpose: form.purpose, attachmentUrl: form.attachmentUrl || null, attachmentName: form.attachmentName || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'حدث خطأ'); return }
      setMessage(data.message || 'تم إرسال طلب الزيارة')
      setForm({ branchId: '', visitDate: '', visitTime: '', purpose: '', attachmentUrl: '', attachmentName: '' })
      setShowBook(false)
      load()
      setTimeout(() => setMessage(''), 4000)
    } finally {
      setSubmitting(false)
    }
  }

  const cancelVisit = async (id: string) => {
    if (!confirm('هل تريد إلغاء طلب الزيارة هذا؟')) return
    await fetch('/api/public-supplier-visits', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, supplierId: supplier.id, action: 'cancel' }),
    })
    load()
  }

  return (
    <div>
      {/* Supplier Info Card */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--primary-50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Truck size={28} color="var(--primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{supplier.name_ar}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Phone size={12} /> {supplier.phone}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowBook(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <CalendarPlus size={16} /> طلب زيارة جديدة
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <StatCard
          icon={<CalendarPlus size={18} />}
          label="إجمالي الزيارات"
          value={visits.length}
          color="#6366F1"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="قيد الانتظار"
          value={visits.filter(v => v.status === 'pending').length}
          color="#F59E0B"
        />
      </div>

      {message && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
          {message}
        </div>
      )}

      {/* Book Visit Modal */}
      {showBook && (
        <div className="modal-overlay" onClick={() => setShowBook(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>طلب زيارة جديدة</h2>
              <button className="btn btn-icon" onClick={() => setShowBook(false)}><X size={18} /></button>
            </div>
            <form onSubmit={submitVisit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      <Building2 size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} /> الفرع
                    </label>
                    <select className="input-field" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
                      <option value="">أي فرع</option>
                      {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>التاريخ</label>
                      <input type="date" className="input-field" value={form.visitDate} onChange={e => setForm({ ...form, visitDate: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                        <Clock size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} /> الوقت
                      </label>
                      <input type="time" className="input-field" value={form.visitTime} onChange={e => setForm({ ...form, visitTime: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      <MessageSquare size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} /> سبب الزيارة
                    </label>
                    <textarea className="input-field" rows={3} value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="مثال: توريد منتجات، عرض كتالوج جديد..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      <Paperclip size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} /> مرفق (صورة أو ملف PDF) — اختياري
                    </label>
                    <label className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      {uploading ? <Loader2 size={14} className="spin" /> : <Paperclip size={14} />}
                      {uploading ? 'جاري الرفع...' : 'اختيار ملف'}
                      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadAttachment(f) }} disabled={uploading} />
                    </label>
                    {form.attachmentName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                        <FileText size={13} /> {form.attachmentName}
                        <button type="button" title="إزالة المرفق" className="btn btn-icon" style={{ width: 22, height: 22 }} onClick={() => setForm(f => ({ ...f, attachmentUrl: '', attachmentName: '' }))}>
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    {uploadError && <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{uploadError}</div>}
                  </div>
                  {error && <div style={{ color: '#EF4444', fontSize: 13 }}>{error}</div>}
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowBook(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visit History */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>طلبات الزيارة السابقة</h2>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{visits.length} طلب</span>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
            <Loader2 size={24} className="spin" style={{ margin: '0 auto 12px' }} />
            جاري التحميل...
          </div>
        ) : visits.length === 0 ? (
          <div style={{
            textAlign: 'center', color: 'var(--text-muted)', padding: 40,
            background: 'var(--card)', borderRadius: 12
          }}>
            <CalendarPlus size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
            لا توجد طلبات زيارة بعد
          </div>
        ) : visits.map((v: any) => (
          <div key={v.id} className="card" style={{
            padding: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 12
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {v.visit_date} — {v.visit_time}
                {v.branch_name && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> · {v.branch_name}</span>}
              </div>
              {v.purpose && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{v.purpose}</div>}
              {v.admin_notes && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  ملاحظة الإدارة: {v.admin_notes}
                </div>
              )}
              {v.attachment_url && (
                <a href={v.attachment_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--primary)', marginTop: 6, textDecoration: 'none' }}>
                  <Paperclip size={12} /> {v.attachment_name || 'عرض المرفق'}
                </a>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span className="badge" style={{ background: `${STATUS_COLOR[v.status]}20`, color: STATUS_COLOR[v.status] }}>
                {STATUS_LABEL[v.status] || v.status}
              </span>
              {v.status === 'pending' && (
                <button className="btn btn-icon" title="إلغاء الطلب" onClick={() => cancelVisit(v.id)}>
                  <X size={15} color="#EF4444" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatsTab({ profile, goToItems }: { profile: any; goToItems: () => void }) {
  if (!profile) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
        <Loader2 size={24} className="spin" style={{ margin: '0 auto 12px' }} />
        جاري التحميل...
      </div>
    )
  }

  return (
    <div>
      {profile.group_name_ar && (
        <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Layers size={18} color="var(--primary)" />
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>مجموعة الموردين</div>
            <div style={{ fontWeight: 700 }}>{profile.group_name_ar}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <button type="button" title="عرض الأصناف الموردة" onClick={goToItems} style={{ display: 'block', textAlign: 'start', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
          <StatCard icon={<Package size={18} />} label="الأصناف الموردة" value={profile.product_count || 0} color="#8B5CF6" />
        </button>
        <StatCard icon={<Warehouse size={18} />} label="المخازن" value={profile.warehouses?.length || 0} color="#0EA5E9" />
        <StatCard icon={<Building2 size={18} />} label="الفروع" value={profile.branches?.length || 0} color="#10B981" />
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {profile.product_count || 0} صنف مرتبط — تفاصيل كل صنف، الكمية المباعة، وبيانات التوريد
        </div>
        <button className="btn btn-primary btn-sm" onClick={goToItems}>عرض الأصناف</button>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>المخازن التي تخزن أصنافك</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        {(profile.warehouses || []).length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>لا توجد مخازن مرتبطة بعد</div>
        ) : (
          <div style={{ display: 'grid', gap: 0 }}>
            {profile.warehouses.map((w: any, i: number) => (
              <div key={w.id} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Warehouse size={13} color="var(--text-muted)" />{w.name_ar}</span>
                {w.warehouse_group_name && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.warehouse_group_name}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>الفروع المخدومة</h2>
      <div className="card">
        {(profile.branches || []).length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>لا توجد فروع مرتبطة بعد</div>
        ) : (
          <div style={{ display: 'grid', gap: 0 }}>
            {profile.branches.map((b: any, i: number) => (
              <div key={b.id} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6, borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <Building2 size={13} color="var(--text-muted)" />
                <span style={{ fontSize: 13 }}>{b.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const PAGE_SIZE = 20

function ItemsTab({ supplierId }: { supplierId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ supplierId, page: String(page), pageSize: String(PAGE_SIZE) })
    if (debouncedSearch) params.set('search', debouncedSearch)
    fetch(`/api/public-supplier-items?${params}`)
      .then(r => r.ok ? r.json() : { items: [], total: 0 })
      .then(data => { setItems(data.items || []); setTotal(data.total || 0) })
      .catch(() => { setItems([]); setTotal(0) })
      .finally(() => setLoading(false))
  }, [supplierId, page, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: 12, color: 'var(--text-muted)' }} />
        <input
          className="input-field"
          style={{ paddingInlineStart: 36 }}
          placeholder="ابحث عن صنف بالاسم..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
        {total} صنف {debouncedSearch && `— نتائج البحث عن "${debouncedSearch}"`}
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>الصنف</th>
                <th>بيانات المورد</th>
                <th>السعر</th>
                <th>الكمية المباعة</th>
                <th>قيمة المبيعات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>جاري التحميل...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>لا توجد نتائج</td></tr>
              ) : items.map((it: any) => (
                <tr key={it.catalog_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                      {it.is_default && <Star size={12} color="#F59E0B" fill="#F59E0B" />}
                      {it.name_ar}
                    </div>
                    {it.group_name_ar && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{it.group_name_ar}</div>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {it.supplier_sku && <div>رقم الصنف: {it.supplier_sku}</div>}
                    {it.supplier_item_name && <div>الاسم لديك: {it.supplier_item_name}</div>}
                    {it.purchase_unit && <div>وحدة الشراء: {it.purchase_unit}</div>}
                    {!it.supplier_sku && !it.supplier_item_name && !it.purchase_unit && '—'}
                  </td>
                  <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {it.price != null ? `${Number(it.price).toLocaleString()} ${it.currency_symbol || it.currency_code || ''}` : '—'}
                  </td>
                  <td>{Number(it.sold_qty).toLocaleString()}</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                    <TrendingUp size={12} color="#10B981" />
                    {Number(it.sold_revenue).toLocaleString()} ر.س
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
          <button type="button" title="الصفحة السابقة" className="btn btn-icon" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            <ChevronRight size={16} />
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>صفحة {page} من {totalPages}</span>
          <button type="button" title="الصفحة التالية" className="btn btn-icon" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

function SettingsTab({ supplier, profile, theme, onSaved }: { supplier: { id: string }; profile: any; theme: string; onSaved: (u: any) => void }) {
  const [form, setForm] = useState({ name_ar: '', name_en: '', email: '', currentPassword: '', newPassword: '' })
  const [selectedTheme, setSelectedTheme] = useState(theme)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (profile) {
      setForm(f => ({ ...f, name_ar: profile.name_ar || '', name_en: profile.name_en || '', email: profile.email || '' }))
    }
  }, [profile])

  useEffect(() => { setSelectedTheme(theme) }, [theme])

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!form.name_ar) { setError('اسم المورد مطلوب'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/public-supplier-account', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: supplier.id, name_ar: form.name_ar, name_en: form.name_en, email: form.email,
          currentPassword: form.currentPassword || undefined, newPassword: form.newPassword || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'حدث خطأ'); return }
      onSaved(data.supplier)
      setForm(f => ({ ...f, currentPassword: '', newPassword: '' }))
      setMessage('تم حفظ بيانات الحساب')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const saveTheme = async (key: string) => {
    setSelectedTheme(key)
    const res = await fetch('/api/public-supplier-account', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: supplier.id, name_ar: form.name_ar || profile?.name_ar, theme: key }),
    })
    const data = await res.json()
    if (res.ok) onSaved(data.supplier)
  }

  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>
        <Palette size={16} style={{ verticalAlign: 'middle', marginInlineEnd: 6 }} /> ثيم بوابة المورد
      </h2>
      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {THEMES.map(t => (
            <button key={t.key} onClick={() => saveTheme(t.key)} type="button"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: 'none', border: 'none', fontFamily: 'inherit',
              }}>
              <span style={{
                width: 36, height: 36, borderRadius: '50%', background: t.color,
                border: selectedTheme === t.key ? '3px solid var(--text)' : '3px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selectedTheme === t.key && <Check size={16} color="white" />}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>بيانات الحساب</h2>
      <form className="card" onSubmit={saveAccount} style={{ padding: 20 }}>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>اسم المورد (عربي) *</label>
            <input className="input-field" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>اسم المورد (إنجليزي)</label>
            <input className="input-field" value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              <Mail size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} /> البريد الإلكتروني
            </label>
            <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              <KeyRound size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} /> كلمة المرور الحالية
            </label>
            <input type="password" className="input-field" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })}
              placeholder="مطلوبة فقط عند تغيير كلمة المرور" />
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>كلمة المرور الجديدة</label>
            <input type="password" className="input-field" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })}
              placeholder="اتركها فارغة لعدم التغيير" />
          </div>
          {error && <div style={{ color: '#EF4444', fontSize: 13 }}>{error}</div>}
          {message && <div style={{ color: '#10B981', fontSize: 13 }}>{message}</div>}
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ justifySelf: 'start' }}>
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </form>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}18`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', color, flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  )
}
