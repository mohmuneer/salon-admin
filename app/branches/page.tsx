'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import { MapPin, Clock, UserCheck, UserX, Pencil, Trash2, X, Check } from 'lucide-react'
import AddButton from '@/app/components/AddButton'

export default function BranchesPage() {
  const { lang } = useLang()
  const tr = t[lang]
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '', name_en: '', address: '', city: '', type: 'mixed',
    opening_time: '09:00', closing_time: '21:00'
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  const load = () => {
    setLoading(true)
    fetch('/api/branches').then(r => r.json()).then(d => { setBranches(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const addBranch = async () => {
    await fetch('/api/branches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowAdd(false)
    setForm({ name: '', name_en: '', address: '', city: '', type: 'mixed', opening_time: '09:00', closing_time: '21:00' })
    load()
  }

  const toggle = async (id: string, is_active: boolean) => {
    await fetch('/api/branches', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: !is_active }) })
    load()
  }

  const saveEdit = async () => {
    await fetch('/api/branches', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    setEditingId(null)
    load()
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return
    await fetch('/api/branches', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const typeLabel = (type: string) => {
    if (type === 'ladies') return tr.ladiesOnly
    if (type === 'gents') return tr.gentsOnly
    return tr.mixed
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E' }}>{tr.branches}</h1>
        <AddButton onClick={() => setShowAdd(true)} label={lang==='ar'?'إضافة فرع':'Add Branch'} tooltip={lang==='ar'?'إضافة فرع جديد':'Add new branch'} />
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 600 }}>{tr.addBranch}</h2></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: tr.branchNameAr, key: 'name', type: 'text' },
                { label: tr.branchNameEn, key: 'name_en', type: 'text' },
                { label: tr.address, key: 'address', type: 'text' },
                { label: tr.city, key: 'city', type: 'text' },
                { label: tr.openingTime, key: 'opening_time', type: 'time' },
                { label: tr.closingTime, key: 'closing_time', type: 'time' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{label}</label>
                  <input
                    className="input-field"
                    type={type}
                    aria-label={label}
                    value={(form as any)[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.branchType}</label>
                <select className="input-field" aria-label={tr.branchType} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="mixed">{tr.mixed}</option>
                  <option value="ladies">{tr.ladiesOnly}</option>
                  <option value="gents">{tr.gentsOnly}</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={addBranch}>{tr.save}</button>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>{tr.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Branches Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {loading ? (
          <div style={{ color: '#9CA3AF', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>{tr.loading}</div>
        ) : branches.map((b: any) => (
          <div key={b.id} className="card" style={{ opacity: b.is_active ? 1 : 0.6 }}>
            <div style={{ padding: 20 }}>
              {editingId === b.id ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: tr.branchNameAr, key: 'name', type: 'text' },
                      { label: tr.branchNameEn, key: 'name_en', type: 'text' },
                      { label: tr.address, key: 'address', type: 'text' },
                      { label: tr.city, key: 'city', type: 'text' },
                      { label: tr.openingTime, key: 'opening_time', type: 'time' },
                      { label: tr.closingTime, key: 'closing_time', type: 'time' },
                    ].map(({ label, key, type }) => (
                      <div key={key}>
                        <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{label}</label>
                        <input
                          className="input-field"
                          type={type}
                          aria-label={label}
                          value={(editForm as any)[key] || ''}
                          onChange={e => setEditForm((f: any) => ({ ...f, [key]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.branchType}</label>
                      <select className="input-field" aria-label={tr.branchType} value={editForm.type || 'mixed'} onChange={e => setEditForm((f: any) => ({ ...f, type: e.target.value }))}>
                        <option value="mixed">{tr.mixed}</option>
                        <option value="ladies">{tr.ladiesOnly}</option>
                        <option value="gents">{tr.gentsOnly}</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveEdit}><Check size={18} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}><X size={18} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteItem(b.id)}><Trash2 size={18} /></button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A2E', marginBottom: 4 }}>{b.name}</div>
                      {b.name_en && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{b.name_en}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-icon"
                        onClick={() => { setEditingId(b.id); setEditForm({ id: b.id, name: b.name, name_en: b.name_en || '', address: b.address || '', city: b.city || '', type: b.type || 'mixed', opening_time: b.opening_time || '09:00', closing_time: b.closing_time || '21:00', is_active: b.is_active }) }}
                      >
                        <Pencil size={16} color="var(--gold)" />
                      </button>
                      <button className="btn btn-icon"
                        onClick={() => toggle(b.id, b.is_active)}
                      >
                        {b.is_active
                          ? <UserCheck size={20} color="#10B981" />
                          : <UserX size={20} color="#EF4444" />
                        }
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
                    <MapPin size={14} color="var(--gold)" />
                    {b.address}, {b.city}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
                    <Clock size={14} color="var(--gold)" />
                    {b.opening_time?.slice(0, 5)} - {b.closing_time?.slice(0, 5)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #F1EDE4' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                      background: '#F1EDE4', color: '#6B5B3E'
                    }}>{typeLabel(b.type)}</span>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                      background: b.is_active ? '#D1FAE5' : '#F3F4F6',
                      color: b.is_active ? '#065F46' : '#6B7280'
                    }}>{b.is_active ? tr.active : tr.inactive}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
