'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import { Search } from 'lucide-react'

const orderStatuses = ['pending','confirmed','preparing','shipped','delivered','cancelled']
const paymentStatuses = ['pending','paid','failed','refunded']

const statusLabels: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  confirmed: { ar: 'مؤكد', en: 'Confirmed' },
  preparing: { ar: 'قيد التجهيز', en: 'Preparing' },
  shipped: { ar: 'في الطريق', en: 'Shipped' },
  delivered: { ar: 'تم التسليم', en: 'Delivered' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
}
const paymentLabels: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  paid: { ar: 'مدفوع', en: 'Paid' },
  failed: { ar: 'فشل', en: 'Failed' },
  refunded: { ar: 'مسترد', en: 'Refunded' },
}

export default function OrdersPage() {
  const { lang } = useLang()
  const tr = t[lang]
  const isAr = lang === 'ar'
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')

  const load = () => {
    setLoading(true)
    fetch('/api/orders').then(r => r.json()).then(d => { setOrders(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/orders', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, status }) })
    load()
  }

  const filteredOrders = orders.filter((o: any) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (paymentFilter !== 'all' && o.payment_status !== paymentFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !(o.customer_name || '').toLowerCase().includes(q) &&
        !(o.phone || '').includes(q) &&
        !String(o.id || '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, color:'#1A1A2E', margin:0 }}>{tr.orders}</h1>
          <p style={{ fontSize:14, color:'var(--text-muted)', margin:'4px 0 0' }}>
            {filteredOrders.length === orders.length
              ? `${orders.length} ${isAr ? 'طلب' : 'orders'}`
              : `${filteredOrders.length} / ${orders.length} ${isAr ? 'طلب' : 'orders'}`}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="filter-bar" style={{ padding:'14px 18px' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={15} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', insetInlineStart:12, color:'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingInlineStart:36 }}
              placeholder={tr.search} value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field" style={{ width:160 }} value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
            <option value="all">{isAr ? 'كل حالات الدفع' : 'All Payments'}</option>
            {paymentStatuses.map(s => (
              <option key={s} value={s}>{isAr ? paymentLabels[s].ar : paymentLabels[s].en}</option>
            ))}
          </select>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <button onClick={() => setStatusFilter('all')} className={statusFilter === 'all' ? 'btn btn-tab active' : 'btn btn-tab'}>
              {isAr ? 'الكل' : 'All'}
            </button>
            {orderStatuses.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={statusFilter === s ? 'btn btn-tab active' : 'btn btn-tab'}>
                {isAr ? statusLabels[s].ar : statusLabels[s].en}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{tr.customer}</th>
                <th>{lang==='ar'?'عدد المنتجات':'Items'}</th>
                <th>{tr.total}</th>
                <th>{lang==='ar'?'حالة الدفع':'Payment'}</th>
                <th>{lang==='ar'?'طريقة الدفع':'Method'}</th>
                <th>{tr.date}</th>
                <th>{tr.status}</th>
                <th>{tr.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>{tr.loading}</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>{tr.noData}</td></tr>
              ) : filteredOrders.map((o: any) => (
                <tr key={o.id}>
                  <td>
                    <div style={{ fontWeight:500 }}>{o.customer_name}</div>
                    <div style={{ fontSize:12, color:'#9CA3AF' }}>{o.phone}</div>
                  </td>
                  <td style={{ textAlign:'center' }}>{o.items_count}</td>
                  <td style={{ fontWeight:600, color:'var(--gold)' }}>{Number(o.total).toLocaleString()} {tr.sar}</td>
                  <td>
                    <span className={`badge ${o.payment_status === 'paid' ? 'badge-completed' : o.payment_status === 'failed' ? 'badge-cancelled' : 'badge-pending'}`}>
                      {isAr ? (paymentLabels[o.payment_status]?.ar || o.payment_status) : (paymentLabels[o.payment_status]?.en || o.payment_status)}
                    </span>
                  </td>
                  <td style={{ color:'#6B7280' }}>{o.payment_method || '—'}</td>
                  <td style={{ color:'#6B7280' }}>{new Date(o.created_at).toLocaleDateString(lang==='ar'?'ar-SA':'en-US')}</td>
                  <td><span className={`badge badge-${o.status}`}>{isAr ? (statusLabels[o.status]?.ar || o.status) : (statusLabels[o.status]?.en || o.status)}</span></td>
                  <td>
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                      className="btn btn-chip">
                      {orderStatuses.map(s => <option key={s} value={s}>{isAr ? statusLabels[s].ar : statusLabels[s].en}</option>)}
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
