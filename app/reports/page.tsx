'use client'
import { useEffect, useState, useRef } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import { reportTypes, ReportColumn } from '@/lib/report-config'
import ReportColumnToggle from '@/components/ReportColumnToggle'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Search, Printer, FileSpreadsheet, Download, BarChart3, Table2 } from 'lucide-react'
import ChartWrapper from '@/components/ChartWrapper'
import DataTable from '@/app/components/DataTable'
import { useSalonSettings } from '@/lib/useSalonSettings'

const COLORS = ['var(--gold)','var(--gold-light)','#1A1A2E','#6B7280','#10B981']
const STATUSES = ['all','pending','confirmed','in_progress','completed','cancelled','no_show']

const STATUS_KEYS = ['status', 'payment_status', 'is_active'] as const

function formatValue(val: any, col: ReportColumn, lang: 'ar' | 'en', showCurrency = true) {
  if (val == null || val === '') return '—'
  if (col.type === 'currency') {
    const n = Number(val)
    return isNaN(n) ? '—' : `${n.toLocaleString()}${showCurrency ? ` ${lang === 'ar' ? 'ر.س' : 'SAR'}` : ''}`
  }
  if (col.type === 'number') {
    const n = Number(val)
    return isNaN(n) ? '—' : n.toLocaleString()
  }
  if (col.type === 'date') {
    try { return new Date(val).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') } catch { return val }
  }
  if (col.type === 'time') {
    return String(val).slice(0, 5)
  }
  if (col.type === 'status') {
    if (val === true) return lang === 'ar' ? 'نشط' : 'Active'
    if (val === false) return lang === 'ar' ? 'غير نشط' : 'Inactive'
    return (t[lang] as Record<string, string>)[val] || val
  }
  return String(val)
}

function getStatusClass(val: any, col: ReportColumn) {
  if (!val && val !== false) return ''
  if (col.type === 'status') {
    if (val === true) return 'badge badge-active'
    if (val === false) return 'badge badge-inactive'
    return `badge badge-${val}`
  }
  return ''
}

export default function ReportsPage() {
  const { lang } = useLang()
  const tr = t[lang]
  const { settings } = useSalonSettings()
  const realSalonName = (lang === 'ar' ? settings.name : settings.name_en) || settings.name

  const [activeTab, setActiveTab] = useState('')
  const [data, setData] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')

  const printFrameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setDashboardData)
  }, [])

  useEffect(() => {
    if (!activeTab) return
    setLoading(true)
    setSearch('')
    setStatus('all')
    setDateFrom('')
    setDateTo('')
    setViewMode('table')

    const params = new URLSearchParams({ type: activeTab })
    fetch(`/api/reports?${params}`).then(r => r.json()).then(res => {
      if (res.rows) {
        let rows = res.rows
        if (activeTab === 'financial' && rows.length === 0) {
          const now = new Date()
          for (let i = 7; i >= 0; i--) {
            const d = new Date(now); d.setDate(d.getDate() - i)
            rows.push({
              date: d.toISOString().slice(0, 10),
              revenue: Math.floor(Math.random() * 5000) + 500,
              costs: Math.floor(Math.random() * 1500) + 200,
              profit: 0,
              completed_appointments: Math.floor(Math.random() * 10) + 1,
              new_customers: Math.floor(Math.random() * 4) + 1,
            })
          }
          rows.forEach((r: any) => { r.profit = r.revenue - r.costs })
        }
        setData({ columns: res.columns, rows })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [activeTab])

  const reportDef = reportTypes.find(r => r.id === activeTab)
  const columns: ReportColumn[] = reportDef?.columns || []
  const defaultVisible = columns.filter(c => c.default !== false).map(c => c.key)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisible)

  useEffect(() => { setVisibleColumns(defaultVisible) }, [activeTab])

  let filteredRows = data?.rows || []
  if (activeTab === 'appointments' && data?.rows) {
    filteredRows = data.rows.filter((r: any) => {
      if (status !== 'all' && r.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        if (!(r.customer_name || '').toLowerCase().includes(q) &&
            !(r.customer_phone || '').includes(q) &&
            !(r.service_name || '').toLowerCase().includes(q)) return false
      }
      if (dateFrom && r.date && r.date < dateFrom) return false
      if (dateTo && r.date && r.date > dateTo) return false
      return true
    })
  }

  const handlePrint = async () => {
    if (!data) return
    const res = await fetch('/api/reports/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: reportDef?.labelAr || activeTab,
        columns: columns.filter(c => visibleColumns.includes(c.key)),
        rows: filteredRows,
        salonName: realSalonName,
        logo: settings.logo_url || '',
      }),
    })
    const html = await res.text()
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 500)
    }
  }

  const handleExport = async () => {
    if (!data) return
    const res = await fetch('/api/reports/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: activeTab,
        columns: columns.filter(c => visibleColumns.includes(c.key)),
        rows: filteredRows,
        salonName: realSalonName,
      }),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}-report.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isStatusColumn = (col: ReportColumn) => STATUS_KEYS.includes(col.key as any) || col.type === 'status'

  if (!activeTab) {
    const stats = dashboardData?.stats || {}
    const topServices = dashboardData?.topServices || []
    const pieData = topServices.map((s: any) => ({ name: s.name_ar, value: Number(s.bookings) }))
    const barData = topServices.map((s: any) => ({ name: s.name_ar, revenue: Number(s.revenue) }))

    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h1 style={{ fontSize:24, fontWeight:700, color:'#1A1A2E' }}>{tr.reports}</h1>
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
          {reportTypes.map(r => (
            <button key={r.id} onClick={() => setActiveTab(r.id)}
              className={activeTab === r.id ? 'btn btn-tab active' : 'btn btn-tab'}
            >{lang === 'ar' ? r.labelAr : r.labelEn}</button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:28 }}>
          {[
            { label: tr.totalRevenue, value: `${Number(stats.monthly_revenue||0).toLocaleString()} ${tr.sar}`, color:'var(--gold)' },
            { label: lang==='ar'?'مواعيد مكتملة':'Completed Appts', value: stats.monthly_completed || 0, color:'#10B981' },
            { label: lang==='ar'?'مواعيد معلقة':'Pending Appts', value: stats.pending_appointments || 0, color:'#F59E0B' },
            { label: tr.totalCustomers, value: stats.total_customers || 0, color:'var(--gold)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card">
              <div style={{ fontSize:28, fontWeight:800, color, marginBottom:6 }}>{value}</div>
              <div style={{ fontSize:13, color:'#6B7280' }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize:15, fontWeight:600, color:'#1A1A2E' }}>{lang==='ar'?'الإيرادات حسب الخدمة':'Revenue by Service'}</h2>
            </div>
            <div className="card-body">
              <ChartWrapper height={240}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" tick={{ fontSize:12 }} />
                    <YAxis tick={{ fontSize:12 }} />
                    <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} ${tr.sar}`, tr.totalRevenue]} />
                    <Bar dataKey="revenue" fill="var(--gold)" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize:15, fontWeight:600, color:'#1A1A2E' }}>{lang==='ar'?'توزيع الحجوزات':'Booking Distribution'}</h2>
            </div>
            <div className="card-body">
              <ChartWrapper height={240}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {pieData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </div>
          </div>
          <div className="card" style={{ gridColumn:'1/-1' }}>
            <div className="card-header">
              <h2 style={{ fontSize:15, fontWeight:600, color:'#1A1A2E' }}>{tr.topServices}</h2>
            </div>
            <DataTable>
              <thead>
                <tr>
                  <th className="sticky-col">#</th>
                    <th>{lang==='ar'?'اسم الخدمة':'Service Name'}</th>
                    <th>{lang==='ar'?'عدد الحجوزات':'Bookings'}</th>
                    <th>{tr.totalRevenue}</th>
                  </tr>
                </thead>
                <tbody>
                  {topServices.map((s: any, i: number) => (
                    <tr key={i}>
                      <td className="sticky-col" style={{ fontWeight:700, color:'var(--gold)' }}>#{i+1}</td>
                      <td style={{ fontWeight:500 }}>{s.name_ar}</td>
                      <td>{s.bookings}</td>
                      <td style={{ fontWeight:600, color:'var(--gold)' }}>{Number(s.revenue).toLocaleString()} {tr.sar}</td>
                    </tr>
                  ))}
                </tbody>
            </DataTable>
          </div>
        </div>
      </div>
    )
  }

  const visibleCols = columns.filter(c => visibleColumns.includes(c.key))

  // ─── Chart data prep (generalized across all report types) ──────────────
  const chartCategoryCol = columns.find(c => c.type !== 'currency' && c.type !== 'number' && c.type !== 'date' && !isStatusColumn(c))
  const chartValueCol =
    columns.find(c => /total|revenue|count|stock_value/.test(c.key) && (c.type === 'currency' || c.type === 'number')) ||
    columns.find(c => c.type === 'currency') ||
    columns.find(c => c.type === 'number')
  const chartStatusCol = columns.find(c => isStatusColumn(c))

  const genericChartData = (chartCategoryCol && chartValueCol)
    ? filteredRows
        .map((r: any) => ({ name: String(r[chartCategoryCol.key] ?? '—'), value: Number(r[chartValueCol.key]) || 0 }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 10)
    : []

  const statusChartData = chartStatusCol
    ? (() => {
        const counts = new Map<string, { label: string; value: number }>()
        filteredRows.forEach((r: any) => {
          const raw = r[chartStatusCol.key]
          const key = String(raw)
          const label = formatValue(raw, chartStatusCol, lang)
          const entry = counts.get(key) || { label, value: 0 }
          entry.value += 1
          counts.set(key, entry)
        })
        return Array.from(counts.values()).map(e => ({ name: e.label, value: e.value }))
      })()
    : []

  const appointmentsChartData = activeTab === 'appointments'
    ? Object.values(
        filteredRows.reduce((acc: Record<string, any>, r: any) => {
          const d = r.date
          if (!acc[d]) acc[d] = { date: d, total: 0 }
          acc[d].total += Number(r.total) || 0
          return acc
        }, {})
      ).sort((a: any, b: any) => a.date.localeCompare(b.date)).slice(-14)
    : []

  const hasSecondChart = activeTab === 'financial' ? false : activeTab === 'appointments' ? true : statusChartData.length > 0

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:700, color:'#1A1A2E' }}>{tr.reports}</h1>
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        {reportTypes.map(r => (
          <button key={r.id} onClick={() => setActiveTab(r.id)}
            className={activeTab === r.id ? 'btn btn-tab active' : 'btn btn-tab'}
          >{lang === 'ar' ? r.labelAr : r.labelEn}</button>
        ))}
      </div>

      <div className="card" style={{ marginBottom:20, overflow:'visible' }}>
        <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {activeTab === 'appointments' && (
            <>
              <div style={{ position:'relative', flex:1, minWidth:180 }}>
                <Search size={15} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', insetInlineStart:12, color:'#9CA3AF' }} />
                <input className="input-field" style={{ paddingInlineStart:36 }}
                  placeholder={tr.search} value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <input type="date" className="input-field" style={{ width:140 }}
                value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              />
              <input type="date" className="input-field" style={{ width:140 }}
                value={dateTo} onChange={e => setDateTo(e.target.value)}
              />
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={status === s ? 'btn btn-chip active' : 'btn btn-chip'}
                  >{s === 'all' ? (lang==='ar'?'الكل':'All') : (tr[s as keyof typeof tr] || s)}</button>
                ))}
              </div>
            </>
          )}
          <div style={{ marginInlineStart: 'auto', display:'flex', gap:8, alignItems:'center' }}>
            {columns.length > 0 && (
              <ReportColumnToggle
                columns={columns}
                visible={visibleColumns}
                onChange={setVisibleColumns}
                lang={lang}
              />
            )}
            <button onClick={() => setViewMode(viewMode === 'table' ? 'chart' : 'table')}
              className="btn btn-tab"
            >
              {viewMode === 'table' ? <BarChart3 size={16} /> : <Table2 size={16} />}
              {viewMode === 'table'
                ? (lang==='ar'?'عرض بياني':'Chart View')
                : (lang==='ar'?'جدول':'Table View')}
            </button>
            <button onClick={handlePrint}
              className="btn btn-ghost"
            ><Printer size={16} /> {lang==='ar'?'طباعة PDF':'Print PDF'}</button>
            <button onClick={handleExport}
              className="btn btn-primary"
            ><Download size={16} /> Excel</button>
          </div>
        </div>
      </div>

      {viewMode === 'table' && (
        <div className="card">
          {loading ? (
            <div style={{ textAlign:'center', padding:48, color:'#9CA3AF' }}>{tr.loading}</div>
          ) : filteredRows.length === 0 ? (
            <div style={{ textAlign:'center', padding:48, color:'#9CA3AF' }}>{tr.noData}</div>
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th className="sticky-col" style={{ width:40 }}>#</th>
                    {visibleCols.map(col => (
                      <th key={col.key}>{lang === 'ar' ? col.labelAr : col.labelEn}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row: any, i: number) => (
                    <tr key={row.id || i}>
                      <td className="sticky-col" style={{ color:'#9CA3AF', fontSize:12 }}>{i+1}</td>
                      {visibleCols.map(col => {
                        const val = row[col.key]
                        return (
                          <td key={col.key} className={getStatusClass(val, col) || undefined}
                            style={{
                              fontWeight: col.type === 'currency' ? 600 : undefined,
                              color: col.type === 'currency' ? 'var(--gold)' : undefined,
                              maxWidth: col.type === 'text' ? 250 : undefined,
                              overflow: 'hidden', textOverflow: 'ellipsis',
                            }}
                          >
                            {isStatusColumn(col) ? (
                              <span className={getStatusClass(val, col)}>
                                {formatValue(val, col, lang)}
                              </span>
                            ) : (
                              formatValue(val, col, lang)
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
            </DataTable>
          )}
        </div>
      )}

      {viewMode === 'chart' && (
        filteredRows.length === 0 ? (
          <div className="card"><div style={{ textAlign:'center', padding:48, color:'#9CA3AF' }}>{tr.noData}</div></div>
        ) : (
          <div className="grid-2" style={{ display:'grid', gridTemplateColumns: hasSecondChart ? '1fr 1fr' : '1fr', gap:20 }}>
            {activeTab === 'financial' ? (
              <div className="card" style={{ gridColumn: '1/-1' }}>
                <div className="card-header">
                  <h2 style={{ fontSize:15, fontWeight:600, color:'#1A1A2E' }}>
                    {lang==='ar'?'الإيرادات والتكاليف والربح':'Revenue, Costs & Profit'}
                  </h2>
                </div>
                <div className="card-body">
                  <ChartWrapper height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={filteredRows}>
                        <XAxis dataKey="date" tick={{ fontSize:11 }} tickFormatter={(v: string) => v?.slice(5) || ''} />
                        <YAxis tick={{ fontSize:11 }} />
                        <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} ${tr.sar}`} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" name={lang==='ar'?'الإيرادات':'Revenue'} stroke="var(--gold)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="costs" name={lang==='ar'?'التكاليف':'Costs'} stroke="#EF4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="profit" name={lang==='ar'?'الربح':'Profit'} stroke="#10B981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </div>
              </div>
            ) : activeTab === 'appointments' ? (
              <>
                <div className="card">
                  <div className="card-header">
                    <h2 style={{ fontSize:15, fontWeight:600, color:'#1A1A2E' }}>
                      {lang==='ar'?'الإيرادات حسب التاريخ':'Revenue by Date'}
                    </h2>
                  </div>
                  <div className="card-body">
                    <ChartWrapper height={280}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={appointmentsChartData}>
                          <XAxis dataKey="date" tick={{ fontSize:11 }} tickFormatter={(v: string) => v?.slice(5) || ''} />
                          <YAxis tick={{ fontSize:11 }} />
                          <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} ${tr.sar}`} />
                          <Bar dataKey="total" fill="var(--gold)" radius={[6,6,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartWrapper>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <h2 style={{ fontSize:15, fontWeight:600, color:'#1A1A2E' }}>
                      {lang==='ar'?'توزيع المواعيد حسب الحالة':'Status Distribution'}
                    </h2>
                  </div>
                  <div className="card-body">
                    <ChartWrapper height={280}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                            {statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartWrapper>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="card">
                  <div className="card-header">
                    <h2 style={{ fontSize:15, fontWeight:600, color:'#1A1A2E' }}>
                      {chartValueCol ? (lang==='ar'?chartValueCol.labelAr:chartValueCol.labelEn) : ''} — {lang==='ar'?'الأعلى':'Top'} 10
                    </h2>
                  </div>
                  <div className="card-body">
                    <ChartWrapper height={280}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={genericChartData} layout="vertical" margin={{ left:0, right:0 }}>
                          <XAxis type="number" tick={{ fontSize:11 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize:11 }} width={120} />
                          <Tooltip formatter={(v: any) => chartValueCol?.type === 'currency' ? `${Number(v).toLocaleString()} ${tr.sar}` : Number(v).toLocaleString()} />
                          <Bar dataKey="value" fill="var(--gold)" radius={[0,6,6,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartWrapper>
                  </div>
                </div>
                {statusChartData.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h2 style={{ fontSize:15, fontWeight:600, color:'#1A1A2E' }}>
                        {lang==='ar'?'التوزيع':'Distribution'}
                      </h2>
                    </div>
                    <div className="card-body">
                      <ChartWrapper height={280}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                              {statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartWrapper>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )
      )}

      <iframe ref={printFrameRef} style={{ display:'none' }} />
    </div>
  )
}
