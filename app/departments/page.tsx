'use client'
import { useEffect, useState, useRef } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import {
  Layers, Building2, Users, Scissors, Pencil, Trash2,
  X, Check, CalendarDays, Upload, Loader2, Image as ImageIcon, Eye,
} from 'lucide-react'
import AddButton from '@/app/components/AddButton'

/* ── Image uploader ── */
function ImageUploader({
  value, onChange, label, size = 'md',
}: {
  value: string
  onChange: (url: string) => void
  label?: string
  size?: 'sm' | 'md'
}) {
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (r.ok && d.url) onChange(d.url)
    } catch {}
    setBusy(false)
    if (ref.current) ref.current.value = ''
  }

  const previewH = size === 'sm' ? 64 : 90

  return (
    <div>
      {label && (
        <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6, fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Preview box */}
        <div
          style={{
            width: previewH * 1.4, height: previewH, borderRadius: 10,
            overflow: 'hidden', border: '1.5px dashed #D1D5DB',
            background: '#F9FAFB', flexShrink: 0, position: 'relative',
            cursor: 'pointer',
          }}
          onClick={() => ref.current?.click()}
          title="انقر لتغيير الصورة"
        >
          {value ? (
            <>
              <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Hover overlay — handled on parent div */}
              <div className="img-upload-overlay" style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', transition: 'background .2s',
              }}>
                <Upload size={18} color="white" style={{ opacity: 0.9 }} />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 4 }}>
              <ImageIcon size={22} color="#9CA3AF" />
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>اختر صورة</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handle} />

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => ref.current?.click()}
            disabled={busy}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content' }}
          >
            {busy ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={13} />}
            {busy ? 'جاري الرفع...' : value ? 'تغيير الصورة' : 'رفع صورة'}
          </button>

          {value && (
            <>
              <a href={value} target="_blank" rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, width: 'fit-content', fontSize: 12, color: 'var(--primary-500)', textDecoration: 'none' }}>
                <Eye size={12} /> معاينة
              </a>
              <button type="button" onClick={() => onChange('')}
                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 11, textAlign: 'start', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={11} /> حذف الصورة
              </button>
            </>
          )}

          <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>JPG، PNG، WEBP — حجم أقصى 5 ميجابايت</p>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════ */
const EMPTY_FORM = {
  salon_id: '', name_ar: '', name_en: '', description: '',
  image_url: '', slug: '', seo_title: '', seo_description: '',
}

