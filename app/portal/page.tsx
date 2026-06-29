'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import { Calendar, Clock, Phone, CheckCircle, ListTodo, Hourglass, Package, Printer } from 'lucide-react'
import { printInvoice } from '@/lib/printInvoice'

const STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']

export default function PortalPage() {
  const { lang } = useLang()
  const tr = t[lang]
  const { data: session } = useSession()
  const [tab, setTab] = useState<'today' | 'upcoming'>('today')
  const [appts, setAppts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = (scope: 'today' | 'upcoming') => {
    setLoading(true)
    fetch(`/api/portal/appointments?scope=${scope}`).then(r => r.json()).then(d => {
      setAppts(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }

  useEffect(() => { load(tab) }, [tab])

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch('/api/portal/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus })
    })
    load(tab)
  }

  const pendingCount = appts.filter(a => a.status === 'pending' || a.status === 'confirmed').length
  const completedCount = appts.filter(a => a.status === 'completed').length

  const userName = session?.user?.name || ''
  const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>
        {tr.welcomeBack}{userName ? `, ${userName}` : ''}
      </h1>
      <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 24 }}>{today}</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ListTodo size={20} color="#5B21B6" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E' }}>{appts.length}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{tab === 'today' ? tr.todayTasks : tr.upcomingTasks}</div>
          </div>
        </div>
        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Hourglass size={20} color="#92400E" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E' }}>{pendingCount}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{tr.pending}</div>
          </div>
        </div>
        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={20} color="#065F46" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E' }}>{completedCount}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{tr.completed}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setTab('today')}
          className={`btn btn-tab ${tab === 'today' ? 'active' : ''}`}
        >
          {tr.todayTasks}
        </button>
        <button
          onClick={() => setTab('upcoming')}
          className={`btn btn-tab ${tab === 'upcoming' ? 'active' : ''}`}
        >
          {tr.upcomingTasks}
        </button>
      </div>

      {/* Appointment cards */}
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>{tr.loading}</div>
      ) : appts.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>{tr.noAppointments}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {appts.map((a: any) => (
            <div key={a.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A2E' }}>{a.customer_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                    <Phone size={12} /> {a.customer_phone}
                  </div>
                </div>
                <span className={`badge badge-${a.status}`}>{tr[a.status as keyof typeof tr] || a.status}</span>
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold)', marginBottom: 8 }}>{a.service_name}</div>

              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} />
                  {new Date(a.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} />
                  {a.start_time?.slice(0, 5)} - {a.end_time?.slice(0, 5)}
                </div>
              </div>

              {a.products && a.products.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #E8E4DC', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                    <Package size={13} /> {lang === 'ar' ? 'المنتجات' : 'Products'}
                  </div>
                  {a.products.map((p: any) => (
                    <div key={p.id || p.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
                      <span style={{ color: '#374151' }}>{p.name}</span>
                      <span style={{ color: p.type === 'optional' ? 'var(--gold)' : '#10B981', fontSize: 11 }}>
                        {p.type === 'optional' ? `+${Number(p.unit_price || 0).toLocaleString()} ر.س` : lang === 'ar' ? 'مشمول' : 'Included'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={a.status}
                  onChange={e => updateStatus(a.id, e.target.value)}
                  className="input-field"
                  aria-label={tr.status}
                  style={{ cursor: 'pointer', flex: 1 }}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{tr[s as keyof typeof tr] || s}</option>
                  ))}
                </select>
                {a.status === 'completed' && (
                  <button onClick={() => printInvoice(a)} title={lang==='ar'?'طباعة الفاتورة':'Print Invoice'}
                    className="btn btn-icon">
                    <Printer size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
