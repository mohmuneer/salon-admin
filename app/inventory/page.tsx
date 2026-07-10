'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import { Plus, Minus, AlertTriangle, Search, RotateCcw, RefreshCw, Archive, Layers } from 'lucide-react'
import DataTable from '@/app/components/DataTable'

export default function InventoryPage() {
  const { lang } = useLang()
  const tr = t[lang]

  const [products, setProducts] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [dialog, setDialog] = useState<{ open: boolean; type: 'in' | 'out' | 'adjust'; product?: any }>({ open: false, type: 'in' })
  const [form, setForm] = useState({ quantity: 0, reference: '', notes: '' })

  const load = async () => {
    setLoading(true)
    try {
      const [invRes, deptRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/departments').then(r => r.json()).catch(() => []),
      ])
      const data = await invRes.json()
      setProducts(data.products || [])
      setTransactions(data.transactions || [])
      setDepartments(deptRes)
    } catch { }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openDialog = (type: 'in' | 'out' | 'adjust', product: any) => {
    setDialog({ open: true, type, product })
    setForm({ quantity: 0, reference: '', notes: '' })
  }

  const submitTx = async () => {
    if (!dialog.product || form.quantity <= 0) return
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: dialog.product.id,
        type: dialog.type,
        quantity: form.quantity,
        reference: form.reference,
        notes: form.notes,
      }),
    })
    setDialog({ open: false, type: 'in' })
    load()
  }

  const filtered = products.filter((p: any) => {
    if (departmentFilter && p.department_id !== departmentFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return p.name_ar.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
  })

  const lowStock = products.filter((p: any) => p.current_stock <= p.min_stock_alert)

  const txTypeLabel = (type: string) => {
    if (type === 'in') return lang === 'ar' ? 'وارد' : 'Stock In'
    if (type === 'out') return lang === 'ar' ? 'منصرف' : 'Stock Out'
    return lang === 'ar' ? 'تسوية' : 'Adjustment'
  }

  const txTypeColor = (type: string) => {
    if (type === 'in') return '#10B981'
    if (type === 'out') return '#EF4444'
    return '#F59E0B'
  }

  const dialogTitle = () => {
    if (dialog.type === 'in') return lang === 'ar' ? 'إضافة مخزون وارد' : 'Add Stock In'
    if (dialog.type === 'out') return lang === 'ar' ? 'صرف مخزون' : 'Dispense Stock'
    return lang === 'ar' ? 'تسوية مخزون' : 'Adjust Stock'
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E' }}>
          {lang === 'ar' ? 'المخزون' : 'Inventory'}
        </h1>
        <button className="btn btn-ghost" onClick={load}>
          <RefreshCw size={15} /> {lang === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {lowStock.length > 0 && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12,
          padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <AlertTriangle size={20} color="#EF4444" style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: '#991B1B', fontSize: 14 }}>
            {lang === 'ar'
              ? `تنبيه: ${lowStock.length} منتجات تحت حد الطلب الآمن`
              : `Alert: ${lowStock.length} products below minimum stock level`}
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {lowStock.slice(0, 5).map((p: any) => (
              <span key={p.id} style={{
                background: '#FEE2E2', padding: '3px 10px', borderRadius: 20, fontSize: 12,
                color: '#B91C1C', fontWeight: 500,
              }}>
                {p.name_ar} ({p.current_stock})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filter-bar" style={{ padding: '14px 18px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search size={15} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: 12, color: '#9CA3AF' }} />
            <input className="input-field" style={{ paddingInlineStart: 36 }}
              placeholder={lang === 'ar' ? 'بحث عن منتج...' : 'Search products...'}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field" style={{ width:160 }} value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}>
            <option value="">{lang==='ar'?'كل الأقسام':'All Departments'}</option>
            {departments.filter((d:any) => d.is_active).map((d:any) => (
              <option key={d.id} value={d.id}>{lang==='ar'?d.name_ar:(d.name_en||d.name_ar)}</option>
            ))}
          </select>
          <span style={{ fontSize: 13, color: '#6B7280' }}>
            {lang === 'ar' ? `${filtered.length} منتج` : `${filtered.length} products`}
          </span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <DataTable>
          <table className="data-table">
            <thead>
              <tr>
                <th className="">#</th>
                <th>{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                <th>{lang === 'ar' ? 'القسم' : 'Department'}</th>
                <th>{tr.brand}</th>
                <th>{tr.category}</th>
                <th>{lang === 'ar' ? 'الوارد' : 'Received'}</th>
                <th>{lang === 'ar' ? 'المنصرف' : 'Dispensed'}</th>
                <th style={{ color: 'var(--gold)' }}>{lang === 'ar' ? 'المتوفر' : 'Available'}</th>
                <th>{lang === 'ar' ? 'الحد الأدنى' : 'Min Stock'}</th>
                <th className="">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>{tr.loading}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>{tr.noData}</td></tr>
              ) : filtered.map((p: any, i: number) => {
                const low = p.current_stock <= p.min_stock_alert
                return (
                  <tr key={p.id}>
                    <td className="" style={{ color: '#9CA3AF', fontSize: 12 }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{p.name_ar}</td>
                    <td style={{ color: '#6B7280', fontSize:13 }}>
                      {p.department_name ? (
                        <span><Layers size={12} style={{verticalAlign:'middle', marginInlineEnd:4}} />{lang==='ar'?p.department_name:(p.department_name_en||p.department_name)}</span>
                      ) : '—'}
                    </td>
                    <td style={{ color: '#6B7280' }}>{p.brand || '—'}</td>
                    <td style={{ color: '#6B7280' }}>{p.category || '—'}</td>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>+{p.total_received}</td>
                    <td style={{ color: '#EF4444', fontWeight: 600 }}>-{p.total_dispensed}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {low && <AlertTriangle size={14} color="#EF4444" />}
                        <span style={{ fontWeight: 700, fontSize: 16, color: low ? '#EF4444' : 'var(--gold)' }}>
                          {p.current_stock}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{p.min_stock_alert}</td>
                    <td className="">
                      <div className="action-buttons">
                        <button className="btn btn-icon" onClick={() => openDialog('in', p)}
                          title={lang === 'ar' ? 'إضافة وارد' : 'Stock In'}>
                          <Plus size={16} />
                        </button>
                        <button className="btn btn-icon" onClick={() => openDialog('out', p)}
                          title={lang === 'ar' ? 'صرف' : 'Stock Out'}>
                          <Minus size={16} />
                        </button>
                        <button className="btn btn-icon" onClick={() => openDialog('adjust', p)}
                          title={lang === 'ar' ? 'تسوية' : 'Adjust'}>
                          <RotateCcw size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </DataTable>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Archive size={16} />
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>
            {lang === 'ar' ? 'سجل الحركات' : 'Transaction History'}
          </h2>
        </div>
        <DataTable>
          <table className="data-table">
            <thead>
              <tr>
                <th className="">{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                <th>{lang === 'ar' ? 'النوع' : 'Type'}</th>
                <th>{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                <th>{lang === 'ar' ? 'المخزون قبل' : 'Prev Stock'}</th>
                <th>{lang === 'ar' ? 'المخزون بعد' : 'New Stock'}</th>
                <th>{lang === 'ar' ? 'المرجع' : 'Reference'}</th>
                <th>{lang === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                <th className="">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>
                  {lang === 'ar' ? 'لا توجد حركات بعد' : 'No transactions yet'}
                </td></tr>
              ) : transactions.map((tx: any) => (
                <tr key={tx.id}>
                  <td className="" style={{ fontWeight: 500 }}>{tx.product_name}</td>
                  <td>
                    <span style={{
                      background: txTypeColor(tx.type) + '18',
                      color: txTypeColor(tx.type),
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    }}>{txTypeLabel(tx.type)}</span>
                  </td>
                  <td style={{
                    fontWeight: 700,
                    color: tx.quantity > 0 ? '#10B981' : '#EF4444',
                  }}>
                    {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                  </td>
                  <td style={{ color: '#6B7280' }}>{tx.prev_stock}</td>
                  <td style={{ fontWeight: 600 }}>{tx.new_stock}</td>
                  <td style={{ color: '#6B7280' }}>{tx.reference || '—'}</td>
                  <td style={{ color: '#6B7280', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.notes || '—'}</td>
                  <td className="" style={{ fontSize: 12, color: '#6B7280' }}>
                    {new Date(tx.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </div>

      {dialog.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setDialog({ open: false, type: 'in' })}>
          <div style={{
            background: '#fff', borderRadius: 16, maxWidth: 460, width: '100%',
            padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{dialogTitle()}</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
              {dialog.product?.name_ar}
              {' — '}
              {lang === 'ar' ? 'المخزون الحالي:' : 'Current stock:'}
              {' '}
              <strong style={{ color: 'var(--gold)' }}>{dialog.product?.current_stock}</strong>
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                {dialog.type === 'adjust'
                  ? (lang === 'ar' ? 'الكمية الجديدة' : 'New Quantity')
                  : (lang === 'ar' ? 'الكمية' : 'Quantity')}
              </label>
              <input className="input-field" type="number" min={1}
                value={form.quantity || ''}
                onChange={e => setForm({ ...form, quantity: Math.max(1, Number(e.target.value)) })}
              />
            </div>

            {dialog.type !== 'adjust' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                  {lang === 'ar' ? 'المرجع' : 'Reference'} <span style={{ color: '#9CA3AF' }}>({lang === 'ar' ? 'اختياري' : 'optional'})</span>
                </label>
                <input className="input-field" type="text"
                  placeholder={lang === 'ar' ? 'مثال: فاتورة مورد #١٢٣' : 'e.g. Supplier invoice #123'}
                  value={form.reference}
                  onChange={e => setForm({ ...form, reference: e.target.value })}
                />
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                {lang === 'ar' ? 'ملاحظات' : 'Notes'} <span style={{ color: '#9CA3AF' }}>({lang === 'ar' ? 'اختياري' : 'optional'})</span>
              </label>
              <input className="input-field" type="text"
                placeholder={lang === 'ar' ? 'ملاحظة عن هذه الحركة' : 'Transaction note'}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={submitTx}>
                {dialog.type === 'in' && <Plus size={16} />}
                {dialog.type === 'out' && <Minus size={16} />}
                {dialog.type === 'adjust' && <RotateCcw size={15} />}
                {dialogTitle()}
              </button>
              <button className="btn btn-ghost" onClick={() => setDialog({ open: false, type: 'in' })}>
                {tr.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
