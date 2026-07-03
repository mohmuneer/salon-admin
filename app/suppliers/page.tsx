'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import {
  Truck, Phone, Mail, Package, Pencil, Trash2, X, Check, CalendarDays, KeyRound, Search, Boxes, Star,
} from 'lucide-react'
import AddButton from '@/app/components/AddButton'

const EMPTY_FORM = { name_ar: '', name_en: '', phone: '', email: '', address: '', supplier_group_id: '', product_ids: [] as string[], password: '' }
const EMPTY_POLICY = { supplier_sku: '', price: '', lead_time_days: '', is_default: false }

function ProductMultiSelect({ products, selected, onChange, isAr, productGroups, groupFilter, onGroupFilterChange }: {
  products: any[]; selected: string[]; onChange: (ids: string[]) => void; isAr: boolean
  productGroups: any[]; groupFilter: string; onGroupFilterChange: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }
  const q = query.trim().toLowerCase()
  const filtered = products.filter((p: any) => {
    if (q && !(p.name_ar || '').toLowerCase().includes(q) && !(p.name_en || '').toLowerCase().includes(q)) return false
    return true
  })
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={13} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: 10, color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingInlineStart: 30, fontSize: 13, height: 32 }}
            placeholder={isAr ? 'بحث عن منتج...' : 'Search products...'}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <select className="input-field" style={{ width: 180, fontSize: 13, height: 32 }} value={groupFilter}
          onChange={e => onGroupFilterChange(e.target.value)}>
          <option value="">{isAr ? 'كل المجموعات' : 'All Groups'}</option>
          {productGroups.filter((g: any) => g.is_active).map((g: any) => (
            <option key={g.id} value={g.id}>{isAr ? g.name_ar : (g.name_en || g.name_ar)}</option>
          ))}
        </select>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, maxHeight: 180, overflowY: 'auto', padding: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8 }}>
            {products.length === 0 ? (isAr ? 'لا توجد منتجات' : 'No products') : (isAr ? 'لا توجد نتائج' : 'No matches')}
          </div>
        ) : filtered.map((p: any) => {
          const isChecked = selected.includes(p.id)
          return (
            <label key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
              fontSize: 13, background: isChecked ? 'var(--primary-bg)' : 'transparent',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                border: isChecked ? 'none' : '2px solid #D1D5DB',
                background: isChecked ? 'var(--primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isChecked && <Check size={12} color="white" strokeWidth={3} />}
              </div>
              <input type="checkbox" checked={isChecked} onChange={() => toggle(p.id)} style={{ display: 'none' }} />
              <span style={{ flex: 1 }}>{p.name_ar}</span>
              {p.group_name && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.group_name}</span>}
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default function SuppliersPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const tr = t[lang]

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [productGroups, setProductGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [groupFilter, setGroupFilter] = useState('')
  const [editGroupFilter, setEditGroupFilter] = useState('')
  const [productPolicies, setProductPolicies] = useState<Record<string, any>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/suppliers').then(r => r.ok ? r.json() : []).then(setSuppliers).catch(() => setSuppliers([])),
      fetch('/api/supplier-groups').then(r => r.ok ? r.json() : []).then(setGroups).catch(() => setGroups([])),
      fetch('/api/products').then(r => r.ok ? r.json() : []).then(setProducts).catch(() => setProducts([])),
      fetch('/api/product-groups').then(r => r.ok ? r.json() : []).then(setProductGroups).catch(() => setProductGroups([])),
    ]).then(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const saveCatalogPolicies = async (supplierId: string, productIds: string[], policies: Record<string, any>) => {
    for (const pid of productIds) {
      const pol = policies[pid]
      if (pol && (pol.price || pol.supplier_sku || pol.lead_time_days)) {
        await fetch('/api/supplier-catalog', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplier_id: supplierId, product_ids: [pid],
            supplier_sku: pol.supplier_sku || null,
            price: pol.price === '' ? null : Number(pol.price),
            lead_time_days: pol.lead_time_days === '' ? null : Number(pol.lead_time_days),
            is_default: pol.is_default === true,
          }),
        })
      }
    }
  }

  const addSupplier = async () => {
    if (!form.name_ar) return
    setLoading(true)
    const res = await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (data.id && form.product_ids.length > 0) {
      await saveCatalogPolicies(data.id, form.product_ids, productPolicies)
    }
    setShowAdd(false)
    setForm({ ...EMPTY_FORM })
    setProductPolicies({})
    setGroupFilter('')
    load()
  }

  const saveEdit = async () => {
    setLoading(true)
    await fetch('/api/suppliers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    const supplierId = editForm.id
    const productIds = editForm.product_ids || []
    const polKey = `edit_${supplierId}`
    const editPolicies = productPolicies[polKey] || {}
    if (supplierId && productIds.length > 0) {
      await saveCatalogPolicies(supplierId, productIds, editPolicies)
    }
    setEditingId(null)
    setEditForm({})
    setProductPolicies({})
    setEditGroupFilter('')
    load()
  }

  const deleteItem = async (id: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا المورد؟' : 'Are you sure you want to delete this supplier?')) return
    await fetch('/api/suppliers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const toggleActive = async (s: any) => {
    await fetch('/api/suppliers', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: s.id, name_ar: s.name_ar, name_en: s.name_en, phone: s.phone, email: s.email, address: s.address,
        supplier_group_id: s.supplier_group_id, is_active: !s.is_active, product_ids: (s.products || []).map((p: any) => p.id),
      }),
    })
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
            <Truck size={22} style={{ marginInlineEnd: 8, verticalAlign: 'middle', color: 'var(--primary)' }} />
            {isAr ? 'الموردون' : 'Suppliers'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {suppliers.length} {isAr ? 'مورد' : 'suppliers'}
          </p>
        </div>
        <AddButton onClick={() => setShowAdd(true)} label={isAr ? 'إضافة مورد' : 'Add Supplier'} tooltip={isAr ? 'إضافة مورد جديد' : 'Add new supplier'} />
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{isAr ? 'إضافة مورد جديد' : 'Add New Supplier'}</h2>
              <button className="btn btn-icon" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'} *</label>
                    <input className="input-field" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
                    <input className="input-field" value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{tr.phone}</label>
                    <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{tr.email}</label>
                    <input className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'العنوان' : 'Address'}</label>
                  <input className="input-field" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'مجموعة الموردين' : 'Supplier Group'}</label>
                  <select className="input-field" value={form.supplier_group_id} onChange={e => setForm({ ...form, supplier_group_id: e.target.value })}>
                    <option value="">{isAr ? 'بدون مجموعة' : 'No Group'}</option>
                    {groups.filter((g: any) => g.is_active).map((g: any) => (
                      <option key={g.id} value={g.id}>{isAr ? g.name_ar : (g.name_en || g.name_ar)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    <KeyRound size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
                    {isAr ? 'كلمة مرور بوابة المورد' : 'Supplier Portal Password'}
                  </label>
                  <input type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder={isAr ? 'لتفعيل تسجيل الدخول (اختياري)' : 'To enable portal login (optional)'} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'المنتجات الموردة' : 'Supplied Products'}</label>
                  <ProductMultiSelect
                    products={groupFilter ? products.filter((p: any) => p.group_id === groupFilter) : products}
                    selected={form.product_ids}
                    onChange={ids => {
                      setForm({ ...form, product_ids: ids })
                      const newPolicies = { ...productPolicies }
                      ids.forEach(id => { if (!newPolicies[id]) newPolicies[id] = { ...EMPTY_POLICY } })
                      setProductPolicies(newPolicies)
                    }}
                    isAr={isAr}
                    productGroups={productGroups}
                    groupFilter={groupFilter}
                    onGroupFilterChange={setGroupFilter}
                  />
                </div>
                {form.product_ids.length > 0 && (
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      <Star size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
                      {isAr ? 'سياسة المورد للأصناف المختارة' : 'Supplier Policy for Selected Products'}
                    </label>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '8px 10px', textAlign: 'start', fontWeight: 600 }}>{isAr ? 'الصنف' : 'Product'}</th>
                            <th style={{ padding: '8px 10px', textAlign: 'start', fontWeight: 600 }}>{isAr ? 'رقم الصنف' : 'SKU'}</th>
                            <th style={{ padding: '8px 10px', textAlign: 'start', fontWeight: 600, width: 100 }}>{isAr ? 'السعر' : 'Price'}</th>
                            <th style={{ padding: '8px 10px', textAlign: 'start', fontWeight: 600, width: 80 }}>{isAr ? 'مدة التوريد' : 'Lead Time'}</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, width: 70 }}>{isAr ? 'افتراضي' : 'Default'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.product_ids.map((pid: string) => {
                            const p = products.find((x: any) => x.id === pid)
                            const pol = productPolicies[pid] || EMPTY_POLICY
                            return (
                              <tr key={pid} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '6px 10px', fontWeight: 500 }}>{p?.name_ar || '—'}</td>
                                <td style={{ padding: '6px 10px' }}>
                                  <input className="input-field" style={{ height: 28, fontSize: 12, width: 90 }}
                                    value={pol.supplier_sku}
                                    onChange={e => setProductPolicies(pp => ({ ...pp, [pid]: { ...pp[pid], supplier_sku: e.target.value } }))}
                                    placeholder={isAr ? 'SKU' : 'SKU'} />
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  <input className="input-field" style={{ height: 28, fontSize: 12, width: 90 }}
                                    type="number" step="0.01" min="0" value={pol.price}
                                    onChange={e => setProductPolicies(pp => ({ ...pp, [pid]: { ...pp[pid], price: e.target.value } }))}
                                    placeholder="0.00" />
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  <input className="input-field" style={{ height: 28, fontSize: 12, width: 70 }}
                                    type="number" min="0" value={pol.lead_time_days}
                                    onChange={e => setProductPolicies(pp => ({ ...pp, [pid]: { ...pp[pid], lead_time_days: e.target.value } }))}
                                    placeholder={isAr ? 'أيام' : 'days'} />
                                </td>
                                <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                  <input type="checkbox" checked={pol.is_default === true}
                                    onChange={e => {
                                      const newPolicies = { ...productPolicies }
                                      Object.keys(newPolicies).forEach(k => { newPolicies[k] = { ...newPolicies[k], is_default: false } })
                                      newPolicies[pid] = { ...newPolicies[pid], is_default: e.target.checked }
                                      setProductPolicies(newPolicies)
                                    }} />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>{tr.cancel}</button>
              <button className="btn btn-primary" onClick={addSupplier} disabled={!form.name_ar}>{tr.save}</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{isAr ? 'اسم المورد' : 'Name'}</th>
              <th>{isAr ? 'التواصل' : 'Contact'}</th>
              <th>{isAr ? 'المجموعة' : 'Group'}</th>
              <th>{isAr ? 'المنتجات' : 'Products'}</th>
              <th>{tr.status}</th>
              <th>{tr.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{tr.loading}</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{tr.noData}</td></tr>
            ) : suppliers.map((s: any) => (
              <tr key={s.id} style={{ opacity: s.is_active ? 1 : 0.5 }}>
                {editingId === s.id ? (
                  <td colSpan={6} style={{ padding: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'} *</label>
                        <input className="input-field" value={editForm.name_ar || ''} onChange={e => setEditForm((f: any) => ({ ...f, name_ar: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
                        <input className="input-field" value={editForm.name_en || ''} onChange={e => setEditForm((f: any) => ({ ...f, name_en: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{tr.phone}</label>
                        <input className="input-field" value={editForm.phone || ''} onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{tr.email}</label>
                        <input className="input-field" value={editForm.email || ''} onChange={e => setEditForm((f: any) => ({ ...f, email: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{isAr ? 'العنوان' : 'Address'}</label>
                        <input className="input-field" value={editForm.address || ''} onChange={e => setEditForm((f: any) => ({ ...f, address: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{isAr ? 'مجموعة الموردين' : 'Supplier Group'}</label>
                        <select className="input-field" value={editForm.supplier_group_id || ''} onChange={e => setEditForm((f: any) => ({ ...f, supplier_group_id: e.target.value }))}>
                          <option value="">{isAr ? 'بدون مجموعة' : 'No Group'}</option>
                          {groups.filter((g: any) => g.is_active).map((g: any) => (
                            <option key={g.id} value={g.id}>{isAr ? g.name_ar : (g.name_en || g.name_ar)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                          <KeyRound size={12} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
                          {isAr ? 'كلمة مرور بوابة المورد' : 'Supplier Portal Password'}
                        </label>
                        <input type="password" className="input-field" value={editForm.password || ''} onChange={e => setEditForm((f: any) => ({ ...f, password: e.target.value }))}
                          placeholder={isAr ? 'اتركه فارغاً لعدم التغيير' : 'Leave blank to keep unchanged'} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{isAr ? 'المنتجات الموردة' : 'Supplied Products'}</label>
                        <ProductMultiSelect
                          products={editGroupFilter ? products.filter((p: any) => p.group_id === editGroupFilter) : products}
                          selected={editForm.product_ids || []}
                          onChange={ids => {
                            setEditForm((f: any) => ({ ...f, product_ids: ids }))
                            const polKey = `edit_${editForm.id}`
                            const newPolicies = { ...productPolicies, [polKey]: { ...(productPolicies[polKey] || {}) } }
                            ids.forEach((id: string) => { if (!newPolicies[polKey][id]) newPolicies[polKey][id] = { ...EMPTY_POLICY } })
                            setProductPolicies(newPolicies)
                          }}
                          isAr={isAr}
                          productGroups={productGroups}
                          groupFilter={editGroupFilter}
                          onGroupFilterChange={setEditGroupFilter}
                        />
                      </div>
                      {(editForm.product_ids || []).length > 0 && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                            <Star size={12} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
                            {isAr ? 'سياسة المورد للأصناف المختارة' : 'Supplier Policy for Selected Products'}
                          </label>
                          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', fontSize: 12 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
                                  <th style={{ padding: '6px 8px', textAlign: 'start', fontWeight: 600 }}>{isAr ? 'الصنف' : 'Product'}</th>
                                  <th style={{ padding: '6px 8px', textAlign: 'start', fontWeight: 600 }}>{isAr ? 'رقم الصنف' : 'SKU'}</th>
                                  <th style={{ padding: '6px 8px', textAlign: 'start', fontWeight: 600, width: 90 }}>{isAr ? 'السعر' : 'Price'}</th>
                                  <th style={{ padding: '6px 8px', textAlign: 'start', fontWeight: 600, width: 70 }}>{isAr ? 'مدة التوريد' : 'Lead Time'}</th>
                                  <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, width: 60 }}>{isAr ? 'افتراضي' : 'Default'}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(editForm.product_ids || []).map((pid: string) => {
                                  const p = products.find((x: any) => x.id === pid)
                                  const polKey = `edit_${editForm.id}`
                                  const pol = (productPolicies[polKey] || {})[pid] || EMPTY_POLICY
                                  return (
                                    <tr key={pid} style={{ borderBottom: '1px solid var(--border)' }}>
                                      <td style={{ padding: '4px 8px', fontWeight: 500 }}>{p?.name_ar || '—'}</td>
                                      <td style={{ padding: '4px 8px' }}>
                                        <input className="input-field" style={{ height: 26, fontSize: 11, width: 80 }}
                                          value={pol.supplier_sku}
                                          onChange={e => {
                                            const k = `edit_${editForm.id}`;
                                            setProductPolicies(pp => ({ ...pp, [k]: { ...(pp[k] || {}), [pid]: { ...((pp[k] || {})[pid] || EMPTY_POLICY), supplier_sku: e.target.value } } }))
                                          }}
                                          placeholder="SKU" />
                                      </td>
                                      <td style={{ padding: '4px 8px' }}>
                                        <input className="input-field" style={{ height: 26, fontSize: 11, width: 80 }}
                                          type="number" step="0.01" min="0" value={pol.price}
                                          onChange={e => {
                                            const k = `edit_${editForm.id}`;
                                            setProductPolicies(pp => ({ ...pp, [k]: { ...(pp[k] || {}), [pid]: { ...((pp[k] || {})[pid] || EMPTY_POLICY), price: e.target.value } } }))
                                          }}
                                          placeholder="0.00" />
                                      </td>
                                      <td style={{ padding: '4px 8px' }}>
                                        <input className="input-field" style={{ height: 26, fontSize: 11, width: 60 }}
                                          type="number" min="0" value={pol.lead_time_days}
                                          onChange={e => {
                                            const k = `edit_${editForm.id}`;
                                            setProductPolicies(pp => ({ ...pp, [k]: { ...(pp[k] || {}), [pid]: { ...((pp[k] || {})[pid] || EMPTY_POLICY), lead_time_days: e.target.value } } }))
                                          }}
                                          placeholder={isAr ? 'أيام' : 'days'} />
                                      </td>
                                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                                        <input type="checkbox" checked={pol.is_default === true}
                                          onChange={e => {
                                            const k = `edit_${editForm.id}`
                                            const groupPolicies = { ...(productPolicies[k] || {}) }
                                            Object.keys(groupPolicies).forEach(kid => { groupPolicies[kid] = { ...groupPolicies[kid], is_default: false } })
                                            groupPolicies[pid] = { ...(groupPolicies[pid] || EMPTY_POLICY), is_default: e.target.checked }
                                            setProductPolicies(pp => ({ ...pp, [k]: groupPolicies }))
                                          }} />
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button className="btn btn-primary btn-sm" onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Check size={14} /> {tr.save}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(null); setEditGroupFilter('') }} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <X size={14} /> {tr.cancel}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteItem(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, marginInlineStart: 'auto' }}>
                        <Trash2 size={14} /> {isAr ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Truck size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.name_ar}</div>
                          {s.name_en && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.name_en}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {s.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{s.phone}</div>}
                      {s.email && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{s.email}</div>}
                      {!s.phone && !s.email && '—'}
                      {s.has_login && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981', marginTop: 2 }}>
                          <KeyRound size={11} />{isAr ? 'له دخول للبوابة' : 'Portal access'}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {(isAr ? s.group_name_ar : (s.group_name_en || s.group_name_ar)) || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Package size={13} style={{ color: '#8B5CF6' }} />
                        <span style={{ fontWeight: 600 }}>{(s.products || []).length}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${s.is_active ? 'badge-completed' : 'badge-cancelled'}`}>
                        {s.is_active ? tr.active : tr.inactive}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-icon" title={isAr ? 'تعديل' : 'Edit'}
                          onClick={() => {
                            setEditGroupFilter('')
                            const existingProductIds = (s.products || []).map((p: any) => p.id)
                            setEditingId(s.id)
                            setEditForm({
                              id: s.id, name_ar: s.name_ar, name_en: s.name_en || '', phone: s.phone || '', email: s.email || '',
                              address: s.address || '', supplier_group_id: s.supplier_group_id || '', is_active: s.is_active,
                              product_ids: existingProductIds, password: '',
                            })
                            const polKey = `edit_${s.id}`
                            const initPolicies: Record<string, any> = {}
                            existingProductIds.forEach((pid: string) => { initPolicies[pid] = { ...EMPTY_POLICY } })
                            setProductPolicies(pp => ({ ...pp, [polKey]: initPolicies }))
                          }}>
                          <Pencil size={15} color="var(--primary)" />
                        </button>
                        <button className="btn btn-icon" title={s.is_active ? (isAr ? 'إيقاف' : 'Deactivate') : (isAr ? 'تفعيل' : 'Activate')}
                          onClick={() => toggleActive(s)}>
                          {s.is_active ? <Check size={16} color="#10B981" /> : <X size={16} color="#EF4444" />}
                        </button>
                        <button className="btn btn-icon" title={isAr ? 'حذف' : 'Delete'} onClick={() => deleteItem(s.id)}>
                          <Trash2 size={15} color="#EF4444" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
