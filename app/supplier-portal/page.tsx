'use client'
import { useEffect, useState } from 'react'
import { Truck, LogOut, CalendarPlus, Phone, KeyRound, Building2, Clock, MessageSquare, X, Loader2 } from 'lucide-react'

const STORAGE_KEY = 'glamour-supplier'

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

type Supplier = { id: string; name_ar: string; name_en?: string; phone: string; email?: string }

export default function SupplierPortalPage() {
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [checkedStorage, setCheckedStorage] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSupplier(JSON.parse(raw))
    } catch {}
    setCheckedStorage(true)
  }, [])

  const handleLogin = (s: Supplier) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    setSupplier(s)
  }
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSupplier(null)
  }

  if (!checkedStorage) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #F7F7FA)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px 20px', background: 'var(--card, #fff)', borderBottom: '1px solid var(--border, #eee)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Truck size={22} color="var(--primary, #C9A24B)" />
          <div style={{ fontWeight: 800, fontSize: 16 }}>بوابة الموردين</div>
        </div>
        {supplier && (
          <button className="btn btn-ghost" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <LogOut size={16} /> تسجيل الخروج
          </button>
        )}
      </div>

      <div style={{ flex: 1, padding: '24px 16px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        {supplier ? <SupplierDashboard supplier={supplier} /> : <SupplierLogin onLogin={handleLogin} />}
      </div>
    </div>
  )
}

function SupplierLogin({ onLogin }: { onLogin: (s: Supplier) => void }) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!phone || !password) return
    setLoading(true)
    try {
      const res = await fetch('/api/supplier-auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'حدث خطأ'); return }
      onLogin(data.supplier)
    } catch {
      setError('تعذر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: 28, marginTop: 40 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>تسجيل دخول المورد</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>
        استخدم رقم الجوال وكلمة المرور المسجلة لدى الصالون
      </p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            <Phone size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} /> رقم الجوال
          </label>
          <input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XXXXXXXX" />
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            <KeyRound size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} /> كلمة المرور
          </label>
          <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <div style={{ color: '#EF4444', fontSize: 13 }}>{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading || !phone || !password}>
          {loading ? <Loader2 size={16} className="spin" /> : 'دخول'}
        </button>
      </form>
    </div>
  )
}

function SupplierDashboard({ supplier }: { supplier: Supplier }) {
  const [branches, setBranches] = useState<any[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBook, setShowBook] = useState(false)
  const [form, setForm] = useState({ branchId: '', visitDate: '', visitTime: '', purpose: '' })
  const [submitting, setSubmitting] = useState(false)
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

  const submitVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.visitDate || !form.visitTime) { setError('التاريخ والوقت مطلوبان'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/public-supplier-visits', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: supplier.id, branchId: form.branchId || null, visitDate: form.visitDate, visitTime: form.visitTime, purpose: form.purpose }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'حدث خطأ'); return }
      setMessage(data.message || 'تم إرسال طلب الزيارة')
      setForm({ branchId: '', visitDate: '', visitTime: '', purpose: '' })
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
      <div className="card" style={{ padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{supplier.name_ar}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{supplier.phone}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowBook(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarPlus size={16} /> طلب زيارة جديدة
        </button>
      </div>

      {message && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
          {message}
        </div>
      )}

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

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>طلبات الزيارة السابقة</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>جاري التحميل...</div>
        ) : visits.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>لا توجد طلبات زيارة بعد</div>
        ) : visits.map((v: any) => (
          <div key={v.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {v.visit_date} — {v.visit_time}
                {v.branch_name && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> · {v.branch_name}</span>}
              </div>
              {v.purpose && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{v.purpose}</div>}
              {v.admin_notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>ملاحظة الإدارة: {v.admin_notes}</div>}
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
