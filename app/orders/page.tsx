'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'

export default function OrdersPage() {
  const { lang } = useLang()
  const tr = t[lang]
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/orders').then(r => r.json()).then(d => { setOrders(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/orders', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, status }) })
    load()
  }

  const orderStatuses = ['pending','confirmed','preparing','shipped','delivered','cancelled']

  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:700, color:'#1A1A2E', marginBottom:24 }}>{tr.orders}</h1>

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
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#9CA3AF' }}>{tr.noData}</td></tr>
              ) : orders.map((o: any) => (
                <tr key={o.id}>
                  <td>
                    <div style={{ fontWeight:500 }}>{o.customer_name}</div>
                    <div style={{ fontSize:12, color:'#9CA3AF' }}>{o.phone}</div>
                  </td>
                  <td style={{ textAlign:'center' }}>{o.items_count}</td>
                  <td style={{ fontWeight:600, color:'var(--gold)' }}>{Number(o.total).toLocaleString()} {tr.sar}</td>
                  <td>
                    <span className={`badge ${o.payment_status === 'paid' ? 'badge-completed' : o.payment_status === 'failed' ? 'badge-cancelled' : 'badge-pending'}`}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td style={{ color:'#6B7280' }}>{o.payment_method || '—'}</td>
                  <td style={{ color:'#6B7280' }}>{new Date(o.created_at).toLocaleDateString(lang==='ar'?'ar-SA':'en-US')}</td>
                  <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                  <td>
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                      className="btn btn-chip">
                      {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
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
