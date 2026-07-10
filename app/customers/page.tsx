'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import { Search } from 'lucide-react'
import DataTable from '@/app/components/DataTable'

export default function CustomersPage() {
  const { lang } = useLang()
  const tr = t[lang]
  const [customers, setCustomers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => { setCustomers(d); setFiltered(d); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!search) { setFiltered(customers); return }
    const q = search.toLowerCase()
    setFiltered(customers.filter((c: any) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q)))
  }, [search, customers])

  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:700, color:'#1A1A2E', marginBottom:24 }}>{tr.customers}</h1>

      <div className="card" style={{ marginBottom:16 }}>
        <div className="filter-bar" style={{ padding:'14px 20px' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={15} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', insetInlineStart:12, color:'#9CA3AF' }} />
            <input className="input-field" style={{ paddingInlineStart:36 }} placeholder={tr.search} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <DataTable>
          <table className="data-table">
            <thead>
              <tr>
                <th className="">{tr.name}</th>
                <th>{tr.phone}</th>
                <th>{tr.gender}</th>
                <th>{lang==='ar'?'إجمالي المواعيد':'Total Appts'}</th>
                <th>{lang==='ar'?'إجمالي الإنفاق':'Total Spent'}</th>
                <th>{lang==='ar'?'آخر زيارة':'Last Visit'}</th>
                <th>{tr.status}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>{tr.loading}</td></tr>
              ) : filtered.map((c: any) => (
                <tr key={c.id}>
                  <td className="">
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:32, height:32, borderRadius:'50%',
                        background:'linear-gradient(135deg,var(--gold),var(--gold-light))',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'white', fontSize:13, fontWeight:700, flexShrink:0
                      }}>{c.name?.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight:500 }}>{c.name}</div>
                        <div style={{ fontSize:12, color:'#9CA3AF' }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color:'#6B7280' }}>{c.phone}</td>
                  <td>{c.gender === 'female' ? (lang==='ar'?'أنثى':'Female') : (lang==='ar'?'ذكر':'Male')}</td>
                  <td style={{ textAlign:'center', fontWeight:600 }}>{c.total_appointments}</td>
                  <td style={{ fontWeight:600, color:'var(--gold)' }}>{Number(c.total_spent||0).toLocaleString()} {tr.sar}</td>
                  <td style={{ color:'#6B7280' }}>{c.last_visit ? new Date(c.last_visit).toLocaleDateString(lang==='ar'?'ar-SA':'en-US') : '—'}</td>
                  <td><span className={`badge ${c.is_active ? 'badge-confirmed' : 'badge-cancelled'}`}>{c.is_active ? tr.active : tr.inactive}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </div>
    </div>
  )
}
