'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import { Search, Filter, Printer } from 'lucide-react'
import { printInvoice } from '@/lib/printInvoice'
import DataTable from '@/app/components/DataTable'

const STATUSES = ['all','pending','confirmed','in_progress','completed','cancelled','no_show']

export default function AppointmentsPage() {
  const { lang } = useLang()
  const tr = t[lang]
  const [appts, setAppts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (search) params.set('search', search)
    fetch(`/api/appointments?${params}`).then(r => r.json()).then(d => { setAppts(d); setLoading(false) })
  }

  useEffect(() => { load() }, [status])

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch('/api/appointments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: newStatus }) })
    load()
  }

  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:700, color:'#1A1A2E', marginBottom:24 }}>{tr.appointments}</h1>

      {/* Filters */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="filter-bar" style={{ padding:'16px 20px' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={15} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', insetInlineStart:12, color:'#9CA3AF' }} />
            <input
              className="input-field"
              style={{ paddingInlineStart:36 }}
              placeholder={tr.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          <div className="status-filters" style={{ display:'flex', gap:8 }}>
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={status === s ? 'btn btn-tab active' : 'btn btn-tab'}
              >
                {s === 'all' ? (lang==='ar'?'الكل':'All') : (tr[s as keyof typeof tr] || s)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <DataTable>
          <table className="data-table">
            <thead>
              <tr>
                <th className="sticky-col">{tr.customer}</th>
                <th>{tr.service}</th>
                <th>{tr.staff_member}</th>
                <th>{tr.date}</th>
                <th>{tr.time}</th>
                <th>{tr.total}</th>
                <th>{tr.status}</th>
                <th className="sticky-col-right">{tr.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>{tr.loading}</td></tr>
              ) : appts.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>{tr.noData}</td></tr>
              ) : appts.map((a: any) => (
                <tr key={a.id}>
                  <td className="sticky-col">
                    <div style={{ fontWeight:500 }}>{a.customer_name}</div>
                    <div style={{ fontSize:12, color:'#9CA3AF' }}>{a.customer_phone}</div>
                  </td>
                  <td>{a.service_name}</td>
                  <td>{a.staff_name}</td>
                  <td>{new Date(a.date).toLocaleDateString(lang==='ar'?'ar-SA':'en-US')}</td>
                  <td>{a.start_time?.slice(0,5)} - {a.end_time?.slice(0,5)}</td>
                  <td style={{ fontWeight:600, color:'var(--gold)' }}>{Number(a.total||0).toLocaleString()} {tr.sar}</td>
                  <td><span className={`badge badge-${a.status}`}>{tr[a.status as keyof typeof tr] || a.status}</span></td>
                  <td className="sticky-col-right">
                    <div className="action-buttons">
                    <select
                      value={a.status}
                      onChange={e => updateStatus(a.id, e.target.value)}
                      className="btn btn-chip"
                    >
                      {['pending','confirmed','in_progress','completed','cancelled','no_show'].map(s => (
                        <option key={s} value={s}>{tr[s as keyof typeof tr] || s}</option>
                      ))}
                    </select>
                    {a.status === 'completed' && (
                      <button onClick={() => printInvoice(a)} title={lang==='ar'?'طباعة الفاتورة':'Print Invoice'}
                        className="btn btn-icon">
                        <Printer size={16} />
                      </button>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </div>
    </div>
  )
}
