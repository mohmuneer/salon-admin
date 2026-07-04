'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, LogOut, CalendarPlus, Building2, Clock, MessageSquare, X, Loader2, Phone, Package, Eye, Paperclip, FileText } from 'lucide-react'
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

export default function SupplierDashboardPage() {
  const router = useRouter()
  const { supplier, loading, logout } = useSupplierAuth()

  useEffect(() => {
    if (!loading && !supplier) router.replace('/supplier-portal/login')
  }, [loading, supplier, router])

  if (loading || !supplier) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #F7F7FA)', display: 'flex', flexDirection: 'column' }}>
      <HeaderBar supplier={supplier} logout={logout} />
      <div style={{ flex: 1, padding: '24px 16px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <SupplierDashboard supplier={supplier} />
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

function SupplierDashboard({ supplier }: { supplier: { id: string; name_ar: string; name_en?: string; phone: string; email?: string } }) {
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
