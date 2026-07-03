'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import {
  ClipboardList, Truck, Package, Boxes, Search, Pencil, Trash2, X, Check, Star, Calendar,
} from 'lucide-react'
import AddButton from '@/app/components/AddButton'

const EMPTY_FORM = {
  id: '', mode: 'single' as 'single' | 'group', supplier_id: '', product_id: '', group_id: '',
  supplier_sku: '', supplier_item_name: '', purchase_unit: '', currency_id: '',
  price: '', min_order_qty: '', lead_time_days: '', priority: '0', is_default: false,
  contract_start_date: '', contract_end_date: '',
}

export default function SupplierCatalogPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const tr = t[lang]

  const [entries, setEntries] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [productGroups, setProductGroups] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [search, setSearch] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [defaultsOnly, setDefaultsOnly] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/supplier-catalog').then(r => r.ok ? r.json() : []).then(setEntries).catch(() => setEntries([])),
      fetch('/api/suppliers').then(r => r.ok ? r.json() : []).then(setSuppliers).catch(() => setSuppliers([])),
      fetch('/api/products').then(r => r.ok ? r.json() : []).then(setProducts).catch(() => setProducts([])),
      fetch('/api/product-groups').then(r => r.ok ? r.json() : []).then(setProductGroups).catch(() => setProductGroups([])),
      fetch('/api/currencies').then(r => r.ok ? r.json() : []).then(setCurrencies).catch(() => setCurrencies([])),
    ]).then(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setForm({ ...EMPTY_FORM })
    setError('')
    setShowModal(true)
  }

  const openEdit = (e: any) => {
    setForm({
      id: e.id, mode: 'single', supplier_id: e.supplier_id, product_id: e.product_id, group_id: '',
      supplier_sku: e.supplier_sku || '', supplier_item_name: e.supplier_item_name || '',
      purchase_unit: e.purchase_unit || '', currency_id: e.currency_id || '',
      price: e.price ?? '', min_order_qty: e.min_order_qty ?? '', lead_time_days: e.lead_time_days ?? '',
      priority: String(e.priority ?? 0), is_default: e.is_default === true,
      contract_start_date: e.contract_start_date || '', contract_end_date: e.contract_end_date || '',
    })
    setError('')
    setShowModal(true)
  }

  const groupProductCount = form.group_id ? products.filter((p: any) => p.group_id === form.group_id).length : 0

  const save = async () => {
    setError('')
    if (!form.supplier_id) { setError(isAr ? 'اختر المورد' : 'Select a supplier'); return }
    if (form.mode === 'single' && !form.product_id) { setError(isAr ? 'اختر الصنف' : 'Select a product'); return }
    if (form.mode === 'group' && !form.group_id) { setError(isAr ? 'اختر مجموعة الأصناف' : 'Select a product group'); return }

    setSaving(true)
    const sharedBody = {
      supplier_id: form.supplier_id,
      purchase_unit: form.purchase_unit, currency_id: form.currency_id || null,
      price: form.price === '' ? null : Number(form.price),
      min_order_qty: form.min_order_qty === '' ? null : Number(form.min_order_qty),
      lead_time_days: form.lead_time_days === '' ? null : Number(form.lead_time_days),
      priority: form.priority === '' ? 0 : Number(form.priority),
      is_default: form.is_default,
      contract_start_date: form.contract_start_date || null,
      contract_end_date: form.contract_end_date || null,
    }

    try {
      if (form.id) {
        const res = await fetch('/api/supplier-catalog', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...sharedBody, id: form.id, product_id: form.product_id, supplier_sku: form.supplier_sku, supplier_item_name: form.supplier_item_name }),
        })
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'فشل الحفظ') }
      } else if (form.mode === 'single') {
        const res = await fetch('/api/supplier-catalog', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...sharedBody, product_ids: [form.product_id], supplier_sku: form.supplier_sku, supplier_item_name: form.supplier_item_name }),
        })
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'فشل الحفظ') }
      } else {
        const productIds = products.filter((p: any) => p.group_id === form.group_id).map((p: any) => p.id)
        if (productIds.length === 0) { setError(isAr ? 'لا توجد أصناف في هذه المجموعة' : 'No products in this group'); setSaving(false); return }
        const res = await fetch('/api/supplier-catalog', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...sharedBody, product_ids: productIds }),
        })
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'فشل الحفظ') }
      }
      setShowModal(false)
      load()
    } catch (err: any) {
      setError(err.message || (isAr ? 'حدث خطأ' : 'Something went wrong'))
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا الربط؟' : 'Are you sure you want to delete this link?')) return
    await fetch('/api/supplier-catalog', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const filtered = entries.filter((e: any) => {
    if (supplierFilter && e.supplier_id !== supplierFilter) return false
    if (defaultsOnly && !e.is_default) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !(e.supplier_name_ar || '').toLowerCase().includes(q) &&
        !(e.product_name_ar || '').toLowerCase().includes(q) &&
        !(e.supplier_sku || '').toLowerCase().includes(q) &&
        !(e.supplier_item_name || '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
            <ClipboardList size={22} style={{ marginInlineEnd: 8, verticalAlign: 'middle', color: 'var(--primary)' }} />
            {isAr ? 'كتالوج الموردين' : 'Supplier Catalog'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {filtered.length === entries.length
              ? `${entries.length} ${isAr ? 'ربط' : 'links'}`
              : `${filtered.length} / ${entries.length} ${isAr ? 'ربط' : 'links'}`}
          </p>
        </div>
        <AddButton onClick={openAdd} label={isAr ? 'ربط مورد بصنف' : 'Link Supplier to Product'} tooltip={isAr ? 'إضافة ربط جديد' : 'Add new link'} />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filter-bar" style={{ padding: '14px 18px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: 12, color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingInlineStart: 36 }}
              placeholder={tr.search} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field" style={{ width: 200 }} value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
            <option value="">{isAr ? 'كل الموردين' : 'All Suppliers'}</option>
            {suppliers.map((s: any) => (
              <option key={s.id} value={s.id}>{isAr ? s.name_ar : (s.name_en || s.name_ar)}</option>
            ))}
          </select>
          <button onClick={() => setDefaultsOnly(v => !v)} className={defaultsOnly ? 'btn btn-tab active' : 'btn btn-tab'}>
            <Star size={13} style={{ marginInlineEnd: 4 }} />
            {isAr ? 'الموردون الافتراضيون فقط' : 'Defaults only'}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>
                {form.id ? (isAr ? 'تعديل ربط المورد' : 'Edit Supplier Link') : (isAr ? 'ربط مورد بصنف' : 'Link Supplier to Product')}
              </h2>
              <button className="btn btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gap: 16 }}>

                {!form.id && (
                  <div style={{ display: 'flex', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="radio" checked={form.mode === 'single'} onChange={() => setForm({ ...form, mode: 'single' })} />
                      <Package size={14} /> {isAr ? 'صنف واحد' : 'Single Product'}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="radio" checked={form.mode === 'group'} onChange={() => setForm({ ...form, mode: 'group' })} />
                      <Boxes size={14} /> {isAr ? 'مجموعة أصناف كاملة' : 'Whole Product Group'}
                    </label>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    <Truck size={13} style={{ marginInlineEnd: 4 }} />{isAr ? 'المورد' : 'Supplier'} *
                  </label>
                  <select className="input-field" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                    <option value="">{isAr ? 'اختر المورد' : 'Select supplier'}</option>
                    {suppliers.filter((s: any) => s.is_active).map((s: any) => (
                      <option key={s.id} value={s.id}>{isAr ? s.name_ar : (s.name_en || s.name_ar)}</option>
                    ))}
                  </select>
                </div>

                {form.mode === 'single' ? (
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      <Package size={13} style={{ marginInlineEnd: 4 }} />{isAr ? 'الصنف' : 'Product'} *
                    </label>
                    <select className="input-field" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                      <option value="">{isAr ? 'اختر الصنف' : 'Select product'}</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name_ar}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      <Boxes size={13} style={{ marginInlineEnd: 4 }} />{isAr ? 'مجموعة الأصناف' : 'Product Group'} *
                    </label>
                    <select className="input-field" value={form.group_id} onChange={e => setForm({ ...form, group_id: e.target.value })}>
                      <option value="">{isAr ? 'اختر المجموعة' : 'Select group'}</option>
                      {productGroups.filter((g: any) => g.is_active).map((g: any) => (
                        <option key={g.id} value={g.id}>{isAr ? g.name_ar : (g.name_en || g.name_ar)}</option>
                      ))}
                    </select>
                    {form.group_id && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                        {isAr ? `سيتم ربط المورد بـ ${groupProductCount} صنف ضمن هذه المجموعة` : `This will link the supplier to ${groupProductCount} products in this group`}
                      </p>
                    )}
                  </div>
                )}

                {form.mode === 'single' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'رقم صنف المورد' : 'Supplier SKU'}</label>
                      <input className="input-field" value={form.supplier_sku} onChange={e => setForm({ ...form, supplier_sku: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'اسم الصنف لدى المورد' : 'Item Name at Supplier'}</label>
                      <input className="input-field" value={form.supplier_item_name} onChange={e => setForm({ ...form, supplier_item_name: e.target.value })} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'وحدة الشراء' : 'Purchase Unit'}</label>
                    <input className="input-field" value={form.purchase_unit} placeholder={isAr ? 'مثال: كرتون، علبة' : 'e.g. box, carton'} onChange={e => setForm({ ...form, purchase_unit: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'العملة' : 'Currency'}</label>
                    <select className="input-field" value={form.currency_id} onChange={e => setForm({ ...form, currency_id: e.target.value })}>
                      <option value="">{isAr ? 'بدون' : 'None'}</option>
                      {currencies.filter((c: any) => c.is_active).map((c: any) => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'السعر' : 'Price'}</label>
                    <input className="input-field" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'الحد الأدنى للطلب' : 'Min Order Qty'}</label>
                    <input className="input-field" type="number" min="0" value={form.min_order_qty} onChange={e => setForm({ ...form, min_order_qty: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'مدة التوريد (أيام)' : 'Lead Time (days)'}</label>
                    <input className="input-field" type="number" min="0" value={form.lead_time_days} onChange={e => setForm({ ...form, lead_time_days: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'تاريخ بداية التعاقد' : 'Contract Start'}</label>
                    <input className="input-field" type="date" value={form.contract_start_date} onChange={e => setForm({ ...form, contract_start_date: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'تاريخ نهاية التعاقد' : 'Contract End'}</label>
                    <input className="input-field" type="date" value={form.contract_end_date} onChange={e => setForm({ ...form, contract_end_date: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'أولوية المورد' : 'Supplier Priority'}</label>
                    <input className="input-field" type="number" min="0" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                      placeholder={isAr ? '0 = الأعلى أولوية' : '0 = highest priority'} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 26 }}>
                    <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} />
                    <Star size={14} color="#F59E0B" />
                    {isAr ? `المورد الافتراضي ${form.mode === 'group' ? '(لكل أصناف المجموعة)' : 'لهذا الصنف'}` : `Default supplier ${form.mode === 'group' ? '(for all products in group)' : 'for this product'}`}
                  </label>
                </div>

                {form.is_default && (
                  <p style={{ fontSize: 12, color: '#B45309', background: '#FEF3C7', padding: '8px 12px', borderRadius: 8, margin: 0 }}>
                    {isAr ? 'سيتم إلغاء تعيين أي مورد افتراضي آخر لنفس الصنف تلقائياً — لا يمكن أن يكون هناك أكثر من مورد افتراضي واحد لكل صنف.' : 'Any other default supplier for the same product will be automatically unset — only one default supplier is allowed per product.'}
                  </p>
                )}

                {error && <div style={{ color: '#EF4444', fontSize: 13 }}>{error}</div>}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{tr.cancel}</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : tr.save}</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{isAr ? 'المورد' : 'Supplier'}</th>
                <th>{isAr ? 'الصنف' : 'Product'}</th>
                <th>{isAr ? 'رقم صنف المورد' : 'Supplier SKU'}</th>
                <th>{isAr ? 'اسم الصنف لدى المورد' : 'Supplier Item Name'}</th>
                <th>{isAr ? 'وحدة الشراء' : 'Unit'}</th>
                <th>{isAr ? 'السعر' : 'Price'}</th>
                <th>{isAr ? 'الحد الأدنى' : 'Min Qty'}</th>
                <th>{isAr ? 'مدة التوريد' : 'Lead Time'}</th>
                <th>{isAr ? 'الأولوية' : 'Priority'}</th>
                <th>{isAr ? 'افتراضي' : 'Default'}</th>
                <th>{isAr ? 'فترة التعاقد' : 'Contract Period'}</th>
                <th>{tr.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{tr.loading}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={12} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{tr.noData}</td></tr>
              ) : filtered.map((e: any) => (
                <tr key={e.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Truck size={13} style={{ color: 'var(--primary)' }} />
                      {isAr ? e.supplier_name_ar : (e.supplier_name_en || e.supplier_name_ar)}
                    </div>
                  </td>
                  <td>{e.product_name_ar}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{e.supplier_sku || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{e.supplier_item_name || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{e.purchase_unit || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{e.price != null ? `${Number(e.price).toLocaleString()} ${e.currency_symbol || e.currency_code || ''}` : '—'}</td>
                  <td>{e.min_order_qty ?? '—'}</td>
                  <td>{e.lead_time_days != null ? `${e.lead_time_days} ${isAr ? 'يوم' : 'd'}` : '—'}</td>
                  <td>{e.priority}</td>
                  <td>{e.is_default ? <Star size={16} color="#F59E0B" fill="#F59E0B" /> : '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {e.contract_start_date || e.contract_end_date ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} />
                        {e.contract_start_date || '—'} → {e.contract_end_date || '—'}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-icon" title={isAr ? 'تعديل' : 'Edit'} onClick={() => openEdit(e)}>
                        <Pencil size={15} color="var(--primary)" />
                      </button>
                      <button className="btn btn-icon" title={isAr ? 'حذف' : 'Delete'} onClick={() => deleteItem(e.id)}>
                        <Trash2 size={15} color="#EF4444" />
                      </button>
                    </div>
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
