'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/app/layout'
import { Save, ArrowLeft, User, Phone, Mail, KeyRound, Scissors, Users, Info, Building2, Layers, ShieldCheck, Briefcase } from 'lucide-react'
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
    if (!form.name || !form.phone || !form.password || !form.salon_id) {
      setError(isAr ? 'الاسم ورقم الجوال وكلمة المرور والفرع إجبارية' : 'Name, phone, password & branch are required')
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

  const label = (icon: React.ReactNode, text: string, required?: boolean) => (
    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
      {icon}
      {text} {required && <span style={{ color: '#EF4444' }}>*</span>}
    </label>
  )

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

        {/* Personal Info */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <User size={16} />{isAr ? 'البيانات الشخصية' : 'Personal Info'}
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                {label(<User size={14} style={{ marginInlineEnd: 4 }} />, isAr ? 'الاسم' : 'Name', true)}
                <input className="input-field" type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder={isAr ? 'أدخل الاسم' : 'Enter name'} />
              </div>
              <div>
                {label(<Phone size={14} style={{ marginInlineEnd: 4 }} />, isAr ? 'رقم الجوال' : 'Phone', true)}
                <input className="input-field" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="05xxxxxxxx" />
              </div>
              <div>
                {label(<Mail size={14} style={{ marginInlineEnd: 4 }} />, isAr ? 'البريد الإلكتروني' : 'Email')}
                <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="example@email.com" />
              </div>
              <div>
                {label(<Users size={14} style={{ marginInlineEnd: 4 }} />, isAr ? 'الجنس' : 'Gender')}
                <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                  <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Account & Security */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <ShieldCheck size={16} />{isAr ? 'حساب الدخول' : 'Login Account'}
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                {label(<KeyRound size={14} style={{ marginInlineEnd: 4 }} />, isAr ? 'كلمة المرور' : 'Password', true)}
                <input className="input-field" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={isAr ? 'كلمة المرور' : 'Password'} />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                  {isAr ? 'يستخدمها الموظف لتسجيل الدخول إلى بوابة الموظفين برقم جواله.' : 'The employee uses this with their phone number to log in to the staff portal.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Work Assignment */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <Briefcase size={16} />{isAr ? 'بيانات العمل' : 'Work Assignment'}
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                {label(<Building2 size={14} style={{ marginInlineEnd: 4 }} />, isAr ? 'الفرع' : 'Branch', true)}
                <select className="input-field" value={form.salon_id} onChange={e => { set('salon_id', e.target.value); set('department_id', '') }}>
                  <option value="">{isAr ? 'اختر الفرع' : 'Select branch'}</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{isAr ? b.name : (b.name_en || b.name)}</option>
                  ))}
                </select>
              </div>
              <div>
                {label(<Layers size={14} style={{ marginInlineEnd: 4 }} />, isAr ? 'القسم' : 'Department')}
                <select className="input-field" value={form.department_id} onChange={e => set('department_id', e.target.value)} disabled={!form.salon_id}>
                  <option value="">{isAr ? 'اختر القسم' : 'Select department'}</option>
                  {departments.filter((d: any) => d.is_active).map((d: any) => (
                    <option key={d.id} value={d.id}>{isAr ? d.name_ar : (d.name_en || d.name_ar)}</option>
                  ))}
                </select>
              </div>
              <div>
                {label(<Scissors size={14} style={{ marginInlineEnd: 4 }} />, isAr ? 'التخصص' : 'Specialty')}
                <input className="input-field" type="text" value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder={isAr ? 'مثال: حلاق - أخصائي تجميل' : 'e.g. Barber, Beautician'} />
              </div>
              <div>
                {label(<Users size={14} style={{ marginInlineEnd: 4 }} />, isAr ? 'يخدم' : 'Serves')}
                <select className="input-field" value={form.gender_served} onChange={e => set('gender_served', e.target.value)}>
                  <option value="both">{isAr ? 'الكل' : 'Both'}</option>
                  <option value="ladies">{isAr ? 'نساء' : 'Ladies'}</option>
                  <option value="gents">{isAr ? 'رجال' : 'Gents'}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <Info size={16} />{isAr ? 'نبذة تعريفية' : 'Bio'}
            </h2>
          </div>
          <div className="card-body">
            <textarea className="input-field" value={form.bio} onChange={e => set('bio', e.target.value)}
              rows={6} placeholder={isAr ? 'نبذة قصيرة عن الموظف' : 'Short bio about the employee'}
              style={{ resize: 'vertical', fontFamily: 'inherit', width: '100%' }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Link href="/staff" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
          {isAr ? 'إلغاء' : 'Cancel'}
        </Link>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          <Save size={16} />
          {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ البيانات' : 'Save')}
        </button>
      </div>
    </div>
  )
}
