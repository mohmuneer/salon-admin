'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import {
  Warehouse, Building2, Pencil, Trash2, X, Check, CalendarDays,
} from 'lucide-react'
import AddButton from '@/app/components/AddButton'

const EMPTY_FORM = { name_ar: '', name_en: '', address: '', branch_ids: [] as string[] }

function BranchMultiSelect({ branches, selected, onChange, isAr }: {
  branches: any[]; selected: string[]; onChange: (ids: string[]) => void; isAr: boolean
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, maxHeight: 180, overflowY: 'auto', padding: 8 }}>
      {branches.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8 }}>{isAr ? 'لا توجد فروع' : 'No branches'}</div>
      ) : branches.map((b: any) => {
        const isChecked = selected.includes(b.id)
        return (
          <label key={b.id} style={{
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
            <input type="checkbox" checked={isChecked} onChange={() => toggle(b.id)} style={{ display: 'none' }} />
            {isAr ? b.name : (b.name_en || b.name)}
          </label>
        )
      })}
    </div>
  )
}

export default function WarehousesPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const tr = t[lang]

  const [warehouses, setWarehouses] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/warehouses').then(r => r.ok ? r.json() : []).then(setWarehouses).catch(() => setWarehouses([])),
      fetch('/api/branches').then(r => r.ok ? r.json() : []).then(setBranches).catch(() => setBranches([])),
    ]).then(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const addWarehouse = async () => {
    if (!form.name_ar) return
    await fetch('/api/warehouses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowAdd(false)
    setForm({ ...EMPTY_FORM })
    load()
  }

  const saveEdit = async () => {
    await fetch('/api/warehouses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    setEditingId(null)
    load()
  }

  const deleteItem = async (id: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا المخزن؟' : 'Are you sure you want to delete this warehouse?')) return
    await fetch('/api/warehouses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const toggleActive = async (w: any) => {
    await fetch('/api/warehouses', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: w.id, name_ar: w.name_ar, name_en: w.name_en, address: w.address, is_active: !w.is_active, branch_ids: (w.branches || []).map((b: any) => b.id) }),
    })
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
            <Warehouse size={22} style={{ marginInlineEnd: 8, verticalAlign: 'middle', color: 'var(--primary)' }} />
            {isAr ? 'المخازن' : 'Warehouses'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {warehouses.length} {isAr ? 'مخزن' : 'warehouses'}
          </p>
        </div>
        <AddButton onClick={() => setShowAdd(true)} label={isAr ? 'إضافة مخزن' : 'Add Warehouse'} tooltip={isAr ? 'إضافة مخزن جديد' : 'Add new warehouse'} />
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{isAr ? 'إضافة مخزن جديد' : 'Add New Warehouse'}</h2>
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
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'العنوان' : 'Address'}</label>
                  <input className="input-field" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{isAr ? 'الفروع المرتبطة' : 'Linked Branches'}</label>
                  <BranchMultiSelect branches={branches} selected={form.branch_ids} onChange={ids => setForm({ ...form, branch_ids: ids })} isAr={isAr} />
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>{tr.cancel}</button>
              <button className="btn btn-primary" onClick={addWarehouse} disabled={!form.name_ar}>{tr.save}</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{isAr ? 'اسم المخزن' : 'Name'}</th>
              <th>{isAr ? 'العنوان' : 'Address'}</th>
              <th>{isAr ? 'الفروع' : 'Branches'}</th>
              <th>{tr.status}</th>
              <th>{isAr ? 'تاريخ الإضافة' : 'Created'}</th>
              <th>{tr.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{tr.loading}</td></tr>
            ) : warehouses.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{tr.noData}</td></tr>
            ) : warehouses.map((w: any) => (
              <tr key={w.id} style={{ opacity: w.is_active ? 1 : 0.5 }}>
                {editingId === w.id ? (
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
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{isAr ? 'العنوان' : 'Address'}</label>
                        <input className="input-field" value={editForm.address || ''} onChange={e => setEditForm((f: any) => ({ ...f, address: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{isAr ? 'الفروع المرتبطة' : 'Linked Branches'}</label>
                        <BranchMultiSelect branches={branches} selected={editForm.branch_ids || []} onChange={ids => setEditForm((f: any) => ({ ...f, branch_ids: ids }))} isAr={isAr} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button className="btn btn-primary btn-sm" onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Check size={14} /> {tr.save}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <X size={14} /> {tr.cancel}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteItem(w.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, marginInlineStart: 'auto' }}>
                        <Trash2 size={14} /> {isAr ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Warehouse size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{w.name_ar}</div>
                          {w.name_en && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.name_en}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{w.address || '—'}</td>
                    <td>
                      {(w.branches || []).length === 0 ? (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {w.branches.map((b: any) => (
                            <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                              <Building2 size={11} />{isAr ? b.name : (b.name_en || b.name)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${w.is_active ? 'badge-completed' : 'badge-cancelled'}`}>
                        {w.is_active ? tr.active : tr.inactive}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      <CalendarDays size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
                      {w.created_at ? new Date(w.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-icon" title={isAr ? 'تعديل' : 'Edit'}
                          onClick={() => {
                            setEditingId(w.id)
                            setEditForm({
                              id: w.id, name_ar: w.name_ar, name_en: w.name_en || '', address: w.address || '',
                              is_active: w.is_active, branch_ids: (w.branches || []).map((b: any) => b.id),
                            })
                          }}>
                          <Pencil size={15} color="var(--primary)" />
                        </button>
                        <button className="btn btn-icon" title={w.is_active ? (isAr ? 'إيقاف' : 'Deactivate') : (isAr ? 'تفعيل' : 'Activate')}
                          onClick={() => toggleActive(w)}>
                          {w.is_active ? <Check size={16} color="#10B981" /> : <X size={16} color="#EF4444" />}
                        </button>
                        <button className="btn btn-icon" title={isAr ? 'حذف' : 'Delete'} onClick={() => deleteItem(w.id)}>
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
