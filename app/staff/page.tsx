'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import {
  Star, UserCheck, UserX, Pencil, Trash2, X, Check,
  Phone, Mail, Scissors, Users, Building2, Layers, Search, KeyRound,
} from 'lucide-react'
import AddButton from '@/app/components/AddButton'
import Link from 'next/link'

export default function StaffPage() {
  const { lang } = useLang()
  const tr = t[lang]
  const isAr = lang === 'ar'
  const [staff, setStaff] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [genderServedFilter, setGenderServedFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    fetch('/api/branches').then(r => { if (!r.ok) return []; return r.json() }).then(setBranches).catch(() => setBranches([]))
    fetch('/api/departments').then(r => { if (!r.ok) return []; return r.json() }).then(setDepartments).catch(() => setDepartments([]))
  }, [])

  const load = () => {
    setLoading(true)
    fetch('/api/staff').then(r => r.json()).then(d => { setStaff(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const toggle = async (id: string, is_active: boolean) => {
    await fetch('/api/staff', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, is_active: !is_active }) })
    load()
  }

  const openEdit = (s: any) => {
    setEditingId(s.id)
    setEditForm({
      id: s.id, name: s.name, phone: s.phone, email: s.email,
      salon_id: s.salon_id || '', department_id: s.department_id || '',
      specialty: s.specialty, gender_served: s.gender_served,
      rating: s.rating, gender: s.gender, bio: s.bio || '', password: '',
    })
  }

  const saveEdit = async () => {
    setSaving(true)
    await fetch('/api/staff', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(editForm) })
    setEditingId(null)
    setSaving(false)
    load()
  }

  const deleteItem = async (id: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا الموظف؟' : 'Are you sure you want to delete this staff member?')) return
    await fetch('/api/staff', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    load()
  }

  const genderServedLabel = (g: string) => {
    if (g === 'ladies') return isAr ? 'نساء' : 'Ladies'
    if (g === 'gents') return isAr ? 'رجال' : 'Gents'
    return isAr ? 'الكل' : 'Both'
  }

  const filteredStaff = staff.filter((s: any) => {
    if (branchFilter && s.salon_id !== branchFilter) return false
    if (departmentFilter && s.department_id !== departmentFilter) return false
    if (genderServedFilter && s.gender_served !== genderServedFilter) return false
    if (statusFilter === 'active' && !s.is_active) return false
    if (statusFilter === 'inactive' && s.is_active) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !(s.name || '').toLowerCase().includes(q) &&
        !(s.phone || '').includes(q) &&
        !(s.email || '').toLowerCase().includes(q) &&
        !(s.specialty || '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  return (
    <div className="anim-fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{tr.staff}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {filteredStaff.length === staff.length
              ? `${staff.length} ${isAr ? 'موظف' : 'employees'}`
              : `${filteredStaff.length} / ${staff.length} ${isAr ? 'موظف' : 'employees'}`}
          </p>
        </div>
        <AddButton onClick={() => window.location.href='/staff/add'} label={isAr?'إضافة موظف':'Add Employee'} tooltip={isAr?'إضافة موظف جديد':'Add new employee'} />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filter-bar" style={{ padding: '14px 18px' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={15} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', insetInlineStart:12, color:'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingInlineStart:36 }}
              placeholder={tr.search} value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field" style={{ width:160 }} value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setDepartmentFilter('') }}>
            <option value="">{isAr ? 'كل الفروع' : 'All Branches'}</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>{isAr ? b.name : (b.name_en || b.name)}</option>
            ))}
          </select>
          <select className="input-field" style={{ width:160 }} value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
            <option value="">{isAr ? 'كل الأقسام' : 'All Departments'}</option>
            {departments
              .filter((d: any) => !branchFilter || d.salon_id === branchFilter)
              .map((d: any) => (
                <option key={d.id} value={d.id}>{isAr ? d.name_ar : (d.name_en || d.name_ar)}</option>
              ))}
          </select>
          <select className="input-field" style={{ width:140 }} value={genderServedFilter} onChange={e => setGenderServedFilter(e.target.value)}>
            <option value="">{isAr ? 'الكل (يخدم)' : 'All (Serves)'}</option>
            <option value="both">{isAr ? 'الكل' : 'Both'}</option>
            <option value="ladies">{isAr ? 'نساء' : 'Ladies'}</option>
            <option value="gents">{isAr ? 'رجال' : 'Gents'}</option>
          </select>
          <div style={{ display:'flex', gap:6 }}>
            {(['all','active','inactive'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={statusFilter === s ? 'btn btn-tab active' : 'btn btn-tab'}
              >
                {s === 'all' ? (isAr?'الكل':'All') : s === 'active' ? (isAr?'نشط':'Active') : (isAr?'غير نشط':'Inactive')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap: 18 }}>
        {loading ? (
          <div style={{ color:'var(--text-muted)', gridColumn:'1/-1', textAlign:'center', padding: 60 }}>{tr.loading}</div>
        ) : filteredStaff.length === 0 ? (
          <div style={{
            gridColumn: '1/-1', textAlign: 'center', padding: 60,
            color: 'var(--text-muted)', fontSize: 14,
          }}>
            {staff.length === 0 ? (isAr ? 'لا يوجد موظفون بعد' : 'No employees yet') : tr.noData}
          </div>
        ) : filteredStaff.map((s: any) => (
          <div key={s.id} className="premium-stat" style={{ opacity: s.is_active ? 1 : 0.55 }}>
            <div className="stat-glow" />
            <div style={{ display:'flex', alignItems:'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%',
                background: s.is_active
                  ? 'linear-gradient(135deg, var(--primary), var(--primary-light))'
                  : 'var(--border)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontSize: 20, fontWeight: 700, flexShrink: 0,
              }}>
                {s.name?.charAt(0)}
              </div>
              <div style={{ flex:1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 13, color:'var(--primary)', fontWeight: 500 }}>
                  {s.specialty || (isAr ? 'غير محدد' : 'Unspecified')}
                </div>
              </div>
              <div style={{ display:'flex', gap: 6 }}>
                <button
                  onClick={() => openEdit(s)}
                  style={{
                    width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--card)', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: 'var(--primary)', transition: 'all 0.15s',
                  }}
                  title={isAr ? 'تعديل' : 'Edit'}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => toggle(s.id, s.is_active)}
                  style={{
                    width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--card)', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition: 'all 0.15s',
                  }}
                  title={s.is_active ? (isAr ? 'تعطيل' : 'Deactivate') : (isAr ? 'تفعيل' : 'Activate')}
                >
                  {s.is_active ? <UserCheck size={16} color="#10B981" /> : <UserX size={16} color="#EF4444" />}
                </button>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { icon: Phone, label: tr.phone, value: s.phone },
                { icon: Building2, label: tr.branch, value: isAr ? s.branch_name : (s.branch_name_en || s.branch_name || '—') },
                { icon: Layers, label: isAr ? 'القسم' : 'Department', value: isAr ? s.department_name : (s.department_name_en || s.department_name || '—') },
                { icon: Users, label: isAr ? 'يخدم' : 'Serves', value: genderServedLabel(s.gender_served) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{
                  padding: '8px 10px', borderRadius: 8, background: 'var(--surface)',
                }}>
                  <div style={{ fontSize: 10, color:'var(--text-muted)', marginBottom: 2, display:'flex', alignItems:'center', gap: 4 }}>
                    <Icon size={11} />
                    {label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop: 12, borderTop:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <span style={{ fontWeight: 700, color:'var(--text)' }}>{Number(s.rating || 0).toFixed(1)}</span>
                <span style={{ color:'var(--text-muted)', fontSize: 12 }}>({s.reviews_count || 0})</span>
              </div>
              <span className={`badge ${s.is_active ? 'badge-completed' : 'badge-cancelled'}`}>
                {s.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Edit Modal ─────────────────────────────────── */}
      {editingId && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:100,
          display:'flex', alignItems:'center', justifyContent:'center', padding: 20,
          backdropFilter:'blur(4px)',
        }} onClick={() => setEditingId(null)}>
          <div className="card" style={{
            maxWidth: 520, width:'100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h2 style={{ fontSize: 16, fontWeight: 700, display:'flex', alignItems:'center', gap: 8, color:'var(--text)' }}>
                <Pencil size={16} style={{ color:'var(--primary)' }} />
                {isAr ? 'تعديل بيانات الموظف' : 'Edit Employee'}
              </h2>
              <button onClick={() => setEditingId(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div className="card-body">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color:'var(--text-secondary)', display:'block', marginBottom: 4, fontWeight: 500 }}>{tr.name}</label>
                  <input className="input-field" value={editForm.name||''} onChange={e => setEditForm({...editForm, name:e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color:'var(--text-secondary)', display:'block', marginBottom: 4, fontWeight: 500 }}>{tr.phone}</label>
                  <input className="input-field" value={editForm.phone||''} onChange={e => setEditForm({...editForm, phone:e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color:'var(--text-secondary)', display:'block', marginBottom: 4, fontWeight: 500 }}>{tr.email}</label>
                  <input className="input-field" value={editForm.email||''} onChange={e => setEditForm({...editForm, email:e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color:'var(--text-secondary)', display:'block', marginBottom: 4, fontWeight: 500 }}>{tr.specialty}</label>
                  <input className="input-field" value={editForm.specialty||''} onChange={e => setEditForm({...editForm, specialty:e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color:'var(--text-secondary)', display:'block', marginBottom: 4, fontWeight: 500 }}>{isAr ? 'يخدم' : 'Serves'}</label>
                  <select className="input-field" value={editForm.gender_served||'both'} onChange={e => setEditForm({...editForm, gender_served:e.target.value})}>
                    <option value="both">{isAr ? 'الكل' : 'Both'}</option>
                    <option value="ladies">{isAr ? 'نساء' : 'Ladies'}</option>
                    <option value="gents">{isAr ? 'رجال' : 'Gents'}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color:'var(--text-secondary)', display:'block', marginBottom: 4, fontWeight: 500 }}>{tr.rating}</label>
                  <input className="input-field" type="number" step="0.1" min="0" max="5"
                    value={editForm.rating||''} onChange={e => setEditForm({...editForm, rating:e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color:'var(--text-secondary)', display:'block', marginBottom: 4, fontWeight: 500 }}>{tr.gender}</label>
                  <select className="input-field" value={editForm.gender||'male'} onChange={e => setEditForm({...editForm, gender:e.target.value})}>
                    <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                    <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color:'var(--text-secondary)', display:'block', marginBottom: 4, fontWeight: 500 }}>
                    <Building2 size={14} style={{ marginInlineEnd: 4 }} />
                    {tr.branch}
                  </label>
                  <select className="input-field" value={editForm.salon_id||''} onChange={e => setEditForm({...editForm, salon_id:e.target.value, department_id:''})}>
                    <option value="">{isAr ? 'اختر الفرع' : 'Select branch'}</option>
                    {branches.map((b: any) => (
                      <option key={b.id} value={b.id}>{isAr ? b.name : (b.name_en || b.name)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color:'var(--text-secondary)', display:'block', marginBottom: 4, fontWeight: 500 }}>
                    <Layers size={14} style={{ marginInlineEnd: 4 }} />
                    {isAr ? 'القسم' : 'Department'}
                  </label>
                  <select className="input-field" value={editForm.department_id||''} onChange={e => setEditForm({...editForm, department_id:e.target.value})} disabled={!editForm.salon_id}>
                    <option value="">{isAr ? 'اختر القسم' : 'Select department'}</option>
                    {departments.filter((d: any) => d.salon_id === editForm.salon_id && d.is_active).map((d: any) => (
                      <option key={d.id} value={d.id}>{isAr ? d.name_ar : (d.name_en || d.name_ar)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color:'var(--text-secondary)', display:'block', marginBottom: 4, fontWeight: 500 }}>
                    <KeyRound size={12} style={{ marginInlineEnd: 4 }} />
                    {isAr ? 'كلمة المرور' : 'Password'}
                  </label>
                  <input className="input-field" type="password" value={editForm.password||''} onChange={e => setEditForm({...editForm, password:e.target.value})}
                    placeholder={isAr ? 'اتركه فارغاً لعدم التغيير' : 'Leave blank to keep unchanged'} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, color:'var(--text-secondary)', display:'block', marginBottom: 4, fontWeight: 500 }}>{isAr ? 'نبذة' : 'Bio'}</label>
                  <input className="input-field" value={editForm.bio||''} onChange={e => setEditForm({...editForm, bio:e.target.value})} />
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 22, paddingTop: 18, borderTop:'1px solid var(--border)' }}>
                <button onClick={() => deleteItem(editingId)} style={{
                  display:'flex', alignItems:'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)',
                  background: 'rgba(239,68,68,0.06)', color: '#EF4444',
                  cursor:'pointer', fontSize: 13, fontWeight: 500, fontFamily:'inherit',
                  transition: 'all 0.15s',
                }}>
                  <Trash2 size={15} />
                  {isAr ? 'حذف' : 'Delete'}
                </button>
                <div style={{ display:'flex', gap: 10 }}>
                  <button className="btn btn-ghost" onClick={() => setEditingId(null)}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
<button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>
                  <Check size={16} />
                  {saving ? (isAr ? 'حفظ...' : 'Saving...') : (isAr ? 'حفظ' : 'Save')}
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}