export default function DepartmentsPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const tr = t[lang]

  const [departments, setDepartments] = useState<any[]>([])
  const [branches,    setBranches]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showAdd,     setShowAdd]     = useState(false)
  const [form,        setForm]        = useState({ ...EMPTY_FORM })
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [editForm,    setEditForm]    = useState<any>({})
  const [imgPreviews, setImgPreviews] = useState<{ [id: string]: string }>({})

  const loadBranches = () =>
    fetch('/api/branches').then(r => r.ok ? r.json() : []).then(setBranches).catch(() => setBranches([]))

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/departments').then(r => r.ok ? r.json() : []).then(setDepartments).catch(() => setDepartments([])),
      loadBranches(),
    ]).then(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const addDepartment = async () => {
    if (!form.salon_id || !form.name_ar) return
    await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowAdd(false)
    setForm({ ...EMPTY_FORM })
    load()
  }

  const saveEdit = async () => {
    await fetch('/api/departments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditingId(null)
    load()
  }

  const deleteItem = async (id: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure?')) return
    await fetch('/api/departments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  const toggle = async (id: string, is_active: boolean) => {
    await fetch('/api/departments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !is_active }),
    })
    load()
  }

  const branchName = (d: any) => isAr ? d.branch_name : (d.branch_name_en || d.branch_name)

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
          <Layers size={24} style={{ marginInlineEnd: 8, verticalAlign: 'middle', color: 'var(--primary-500)' }} />
          {isAr ? 'الأقسام' : 'Departments'}
        </h1>
        <AddButton onClick={() => setShowAdd(true)} label={isAr ? 'إضافة قسم' : 'Add Department'} tooltip={isAr ? 'إضافة قسم جديد' : 'Add new department'} />
      </div>

      {/* ── Add Modal ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{isAr ? 'إضافة قسم جديد' : 'Add New Department'}</h2>
              <button className="btn btn-icon" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gap: 16 }}>
                {/* Branch */}
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.branch} *</label>
                  <select className="input-field" value={form.salon_id} onChange={e => setForm({ ...form, salon_id: e.target.value })}>
                    <option value="">{isAr ? 'اختر الفرع' : 'Select branch'}</option>
                    {branches.map((b: any) => (
                      <option key={b.id} value={b.id}>{isAr ? b.name : (b.name_en || b.name)}</option>
                    ))}
                  </select>
                </div>

                {/* Names grid */}
                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'} *</label>
                    <input className="input-field" type="text" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
                    <input className="input-field" type="text" value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.description}</label>
                  <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>

                {/* Slug */}
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{isAr ? 'الرابط (Slug)' : 'Slug (URL)'}</label>
                  <input className="input-field" type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder={isAr ? 'مثال: hair' : 'e.g. hair'} />
                </div>

                {/* ── Image Upload ── */}
                <ImageUploader
                  label={isAr ? 'صورة القسم' : 'Department Image'}
                  value={form.image_url}
                  onChange={url => setForm({ ...form, image_url: url })}
                />

                {/* SEO */}
                <div style={{ paddingTop: 4, borderTop: '1px solid #F3F4F6' }}>
                  <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10, fontWeight: 500 }}>SEO</p>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 5 }}>{isAr ? 'عنوان SEO' : 'SEO Title'}</label>
                      <input className="input-field" type="text" value={form.seo_title} onChange={e => setForm({ ...form, seo_title: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 5 }}>{isAr ? 'وصف SEO' : 'SEO Description'}</label>
                      <textarea className="input-field" rows={2} value={form.seo_description} onChange={e => setForm({ ...form, seo_description: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>{tr.cancel}</button>
              <button className="btn btn-primary" onClick={addDepartment} disabled={!form.salon_id || !form.name_ar}>{tr.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>{isAr ? 'صورة' : 'Image'}</th>
              <th>{isAr ? 'اسم القسم' : 'Name'}</th>
              <th>{tr.branch}</th>
              <th>{isAr ? 'موظفون' : 'Staff'}</th>
              <th>{isAr ? 'خدمات' : 'Services'}</th>
              <th>{isAr ? 'منتجات' : 'Products'}</th>
              <th>{tr.status}</th>
              <th>{isAr ? 'تاريخ الإضافة' : 'Created'}</th>
              <th>{tr.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>{tr.loading}</td></tr>
            ) : departments.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>{tr.noData}</td></tr>
            ) : departments.map((d: any) => (
              <tr key={d.id} style={{ opacity: d.is_active ? 1 : 0.5 }}>

                {/* ── Edit row ── */}
                {editingId === d.id ? (
                  <td colSpan={9} style={{ padding: 20 }}>
                    <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {/* Branch */}
                      <div>
                        <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>{tr.branch} *</label>
                        <select className="input-field" value={editForm.salon_id || ''} onChange={e => setEditForm((f: any) => ({ ...f, salon_id: e.target.value }))}>
                          {branches.map((b: any) => (
                            <option key={b.id} value={b.id}>{isAr ? b.name : (b.name_en || b.name)}</option>
                          ))}
                        </select>
                      </div>

                      {/* Name AR */}
                      <div>
                        <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'} *</label>
                        <input className="input-field" type="text" value={editForm.name_ar || ''} onChange={e => setEditForm((f: any) => ({ ...f, name_ar: e.target.value }))} />
                      </div>

                      {/* Name EN */}
                      <div>
                        <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
                        <input className="input-field" type="text" value={editForm.name_en || ''} onChange={e => setEditForm((f: any) => ({ ...f, name_en: e.target.value }))} />
                      </div>

                      {/* Description */}
                      <div>
                        <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>{tr.description}</label>
                        <input className="input-field" type="text" value={editForm.description || ''} onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))} />
                      </div>

                      {/* Slug */}
                      <div>
                        <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>{isAr ? 'الرابط (Slug)' : 'Slug'}</label>
                        <input className="input-field" type="text" value={editForm.slug || ''} onChange={e => setEditForm((f: any) => ({ ...f, slug: e.target.value }))} />
                      </div>

                      {/* SEO Title */}
                      <div>
                        <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>{isAr ? 'عنوان SEO' : 'SEO Title'}</label>
                        <input className="input-field" type="text" value={editForm.seo_title || ''} onChange={e => setEditForm((f: any) => ({ ...f, seo_title: e.target.value }))} />
                      </div>

                      {/* SEO Desc */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>{isAr ? 'وصف SEO' : 'SEO Description'}</label>
                        <input className="input-field" type="text" value={editForm.seo_description || ''} onChange={e => setEditForm((f: any) => ({ ...f, seo_description: e.target.value }))} />
                      </div>

                      {/* ── Image Upload ── */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <ImageUploader
                          label={isAr ? 'صورة القسم' : 'Department Image'}
                          value={editForm.image_url || ''}
                          onChange={url => setEditForm((f: any) => ({ ...f, image_url: url }))}
                          size="sm"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button className="btn btn-primary btn-sm" onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Check size={14} /> {tr.save}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <X size={14} /> {tr.cancel}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteItem(d.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, marginInlineStart: 'auto' }}>
                        <Trash2 size={14} /> {tr.delete || (isAr ? 'حذف' : 'Delete')}
                      </button>
                    </div>
                  </td>
                ) : (
                  <>
                    {/* ── Image cell ── */}
                    <td>
                      {d.image_url ? (
                        <img
                          src={d.image_url}
                          alt=""
                          style={{ width: 44, height: 34, borderRadius: 7, objectFit: 'cover', border: '1px solid #E5E7EB', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          width: 44, height: 34, borderRadius: 7, border: '1px dashed #D1D5DB',
                          background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <ImageIcon size={14} color="#9CA3AF" />
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Layers size={15} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{d.name_ar}</div>
                          {d.name_en && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.name_en}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Branch */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Building2 size={13} style={{ color: '#6B7280' }} />
                        <span style={{ fontSize: 13 }}>{branchName(d)}</span>
                      </div>
                    </td>

                    {/* Employees */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={13} style={{ color: '#6366F1' }} />
                        <span style={{ fontWeight: 600 }}>{d.employee_count}</span>
                      </div>
                    </td>

                    {/* Services */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Scissors size={13} style={{ color: '#10B981' }} />
                        <span style={{ fontWeight: 600 }}>{d.service_count}</span>
                      </div>
                    </td>

                    {/* Products */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Layers size={13} style={{ color: '#8B5CF6' }} />
                        <span style={{ fontWeight: 600 }}>{d.product_count}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                        background: d.is_active ? '#D1FAE5' : '#F3F4F6',
                        color: d.is_active ? '#065F46' : '#6B7280',
                      }}>
                        {d.is_active ? tr.active : tr.inactive}
                      </span>
                    </td>

                    {/* Created */}
                    <td style={{ fontSize: 13, color: '#6B7280' }}>
                      <CalendarDays size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
                      {d.created_at
                        ? new Date(d.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '-'}
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-icon" title={isAr ? 'تعديل' : 'Edit'}
                          onClick={() => {
                            setEditingId(d.id)
                            setEditForm({
                              id: d.id, salon_id: d.salon_id,
                              name_ar: d.name_ar, name_en: d.name_en || '',
                              description: d.description || '',
                              is_active: d.is_active,
                              image_url: d.image_url || '',
                              slug: d.slug || '',
                              seo_title: d.seo_title || '',
                              seo_description: d.seo_description || '',
                            })
                          }}>
                          <Pencil size={15} color="var(--primary-500)" />
                        </button>

                        <button className="btn btn-icon" title={d.is_active ? (isAr ? 'إيقاف' : 'Deactivate') : (isAr ? 'تفعيل' : 'Activate')}
                          onClick={() => toggle(d.id, d.is_active)}>
                          {d.is_active ? <Check size={16} color="#10B981" /> : <X size={16} color="#EF4444" />}
                        </button>

                        <button className="btn btn-icon" title={isAr ? 'حذف' : 'Delete'}
                          onClick={() => deleteItem(d.id)}>
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
