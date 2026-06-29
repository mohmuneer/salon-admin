'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import { Save, ArrowLeft, User, Phone, Mail, Lock, Scissors, Users, Info, Building2, Layers } from 'lucide-react'
import Link from 'next/link'

export default function AddStaffPage() {
  const { lang } = useLang()
  const router = useRouter()
  const isAr = lang === 'ar'

  const [branches, setBranches] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', gender: 'male',
    specialty: '', gender_served: 'both', bio: '', salon_id: '', department_id: '',
  })

  useEffect(() => { fetch('/api/branches').then(r => { if (!r.ok) return []; return r.json() }).then(setBranches).catch(() => setBranches([])) }, [])
  useEffect(() => {
    if (form.salon_id) {
      fetch('/api/departments').then(r => { if (!r.ok) return []; return r.json() }).then(all => {
        if (Array.isArray(all)) setDepartments(all.filter((d: any) => d.salon_id === form.salon_id))
      }).catch(() => setDepartments([]))
    } else {
      setDepartments([])
    }
  }, [form.salon_id])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const save = async () => {
    if (!form.name || !form.phone || !form.password) {
      setError(isAr ? 'الاسم ورقم الجوال وكلمة المرور إجبارية' : 'Name, phone & password are required')
      return
    }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const txt = await res.text(); throw new Error(txt) }
      router.push('/staff')
    } catch (err: any) {
      setError(err.message || (isAr ? 'فشل الحفظ' : 'Save failed'))
    }
    setSaving(false)
  }

  return (
    <div className="anim-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/staff" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
              {isAr ? 'إضافة موظف جديد' : 'Add Employee'}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {isAr ? 'أدخل بيانات الموظف الجديد' : 'Enter the new employee details'}
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          <Save size={16} />
          {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ' : 'Save')}
        </button>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-body" style={{ padding: 28 }}>
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 20,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
              color: '#DC2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Info size={16} />
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* Name */}
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                <User size={14} style={{ marginInlineEnd: 4 }} />
                {isAr ? 'الاسم' : 'Name'} <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input className="input-field" type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder={isAr ? 'أدخل الاسم' : 'Enter name'} />
            </div>

            {/* Phone */}
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                <Phone size={14} style={{ marginInlineEnd: 4 }} />
                {isAr ? 'رقم الجوال' : 'Phone'} <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input className="input-field" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder={isAr ? '05xxxxxxxx' : '05xxxxxxxx'} />
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                <Mail size={14} style={{ marginInlineEnd: 4 }} />
                {isAr ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder={isAr ? 'example@email.com' : 'example@email.com'} />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                <Lock size={14} style={{ marginInlineEnd: 4 }} />
                {isAr ? 'كلمة المرور' : 'Password'} <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input className="input-field" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={isAr ? 'كلمة المرور' : 'Password'} />
            </div>

            {/* Gender */}
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                <Users size={14} style={{ marginInlineEnd: 4 }} />
                {isAr ? 'الجنس' : 'Gender'}
              </label>
              <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
              </select>
            </div>

            {/* Branch */}
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                <Building2 size={14} style={{ marginInlineEnd: 4 }} />
                {isAr ? 'الفرع' : 'Branch'} <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select className="input-field" value={form.salon_id} onChange={e => { set('salon_id', e.target.value); set('department_id', '') }}>
                <option value="">{isAr ? 'اختر الفرع' : 'Select branch'}</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{isAr ? b.name : (b.name_en || b.name)}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                <Layers size={14} style={{ marginInlineEnd: 4 }} />
                {isAr ? 'القسم' : 'Department'}
              </label>
              <select className="input-field" value={form.department_id} onChange={e => set('department_id', e.target.value)} disabled={!form.salon_id}>
                <option value="">{isAr ? 'اختر القسم' : 'Select department'}</option>
                {departments.filter((d: any) => d.is_active).map((d: any) => (
                  <option key={d.id} value={d.id}>{isAr ? d.name_ar : (d.name_en || d.name_ar)}</option>
                ))}
              </select>
            </div>

            {/* Specialty */}
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                <Scissors size={14} style={{ marginInlineEnd: 4 }} />
                {isAr ? 'التخصص' : 'Specialty'}
              </label>
              <input className="input-field" type="text" value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder={isAr ? 'مثال: حلاق - أخصائي تجميل' : 'e.g. Barber, Beautician'} />
            </div>

            {/* Gender Served */}
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                <Users size={14} style={{ marginInlineEnd: 4 }} />
                {isAr ? 'يخدم' : 'Serves'}
              </label>
              <select className="input-field" value={form.gender_served} onChange={e => set('gender_served', e.target.value)}>
                <option value="both">{isAr ? 'الكل' : 'Both'}</option>
                <option value="ladies">{isAr ? 'نساء' : 'Ladies'}</option>
                <option value="gents">{isAr ? 'رجال' : 'Gents'}</option>
              </select>
            </div>

            {/* Bio */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                <Info size={14} style={{ marginInlineEnd: 4 }} />
                {isAr ? 'نبذة تعريفية' : 'Bio'}
              </label>
              <textarea className="input-field" value={form.bio} onChange={e => set('bio', e.target.value)}
                rows={3} placeholder={isAr ? 'نبذة قصيرة عن الموظف' : 'Short bio about the employee'}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Link href="/staff" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Link>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              <Save size={16} />
              {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ البيانات' : 'Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}