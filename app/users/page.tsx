'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import AddButton from '@/app/components/AddButton'
import { Phone, Mail, UserCheck, UserX, ShieldCheck, Pencil, Trash2, X, Check, Search } from 'lucide-react'

const initialForm = {
  name: '', phone: '', email: '', password: '', gender: 'male', role: 'staff',
  specialty: '', salon_id: '', gender_served: 'both'
}

export default function UsersPage() {
  const { lang } = useLang()
  const tr = t[lang]
  const [users, setUsers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff'>('all')
  const [branchFilter, setBranchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const load = () => {
    setLoading(true)
    fetch('/api/users').then(r => r.json()).then(d => { setUsers(d); setLoading(false) })
  }

  useEffect(() => {
    load()
    fetch('/api/branches').then(r => r.json()).then(d => setBranches(Array.isArray(d) ? d : []))
  }, [])

  const addUser = async () => {
    await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowAdd(false)
    setForm(initialForm)
    load()
  }

  const toggle = async (id: string, is_active: boolean) => {
    await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: !is_active }) })
    load()
  }

  const saveEdit = async () => {
    await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    setEditingId(null)
    load()
  }

  const deleteItem = async (id: string) => {
    if (!confirm(lang==='ar'?'هل أنت متأكد من حذف هذا المستخدم؟':'Delete this user?')) return
    await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const genderServedLabel = (g: string) => {
    if (g === 'ladies') return tr.ladies
    if (g === 'gents') return tr.gents
    return tr.both
  }

  const filtered = users.filter((u: any) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (branchFilter && u.salon_id !== branchFilter) return false
    if (statusFilter === 'active' && !u.is_active) return false
    if (statusFilter === 'inactive' && u.is_active) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !(u.name || '').toLowerCase().includes(q) &&
        !(u.phone || '').includes(q) &&
        !(u.email || '').toLowerCase().includes(q) &&
        !(u.specialty || '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{tr.users}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {filtered.length === users.length
              ? `${users.length} ${lang === 'ar' ? 'مستخدم' : 'users'}`
              : `${filtered.length} / ${users.length} ${lang === 'ar' ? 'مستخدم' : 'users'}`}
          </p>
        </div>
        <AddButton onClick={() => setShowAdd(true)} label={lang==='ar'?'إضافة مستخدم':'Add User'} tooltip={lang==='ar'?'إضافة مستخدم جديد':'Add new user'} />
      </div>

      {/* Search & Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filter-bar" style={{ padding: '14px 18px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: 12, color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingInlineStart: 36 }}
              placeholder={tr.search} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field" style={{ width: 150 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)}>
            <option value="all">{lang === 'ar' ? 'كل الأدوار' : 'All Roles'}</option>
            <option value="admin">{tr.roleAdmin}</option>
            <option value="staff">{tr.roleStaff}</option>
          </select>
          <select className="input-field" style={{ width: 160 }} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            <option value="">{lang === 'ar' ? 'كل الفروع' : 'All Branches'}</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={statusFilter === s ? 'btn btn-tab active' : 'btn btn-tab'}>
                {s === 'all' ? (lang === 'ar' ? 'الكل' : 'All') : s === 'active' ? tr.active : tr.inactive}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 600 }}>{tr.addUserBtn}</h2></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.name}</label>
                <input className="input-field" type="text" aria-label={tr.name} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.phone}</label>
                <input className="input-field" type="tel" aria-label={tr.phone} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.email}</label>
                <input className="input-field" type="email" aria-label={tr.email} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.password}</label>
                <input className="input-field" type="password" aria-label={tr.password} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.gender}</label>
                <select className="input-field" aria-label={tr.gender} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="male">{tr.male}</option>
                  <option value="female">{tr.female}</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.role}</label>
                <select className="input-field" aria-label={tr.role} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="staff">{tr.roleStaff}</option>
                  <option value="admin">{tr.roleAdmin}</option>
                </select>
              </div>

              {form.role === 'staff' && (
                <>
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.specialty}</label>
                    <input className="input-field" type="text" aria-label={tr.specialty} value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.branch}</label>
                    <select className="input-field" aria-label={tr.branch} value={form.salon_id} onChange={e => setForm({ ...form, salon_id: e.target.value })}>
                      <option value="">—</option>
                      {branches.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.genderServed}</label>
                    <select className="input-field" aria-label={tr.genderServed} value={form.gender_served} onChange={e => setForm({ ...form, gender_served: e.target.value })}>
                      <option value="both">{tr.both}</option>
                      <option value="ladies">{tr.ladies}</option>
                      <option value="gents">{tr.gents}</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={addUser}>{tr.save}</button>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>{tr.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Users Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {loading ? (
          <div style={{ color: '#9CA3AF', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>{tr.loading}</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#9CA3AF', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>{tr.noData}</div>
        ) : filtered.map((u: any) => (
          <div key={u.id} className="card" style={{ opacity: u.is_active ? 1 : 0.6 }}>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: u.is_active ? 'linear-gradient(135deg, var(--gold), var(--gold-light))' : '#E5E7EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 20, fontWeight: 700
                }}>
                  {u.name?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1A2E' }}>{u.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--gold)' }}>
                    <ShieldCheck size={12} />
                    {u.role === 'admin' ? tr.roleAdmin : tr.roleStaff}
                  </div>
                </div>
                {editingId !== u.id && (
                  <button className="btn btn-icon"
                    onClick={() => { setEditingId(u.id); setEditForm({ ...u }) }}
                  >
                    <Pencil size={18} color="var(--gold)" />
                  </button>
                )}
                <button className="btn btn-icon"
                  onClick={() => toggle(u.id, u.is_active)}
                >
                  {u.is_active
                    ? <UserCheck size={20} color="#10B981" />
                    : <UserX size={20} color="#EF4444" />
                  }
                </button>
              </div>

              {editingId === u.id ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.name}</label>
                      <input className="input-field" type="text" aria-label={tr.name} value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.phone}</label>
                      <input className="input-field" type="tel" aria-label={tr.phone} value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.email}</label>
                      <input className="input-field" type="email" aria-label={tr.email} value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.role}</label>
                      <select className="input-field" aria-label={tr.role} value={editForm.role || 'staff'} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                        <option value="staff">{tr.roleStaff}</option>
                        <option value="admin">{tr.roleAdmin}</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.password}</label>
                      <input className="input-field" type="password" aria-label={tr.password} value={editForm.password || ''} onChange={e => setEditForm({ ...editForm, password: e.target.value })} placeholder={lang === 'ar' ? 'اتركه فارغاً إذا لم ترد التغيير' : 'Leave empty to keep current'} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.gender}</label>
                      <select className="input-field" aria-label={tr.gender} value={editForm.gender || 'male'} onChange={e => setEditForm({ ...editForm, gender: e.target.value })}>
                        <option value="male">{tr.male}</option>
                        <option value="female">{tr.female}</option>
                      </select>
                    </div>
                    {editForm.role === 'staff' && (
                      <>
                        <div>
                          <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.specialty}</label>
                          <input className="input-field" type="text" aria-label={tr.specialty} value={editForm.specialty || ''} onChange={e => setEditForm({ ...editForm, specialty: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>{tr.genderServed}</label>
                          <select className="input-field" aria-label={tr.genderServed} value={editForm.gender_served || 'both'} onChange={e => setEditForm({ ...editForm, gender_served: e.target.value })}>
                            <option value="both">{tr.both}</option>
                            <option value="ladies">{tr.ladies}</option>
                            <option value="gents">{tr.gents}</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveEdit}><Check size={16} /> {tr.save}</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}><X size={16} /> {tr.cancel}</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteItem(u.id)}><Trash2 size={16} /> {tr.delete || 'Delete'}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280' }}>
                      <Phone size={14} color="var(--gold)" /> {u.phone}
                    </div>
                    {u.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280' }}>
                        <Mail size={14} color="var(--gold)" /> {u.email}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #F1EDE4' }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      {u.role === 'staff' ? `${u.specialty || ''}${u.branch_name ? ' · ' + u.branch_name : ''}` : ''}
                      {u.role === 'staff' && u.gender_served && ` · ${genderServedLabel(u.gender_served)}`}
                    </span>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                      background: u.is_active ? '#D1FAE5' : '#F3F4F6',
                      color: u.is_active ? '#065F46' : '#6B7280'
                    }}>{u.is_active ? tr.active : tr.inactive}</span>
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
