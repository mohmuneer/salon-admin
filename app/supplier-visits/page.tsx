'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import { CalendarCheck, Search, Truck, Building2, MessageSquare, FileText } from 'lucide-react'

const VISIT_STATUSES = ['pending', 'approved', 'rejected', 'completed', 'cancelled']
const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  approved: { ar: 'تمت الموافقة', en: 'Approved' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  cancelled: { ar: 'ملغى', en: 'Cancelled' },
}
const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-pending',
  approved: 'badge-completed',
  rejected: 'badge-cancelled',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
}

export default function SupplierVisitsPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const tr = t[lang]

  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = () => {
    setLoading(true)
    fetch('/api/supplier-visits').then(r => r.ok ? r.json() : []).then(setVisits).catch(() => setVisits([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/supplier-visits', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    load()
  }

  const filtered = visits.filter((v: any) => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !(v.supplier_name_ar || '').toLowerCase().includes(q) &&
        !(v.supplier_name_en || '').toLowerCase().includes(q) &&
        !(v.supplier_phone || '').includes(q)
      ) return false
    }
    return true
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
            <CalendarCheck size={22} style={{ marginInlineEnd: 8, verticalAlign: 'middle', color: 'var(--primary)' }} />
            {isAr ? 'طلبات زيارة الموردين' : 'Supplier Visit Requests'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {filtered.length === visits.length
              ? `${visits.length} ${isAr ? 'طلب' : 'requests'}`
              : `${filtered.length} / ${visits.length} ${isAr ? 'طلب' : 'requests'}`}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filter-bar" style={{ padding: '14px 18px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: 12, color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingInlineStart: 36 }}
              placeholder={tr.search} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setStatusFilter('all')} className={statusFilter === 'all' ? 'btn btn-tab active' : 'btn btn-tab'}>
              {isAr ? 'الكل' : 'All'}
            </button>
            {VISIT_STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={statusFilter === s ? 'btn btn-tab active' : 'btn btn-tab'}>
                {isAr ? STATUS_LABELS[s].ar : STATUS_LABELS[s].en}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{isAr ? 'المورد' : 'Supplier'}</th>
                <th>{isAr ? 'الفرع' : 'Branch'}</th>
                <th>{isAr ? 'التاريخ والوقت' : 'Date & Time'}</th>
                <th>{isAr ? 'سبب الزيارة' : 'Purpose'}</th>
                <th>{isAr ? 'المرفق' : 'Attachment'}</th>
                <th>{tr.status}</th>
                <th>{tr.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{tr.loading}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{tr.noData}</td></tr>
              ) : filtered.map((v: any) => (
                <tr key={v.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Truck size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{v.supplier_name_ar}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.supplier_phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {v.branch_name ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={12} />{v.branch_name}</div>
                    ) : (isAr ? 'أي فرع' : 'Any branch')}
                  </td>
                  <td style={{ fontSize: 13 }}>{v.visit_date} — {v.visit_time}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 220 }}>
                    {v.purpose ? (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                        <MessageSquare size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{v.purpose}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td>
                    {v.attachment_url ? (
                      /\.(jpg|jpeg|png|webp)$/i.test(v.attachment_url) ? (
                        <a href={v.attachment_url} target="_blank" rel="noopener noreferrer">
                          <img src={v.attachment_url} alt={v.attachment_name || ''} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)' }} />
                        </a>
                      ) : (
                        <a href={v.attachment_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}>
                          <FileText size={14} /> {isAr ? 'عرض الملف' : 'View file'}
                        </a>
                      )
                    ) : '—'}
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[v.status]}`}>{isAr ? STATUS_LABELS[v.status].ar : STATUS_LABELS[v.status].en}</span></td>
                  <td>
                    <select value={v.status} onChange={e => updateStatus(v.id, e.target.value)} className="btn btn-chip">
                      {VISIT_STATUSES.map(s => <option key={s} value={s}>{isAr ? STATUS_LABELS[s].ar : STATUS_LABELS[s].en}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
