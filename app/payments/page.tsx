'use client'
import { useState, useEffect, useCallback } from 'react'
import { Eye, Check, X, RefreshCw, FileText, CreditCard, Search, ChevronDown, AlertTriangle } from 'lucide-react'
import DataTable from '@/app/components/DataTable'

type Status = 'all' | 'pending' | 'verified' | 'rejected'
type PaymentReceipt = {
  id: number
  order_id: string | null
  appointment_ids: string[]
  customer_name: string
  customer_phone: string
  receipt_url: string
  amount: number
  expected_amount: number | null
  payment_method: string
  status: 'pending' | 'verified' | 'rejected'
  notes: string
  created_at: string
  verified_by: string | null
  verified_by_name: string | null
  verified_at: string | null
}

const STATUS_LABEL: Record<string, string> = { pending: 'معلق', verified: 'موثق', rejected: 'مرفوض' }
const STATUS_COLOR: Record<string, string> = { pending: '#F59E0B', verified: '#10B981', rejected: '#EF4444' }
const STATUS_BG:    Record<string, string> = { pending: 'rgba(245,158,11,0.12)', verified: 'rgba(16,185,129,0.12)', rejected: 'rgba(239,68,68,0.12)' }

export default function PaymentsPage() {
  const [rows, setRows]         = useState<PaymentReceipt[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterTab, setFilterTab] = useState<Status>('all')
  const [preview, setPreview]   = useState<string | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)
  const [openNote, setOpenNote] = useState<number | null>(null)
  const [noteText, setNoteText] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/payments')
      if (r.ok) setRows(await r.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: number, status: string, notes?: string) => {
    setUpdating(id)
    try {
      await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes }),
      })
      setRows(prev => prev.map(r => r.id === id ? { ...r, status: status as any, notes: notes ?? r.notes } : r))
    } catch {}
    setUpdating(null)
  }

  const saveNote = async (id: number) => {
    await updateStatus(id, rows.find(r=>r.id===id)?.status || 'pending', noteText)
    setOpenNote(null)
  }

  const filtered = rows.filter(r => {
    const matchTab = filterTab === 'all' || r.status === filterTab
    const q = search.toLowerCase()
    const matchSearch = !q || r.customer_name.toLowerCase().includes(q) || (r.customer_phone||'').includes(q) || (r.order_id||'').toLowerCase().includes(q)
    return matchTab && matchSearch
  })

  const counts = {
    all: rows.length,
    pending:  rows.filter(r => r.status === 'pending').length,
    verified: rows.filter(r => r.status === 'verified').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="anim-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CreditCard size={22} style={{ color: 'var(--primary)' }} />
            المدفوعات
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '5px 0 0' }}>
            {rows.length} سند حوالة مستلم
          </p>
        </div>
        <button className="btn btn-ghost" onClick={load}>
          <RefreshCw size={15} style={{ animation: loading ? 'spin .8s linear infinite' : 'none' }} />
          تحديث
        </button>
      </div>

      {/* Filter tabs */}
      <div className="card" style={{ padding: '0 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
          {(['all','pending','verified','rejected'] as Status[]).map(tab => (
            <button key={tab} onClick={() => setFilterTab(tab)}
              style={{ padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: filterTab === tab ? 700 : 400, color: filterTab === tab ? 'var(--primary)' : 'var(--text-muted)', borderBottom: filterTab === tab ? '2px solid var(--primary)' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: 7, transition: 'all .2s' }}>
              {{ all:'الكل', pending:'معلق', verified:'موثق', rejected:'مرفوض' }[tab]}
              <span style={{ background: filterTab === tab ? 'var(--primary-bg)' : 'var(--surface)', color: filterTab === tab ? 'var(--primary)' : 'var(--text-muted)', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20 }}>{counts[tab]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الجوال أو رقم الطلب..."
          style={{ width: '100%', padding: '11px 42px 11px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin .8s linear infinite', margin: '0 auto 14px' }} />
          جارٍ التحميل...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 80 }}>
          <FileText size={52} style={{ color: 'var(--border)', margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
            {search ? 'لا توجد نتائج للبحث' : 'لا توجد مدفوعات بعد'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <DataTable>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sticky-col" style={{ paddingInlineStart: 20 }}>#</th>
                  <th>العميل</th>
                  <th>رقم الجوال</th>
                  <th>المبلغ</th>
                  <th>طريقة الدفع</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>سند الحوالة</th>
                  <th className="sticky-col-right">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id}>
                    <td className="sticky-col" style={{ paddingInlineStart: 20 }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>#{row.id}</span>
                      {row.order_id && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>طلب: {row.order_id}</div>}
                    </td>
                    <td style={{ fontWeight: 600 }}>{row.customer_name || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }} dir="ltr">{row.customer_phone || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {Number(row.amount).toLocaleString()} ر.س
                      </div>
                      {row.expected_amount != null && (
                        Number(row.expected_amount) !== Number(row.amount) ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#EF4444', marginTop: 2, fontWeight: 600 }}>
                            <AlertTriangle size={11} />
                            المطلوب فعلياً: {Number(row.expected_amount).toLocaleString()} ر.س
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>يطابق قيمة الطلب</div>
                        )
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {row.payment_method === 'bank_transfer' ? 'حوالة بنكية' : row.payment_method === 'direct_debit' ? 'خصم من حساب' : row.payment_method}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {new Date(row.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_BG[row.status], color: STATUS_COLOR[row.status] }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[row.status] }} />
                        {STATUS_LABEL[row.status]}
                      </span>
                      {row.verified_by_name && row.verified_at && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          بواسطة {row.verified_by_name} — {new Date(row.verified_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </td>
                    <td>
                      <button onClick={() => setPreview(row.receipt_url)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                        <Eye size={13} /> عرض السند
                      </button>
                    </td>
                    <td className="sticky-col-right">
                      <div className="action-buttons">
                        {row.status !== 'verified' && (
                          <button disabled={updating === row.id} onClick={() => updateStatus(row.id, 'verified')}
                            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.12)', color: '#10B981', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', opacity: updating === row.id ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={12} /> توثيق
                          </button>
                        )}
                        {row.status !== 'rejected' && (
                          <button disabled={updating === row.id} onClick={() => updateStatus(row.id, 'rejected')}
                            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', opacity: updating === row.id ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <X size={12} /> رفض
                          </button>
                        )}
                        <button onClick={() => { setOpenNote(row.id); setNoteText(row.notes || '') }}
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3 }}>
                          📝
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>
      )}

      {/* Receipt Preview Lightbox */}
      {preview && (
        <div onClick={() => setPreview(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: 680, width: '100%', maxHeight: '90vh' }}>
            <button onClick={() => setPreview(null)}
              style={{ position: 'absolute', top: -14, left: -14, width: 34, height: 34, borderRadius: '50%', background: '#EF4444', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, fontSize: 18 }}>
              ×
            </button>
            <div style={{ background: 'var(--card)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
                <CreditCard size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>سند الحوالة البنكية</span>
              </div>
              <img src={preview} alt="سند الحوالة"
                style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }} />
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <a href={preview} download="receipt.jpg" target="_blank" rel="noopener noreferrer"
                  style={{ padding: '8px 18px', borderRadius: 10, background: 'var(--primary-bg)', color: 'var(--primary)', fontWeight: 600, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  ⬇️ تحميل
                </a>
                <button onClick={() => setPreview(null)}
                  style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note modal */}
      {openNote !== null && (
        <div onClick={() => setOpenNote(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700 }}>إضافة / تعديل ملاحظة</h3>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} placeholder="اكتب ملاحظتك هنا..."
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setOpenNote(null)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>إلغاء</button>
              <button onClick={() => saveNote(openNote!)}
                style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>حفظ</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
