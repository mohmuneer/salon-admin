'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import {
  Truck, Phone, Mail, Package, Pencil, Trash2, X, Check, CalendarDays, KeyRound,
} from 'lucide-react'
import AddButton from '@/app/components/AddButton'

const EMPTY_FORM = { name_ar: '', name_en: '', phone: '', email: '', address: '', supplier_group_id: '', product_ids: [] as string[], password: '' }

function ProductMultiSelect({ products, selected, onChange, isAr }: {
  products: any[]; selected: string[]; onChange: (ids: string[]) => void; isAr: boolean
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, maxHeight: 180, overflowY: 'auto', padding: 8 }}>
      {products.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8 }}>{isAr ? 'لا توجد منتجات' : 'No products'}</div>
      ) : products.map((p: any) => {
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
            {p.name_ar}
          </label>
        )
      })}
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
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/suppliers').then(r => r.ok ? r.json() : []).then(setSuppliers).catch(() => setSuppliers([])),
      fetch('/api/supplier-groups').then(r => r.ok ? r.json() : []).then(setGroups).catch(() => setGroups([])),
      fetch('/api/products').then(r => r.ok ? r.json() : []).then(setProducts).catch(() => setProducts([])),
    ]).then(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const addSupplier = async () => {
    if (!form.name_ar) return
    await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowAdd(false)
    setForm({ ...EMPTY_FORM })
    load()
  }

  const saveEdit = async () => {
    await fetch('/api/suppliers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    setEditingId(null)
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
                  <ProductMultiSelect products={products} selected={form.product_ids} onChange={ids => setForm({ ...form, product_ids: ids })} isAr={isAr} />
                </div>
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
                        <ProductMultiSelect products={products} selected={editForm.product_ids || []} onChange={ids => setEditForm((f: any) => ({ ...f, product_ids: ids }))} isAr={isAr} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button className="btn btn-primary btn-sm" onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Check size={14} /> {tr.save}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
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
                            setEditingId(s.id)
                            setEditForm({
                              id: s.id, name_ar: s.name_ar, name_en: s.name_en || '', phone: s.phone || '', email: s.email || '',
                              address: s.address || '', supplier_group_id: s.supplier_group_id || '', is_active: s.is_active,
                              product_ids: (s.products || []).map((p: any) => p.id), password: '',
                            })
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
