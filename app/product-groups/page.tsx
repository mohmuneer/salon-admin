'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import {
  Boxes, Warehouse, Package, Pencil, Trash2, X, Check, CalendarDays,
} from 'lucide-react'
import AddButton from '@/app/components/AddButton'
import DataTable from '@/app/components/DataTable'

const EMPTY_FORM = { name_ar: '', name_en: '', description: '', warehouse_ids: [] as string[] }

function WarehouseMultiSelect({ warehouses, selected, onChange, isAr }: {
  warehouses: any[]; selected: string[]; onChange: (ids: string[]) => void; isAr: boolean
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, maxHeight: 180, overflowY: 'auto', padding: 8 }}>
      {warehouses.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8 }}>{isAr ? 'لا توجد مخازن' : 'No warehouses'}</div>
      ) : warehouses.map((w: any) => {
        const isChecked = selected.includes(w.id)
        return (
          <label key={w.id} style={{
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
            <input type="checkbox" checked={isChecked} onChange={() => toggle(w.id)} style={{ display: 'none' }} />
            {isAr ? w.name_ar : (w.name_en || w.name_ar)}
          </label>
        )
      })}
    </div>
  )
}

export default function ProductGroupsPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const tr = t[lang]

  const [groups, setGroups] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/product-groups').then(r => r.ok ? r.json() : []).then(setGroups).catch(() => setGroups([])),
      fetch('/api/warehouses').then(r => r.ok ? r.json() : []).then(setWarehouses).catch(() => setWarehouses([])),
    ]).then(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const addGroup = async () => {
    if (!form.name_ar) return
    await fetch('/api/product-groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowAdd(false)
    setForm({ ...EMPTY_FORM })
    load()
  }

  const saveEdit = async () => {
    await fetch('/api/product-groups', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    setEditingId(null)
    load()
  }

  const deleteItem = async (id: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذه المجموعة؟' : 'Are you sure you want to delete this group?')) return
    await fetch('/api/product-groups', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const toggleActive = async (g: any) => {
    await fetch('/api/product-groups', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: g.id, name_ar: g.name_ar, name_en: g.name_en, description: g.description, is_active: !g.is_active, warehouse_ids: (g.warehouses || []).map((w: any) => w.id) }),
    })
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
            <Boxes size={22} style={{ marginInlineEnd: 8, verticalAlign: 'middle', color: 'var(--primary)' }} />
            {isAr ? 'المجموعات' : 'Product Groups'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {groups.length} {isAr ? 'مجموعة' : 'groups'}
          </p>
        </div>
        <AddButton onClick={() => setShowAdd(true)} label={isAr ? 'إضافة مجموعة' : 'Add Group'} tooltip={isAr ? 'إضافة مجموعة جديدة' : 'Add new group'} />
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{isAr ? 'إضافة مجموعة جديدة' : 'Add New Group'}</h2>
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
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{tr.description}</label>
                  <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'المخازن المرتبطة' : 'Linked Warehouses'}</label>
                  <WarehouseMultiSelect warehouses={warehouses} selected={form.warehouse_ids} onChange={ids => setForm({ ...form, warehouse_ids: ids })} isAr={isAr} />
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>{tr.cancel}</button>
              <button className="btn btn-primary" onClick={addGroup} disabled={!form.name_ar}>{tr.save}</button>
            </div>
          </div>
        </div>
      )}

      <DataTable>
        <table className="data-table">
          <thead>
            <tr>
              <th className="">{isAr ? 'اسم المجموعة' : 'Name'}</th>
              <th>{isAr ? 'المخازن' : 'Warehouses'}</th>
              <th>{isAr ? 'المنتجات' : 'Products'}</th>
              <th>{tr.status}</th>
              <th>{isAr ? 'تاريخ الإضافة' : 'Created'}</th>
              <th className="">{tr.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{tr.loading}</td></tr>
            ) : groups.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{tr.noData}</td></tr>
            ) : groups.map((g: any) => (
              <tr key={g.id} style={{ opacity: g.is_active ? 1 : 0.5 }}>
                {editingId === g.id ? (
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
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{tr.description}</label>
                        <input className="input-field" value={editForm.description || ''} onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{isAr ? 'المخازن المرتبطة' : 'Linked Warehouses'}</label>
                        <WarehouseMultiSelect warehouses={warehouses} selected={editForm.warehouse_ids || []} onChange={ids => setEditForm((f: any) => ({ ...f, warehouse_ids: ids }))} isAr={isAr} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button className="btn btn-primary btn-sm" onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Check size={14} /> {tr.save}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <X size={14} /> {tr.cancel}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteItem(g.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, marginInlineStart: 'auto' }}>
                        <Trash2 size={14} /> {isAr ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Boxes size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{g.name_ar}</div>
                          {g.name_en && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g.name_en}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      {(g.warehouses || []).length === 0 ? (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {g.warehouses.map((w: any) => (
                            <span key={w.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                              <Warehouse size={11} />{isAr ? w.name_ar : (w.name_en || w.name_ar)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Package size={13} style={{ color: '#8B5CF6' }} />
                        <span style={{ fontWeight: 600 }}>{g.product_count}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${g.is_active ? 'badge-completed' : 'badge-cancelled'}`}>
                        {g.is_active ? tr.active : tr.inactive}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      <CalendarDays size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
                      {g.created_at ? new Date(g.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="">
                      <div className="action-buttons">
                        <button className="btn btn-icon" title={isAr ? 'تعديل' : 'Edit'}
                          onClick={() => {
                            setEditingId(g.id)
                            setEditForm({
                              id: g.id, name_ar: g.name_ar, name_en: g.name_en || '', description: g.description || '',
                              is_active: g.is_active, warehouse_ids: (g.warehouses || []).map((w: any) => w.id),
                            })
                          }}>
                          <Pencil size={15} color="var(--primary)" />
                        </button>
                        <button className="btn btn-icon" title={g.is_active ? (isAr ? 'إيقاف' : 'Deactivate') : (isAr ? 'تفعيل' : 'Activate')}
                          onClick={() => toggleActive(g)}>
                          {g.is_active ? <Check size={16} color="#10B981" /> : <X size={16} color="#EF4444" />}
                        </button>
                        <button className="btn btn-icon" title={isAr ? 'حذف' : 'Delete'} onClick={() => deleteItem(g.id)}>
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
      </DataTable>
    </div>
  )
}
