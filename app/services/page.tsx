'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import PriceInput from '@/components/PriceInput'
import MediaGallery from '@/components/MediaGallery'
import { Clock, Tag, Pencil, Trash2, X, Check, Building2, Layers, DollarSign, Image, Search, Filter } from 'lucide-react'
import AddButton from '@/app/components/AddButton'

export default function ServicesPage() {
  const { lang } = useLang()
  const tr = t[lang]
  const isAr = lang === 'ar'
  const [services, setServices] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])
  const [defaultCurrency, setDefaultCurrency] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ salon_id:'', department_id:'', name_ar:'', name_en:'', duration_min:60, price:0, gender_target:'both', currency_id:'', display_on_public:true, is_featured:false })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [serviceGallery, setServiceGallery] = useState<any[]>([])
  const [editingServiceGallery, setEditingServiceGallery] = useState<any[]>([])
  const [showServiceGallery, setShowServiceGallery] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{id:string,name:string} | null>(null)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/branches').then(r => { if (!r.ok) return []; return r.json() }),
      fetch('/api/departments').then(r => { if (!r.ok) return []; return r.json() }),
      fetch('/api/currencies').then(r => { if (!r.ok) return []; return r.json() }),
    ]).then(([branches, depts, currs]) => {
      setBranches(Array.isArray(branches) ? branches : [])
      setDepartments(Array.isArray(depts) ? depts : [])
      setCurrencies(Array.isArray(currs) ? currs : [])
      const curArr = Array.isArray(currs) ? currs : []
      const def = curArr.find((c: any) => c.is_default)
      if (def) {
        setDefaultCurrency(def)
        setForm(f => ({ ...f, currency_id: def.id }))
      }
    }).catch(() => {})
  }, [])

  const getCurrency = (currencyId: string) => currencies.find(c => c.id === currencyId) || defaultCurrency || { symbol: 'ر.س', code: 'SAR' }

  const load = () => {
    setLoading(true)
    fetch('/api/services').then(r => r.json()).then(d => { setServices(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const addService = async () => {
    const res = await fetch('/api/services', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    if (serviceGallery.length > 0) {
      const data = await fetch('/api/services').then(r => r.json())
      const lastId = Array.isArray(data) ? data[data.length - 1]?.id : null
      if (lastId) {
        await fetch('/api/service-images', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ service_id: lastId, images: serviceGallery }) })
      }
    }
    setShowAdd(false)
    setServiceGallery([])
    setForm({ salon_id:'', department_id:'', name_ar:'', name_en:'', duration_min:60, price:0, gender_target:'both', currency_id: defaultCurrency?.id || '', display_on_public:true, is_featured:false })
    load()
  }

  const saveEdit = async () => {
    await fetch('/api/services', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(editForm) })
    if (editingServiceGallery.length > 0 && editForm.id) {
      await fetch('/api/service-images', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ service_id: editForm.id, images: editingServiceGallery }) })
    }
    setEditingId(null)
    setEditingServiceGallery([])
    load()
  }

  const openDeleteModal = (id: string, name: string) => {
    setDeleteTarget({ id, name })
    setShowDeleteModal(true)
  }

  const deleteItem = async () => {
    if (!deleteTarget) return
    await fetch('/api/services', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: deleteTarget.id }) })
    setShowDeleteModal(false)
    setDeleteTarget(null)
    load()
  }

  const loadServiceImages = async (serviceId: string, setter: (imgs: any[]) => void) => {
    try {
      const res = await fetch(`/api/service-images?service_id=${serviceId}`)
      const data = await res.json()
      setter(Array.isArray(data) ? data : [])
    } catch { setter([]) }
  }

  const startEdit = (s: any) => {
    setEditingId(s.id)
    setEditForm({
      id: s.id,
      salon_id: s.salon_id || '',
      department_id: s.department_id || '',
      name_ar: s.name_ar,
      name_en: s.name_en,
      duration_min: s.duration_min,
      price: s.price,
      gender_target: s.gender_target,
      is_active: s.is_active,
      currency_id: s.currency_id || (defaultCurrency?.id || ''),
      display_on_public: s.display_on_public !== false,
      is_featured: s.is_featured === true,
    })
    loadServiceImages(s.id, setEditingServiceGallery)
  }

  const genderLabel = (g: string) => {
    if (g === 'ladies') return lang==='ar'?'نساء':'Ladies'
    if (g === 'gents') return lang==='ar'?'رجال':'Gents'
    return lang==='ar'?'الكل':'Both'
  }

  const filtered = services.filter((s: any) => {
    if (deptFilter && s.department_id !== deptFilter) return false
    if (genderFilter && s.gender_target !== genderFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.name_ar.toLowerCase().includes(q) && !(s.name_en || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:700, color:'var(--text)' }}>{tr.services}</h1>
        <AddButton onClick={() => setShowAdd(!showAdd)} label={tr.add} tooltip={lang==='ar'?'إضافة خدمة جديدة':'Add new service'} />
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:180 }}>
            <Search size={15} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', insetInlineStart:12, color:'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingInlineStart:36 }}
              placeholder={lang==='ar'?'بحث...':'Search...'} value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field" style={{ width:160 }} value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}>
            <option value="">{lang==='ar'?'كل الأقسام':'All Departments'}</option>
            {departments.filter((d:any) => d.is_active).map((d:any) => (
              <option key={d.id} value={d.id}>{lang==='ar'?d.name_ar:(d.name_en||d.name_ar)}</option>
            ))}
          </select>
          <select className="input-field" style={{ width:130 }} value={genderFilter}
            onChange={e => setGenderFilter(e.target.value)}>
            <option value="">{lang==='ar'?'كل الجنسين':'All Genders'}</option>
            <option value="ladies">{lang==='ar'?'نساء':'Ladies'}</option>
            <option value="gents">{lang==='ar'?'رجال':'Gents'}</option>
            <option value="both">{lang==='ar'?'الكل':'Both'}</option>
          </select>
          {(search || deptFilter || genderFilter) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setDeptFilter(''); setGenderFilter('') }}>
              <X size={14} /> {lang==='ar'?'مسح':'Clear'}
            </button>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-header"><h2 style={{ fontSize:15, fontWeight:600 }}>{isAr?'إضافة خدمة جديدة':'Add New Service'}</h2></div>
          <div className="card-body">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}><Building2 size={14} style={{ verticalAlign:'middle', marginInlineEnd:4 }} />{tr.branch}</label>
                <select className="input-field" value={form.salon_id} onChange={e => setForm({ ...form, salon_id:e.target.value, department_id:'' })}>
                  <option value="">{isAr?'اختر الفرع':'Select branch'}</option>
                  {branches.map((b:any) => (
                    <option key={b.id} value={b.id}>{isAr?b.name:(b.name_en||b.name)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}><Layers size={14} style={{ verticalAlign:'middle', marginInlineEnd:4 }} />{isAr?'القسم':'Department'}</label>
                <select className="input-field" value={form.department_id} onChange={e => setForm({ ...form, department_id:e.target.value })} disabled={!form.salon_id}>
                  <option value="">{isAr?'اختر القسم':'Select department'}</option>
                  {departments.filter((d:any) => d.salon_id === form.salon_id && d.is_active).map((d:any) => (
                    <option key={d.id} value={d.id}>{isAr?d.name_ar:(d.name_en||d.name_ar)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{isAr?'اسم الخدمة (عربي)':'Service Name (Arabic)'}</label>
                <input className="input-field" type="text" value={form.name_ar}
                  onChange={e => setForm({ ...form, name_ar: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{isAr?'اسم الخدمة (إنجليزي)':'Service Name (English)'}</label>
                <input className="input-field" type="text" value={form.name_en}
                  onChange={e => setForm({ ...form, name_en: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{`${tr.duration} (${tr.minutes})`}</label>
                <input className="input-field" type="number" min={1} value={form.duration_min}
                  onChange={e => setForm({ ...form, duration_min: Number(e.target.value) })} />
              </div>
              <PriceInput
                label={`${tr.price}`}
                value={form.price}
                onChange={v => setForm({ ...form, price: v })}
                currencySymbol={getCurrency(form.currency_id)?.symbol}
                required
              />
              <div>
                <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}><DollarSign size={14} style={{ verticalAlign:'middle', marginInlineEnd:4 }} />{isAr?'العملة':'Currency'}</label>
                <select className="input-field" value={form.currency_id}
                  onChange={e => setForm({ ...form, currency_id: e.target.value })}>
                  {currencies.filter((c:any) => c.is_active).map((c:any) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
               <div>
                 <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{tr.gender}</label>
                 <select className="input-field" value={form.gender_target} onChange={e => setForm({ ...form, gender_target: e.target.value })}>
                   <option value="both">{isAr?'الكل':'Both'}</option>
                   <option value="ladies">{isAr?'نساء':'Ladies'}</option>
                   <option value="gents">{isAr?'رجال':'Gents'}</option>
                 </select>
               </div>
             </div>
             <div style={{ display:'flex', gap:20, marginTop:10 }}>
               <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                 <input type="checkbox" checked={form.display_on_public !== false}
                   onChange={e => setForm({ ...form, display_on_public: e.target.checked })} />
                 {isAr?'عرض في الموقع العام':'Display on Public Website'}
               </label>
               <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                 <input type="checkbox" checked={form.is_featured === true}
                   onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
                 {isAr?'خدمة مميزة':'Featured Service'} ⭐
               </label>
             </div>
             <div style={{ marginTop:16 }}>
              <MediaGallery
                images={serviceGallery}
                onChange={setServiceGallery}
                lang={lang}
                label={isAr?'صور الخدمة (غلاف، قبل وبعد، معرض)':'Service Images (Cover, Before/After, Gallery)'}
                description={isAr?'ارفع صور الخدمة - غلاف، صور قبل وبعد، وصور المعرض':'Upload service images - cover, before/after, and gallery images'}
                showPrimary
                showType
                imageTypes={[
                  { value:'cover', label:'Cover', labelAr:'غلاف' },
                  { value:'before', label:'Before', labelAr:'قبل' },
                  { value:'after', label:'After', labelAr:'بعد' },
                  { value:'gallery', label:'Gallery', labelAr:'معرض' },
                ]}
                maxFiles={15}
              />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button className="btn btn-primary" onClick={addService}>{tr.save}</button>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>{tr.cancel}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
        {loading ? (
          <div style={{ color:'var(--text-muted)', gridColumn:'1/-1', textAlign:'center', padding:40 }}>{tr.loading}</div>
        ) : filtered.length === 0 ? (
          <div style={{ color:'var(--text-muted)', gridColumn:'1/-1', textAlign:'center', padding:40, fontSize:14 }}>
            {lang === 'ar' ? 'لا توجد خدمات متاحة' : 'No services available'}
          </div>
        ) : filtered.map((s: any) => {
          const cur = getCurrency(s.currency_id)
          return (
          <div key={s.id} className="card">
            <div style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', marginBottom:14 }}>
                <div>
                  {editingId === s.id ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:8, width:'100%' }}>
                      <input className="input-field" type="text" value={editForm.name_ar}
                        onChange={e => setEditForm((f: any) => ({ ...f, name_ar: e.target.value }))}
                        placeholder={lang==='ar'?'اسم الخدمة (عربي)':'Service Name (Arabic)'} />
                      <input className="input-field" type="text" value={editForm.name_en}
                        onChange={e => setEditForm((f: any) => ({ ...f, name_en: e.target.value }))}
                        placeholder={lang==='ar'?'اسم الخدمة (إنجليزي)':'Service Name (English)'} />
                    </div>
                  ) : (
                    <>
                      <div style={{ fontWeight:700, fontSize:15, color:'var(--text)', marginBottom:4 }}>{s.name_ar}</div>
                      {s.name_en && <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.name_en}</div>}
                    </>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button className="btn btn-icon" onClick={() => startEdit(s)} title={lang==='ar'?'تعديل':'Edit'}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-icon-danger" onClick={() => openDeleteModal(s.id, s.name_ar)} title={lang==='ar'?'حذف':'Delete'}>
                    <Trash2 size={14} />
                  </button>
                  <span style={{
                    padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:500,
                    background: s.is_active ? '#D1FAE5' : '#F3F4F6',
                    color: s.is_active ? '#065F46' : '#6B7280'
                  }}>{s.is_active ? tr.active : tr.inactive}</span>
                </div>
              </div>

              {editingId === s.id ? (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                    <div>
                      <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{isAr?'الفرع':'Branch'}</label>
                      <select className="input-field" value={editForm.salon_id||''}
                        onChange={e => setEditForm((f: any) => ({ ...f, salon_id: e.target.value, department_id: '' }))}>
                        <option value="">{isAr?'اختر الفرع':'Select branch'}</option>
                        {branches.map((b:any) => (
                          <option key={b.id} value={b.id}>{isAr?b.name:(b.name_en||b.name)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{isAr?'القسم':'Department'}</label>
                      <select className="input-field" value={editForm.department_id||''}
                        onChange={e => setEditForm((f: any) => ({ ...f, department_id: e.target.value }))}
                        disabled={!editForm.salon_id}>
                        <option value="">{isAr?'اختر القسم':'Select department'}</option>
                        {departments.filter((d:any) => d.salon_id === editForm.salon_id && d.is_active).map((d:any) => (
                          <option key={d.id} value={d.id}>{isAr?d.name_ar:(d.name_en||d.name_ar)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{tr.duration} ({tr.minutes})</label>
                      <input className="input-field" type="number" value={editForm.duration_min}
                        onChange={e => setEditForm((f: any) => ({ ...f, duration_min: Number(e.target.value) }))} />
                    </div>
                    <PriceInput
                      label={`${tr.price}`}
                      value={editForm.price}
                      onChange={v => setEditForm((f: any) => ({ ...f, price: v }))}
                      currencySymbol={getCurrency(editForm.currency_id)?.symbol}
                    />
                    <div>
                      <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{isAr?'العملة':'Currency'}</label>
                      <select className="input-field" value={editForm.currency_id||''}
                        onChange={e => setEditForm((f: any) => ({ ...f, currency_id: e.target.value }))}>
                        {currencies.filter((c:any) => c.is_active).map((c:any) => (
                          <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:13, color:'#6B7280', display:'block', marginBottom:6 }}>{tr.gender}</label>
                    <select className="input-field" value={editForm.gender_target}
                      onChange={e => setEditForm((f: any) => ({ ...f, gender_target: e.target.value }))}>
                      <option value="both">{isAr?'الكل':'Both'}</option>
                      <option value="ladies">{isAr?'نساء':'Ladies'}</option>
                      <option value="gents">{isAr?'رجال':'Gents'}</option>
                    </select>
                  </div>
                  <div style={{ display:'flex', gap:16, marginTop:10 }}>
                    <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13 }}>
                      <input type="checkbox" checked={editForm.display_on_public !== false}
                        onChange={e => setEditForm((f: any) => ({ ...f, display_on_public: e.target.checked }))} />
                      {isAr?'عرض بالموقع':'On Website'}
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13 }}>
                      <input type="checkbox" checked={editForm.is_featured === true}
                        onChange={e => setEditForm((f: any) => ({ ...f, is_featured: e.target.checked }))} />
                      {isAr?'مميزة':'Featured'} ⭐
                    </label>
                  </div>
                  <div style={{ marginTop:14 }}>
                    <MediaGallery
                      images={editingServiceGallery}
                      onChange={setEditingServiceGallery}
                      lang={lang}
                      label={isAr?'صور الخدمة (غلاف، قبل وبعد، معرض)':'Service Images (Cover, Before/After, Gallery)'}
                      description={isAr?'ارفع صور الخدمة - غلاف، صور قبل وبعد، وصور المعرض':'Upload service images - cover, before/after, and gallery images'}
                      showPrimary
                      showType
                      imageTypes={[
                        { value:'cover', label:'Cover', labelAr:'غلاف' },
                        { value:'before', label:'Before', labelAr:'قبل' },
                        { value:'after', label:'After', labelAr:'بعد' },
                        { value:'gallery', label:'Gallery', labelAr:'معرض' },
                      ]}
                      maxFiles={15}
                    />
                  </div>
                  <div style={{ display:'flex', gap:10, paddingTop:12, borderTop:'1px solid #F1EDE4' }}>
                    <button className="btn btn-primary btn-sm" onClick={saveEdit}>
                      <Check size={14} /> {tr.save}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>
                      <X size={14} /> {tr.cancel}
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ marginLeft:'auto' }} onClick={() => openDeleteModal(s.id, s.name_ar)}>
                      <Trash2 size={14} /> {lang==='ar'?'حذف':'Delete'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {s.image_url ? (
                    <div style={{ marginBottom:14, borderRadius:10, overflow:'hidden', maxHeight:160 }}>
                      <img src={s.image_url} alt="" style={{ width:'100%', height:140, objectFit:'cover', borderRadius:10 }} />
                      {s.service_images_count > 1 && (
                        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#6B7280', marginTop:6 }}>
                          <Image size={12} /> {s.service_images_count} {isAr?'صورة':'images'}
                        </div>
                      )}
                    </div>
                  ) : null}
                  <div style={{ display:'flex', gap:16, marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4, color:'#6B7280', fontSize:13 }}>
                      <Clock size={14} color="var(--gold)" />
                      {s.duration_min} {tr.minutes}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:4, color:'#6B7280', fontSize:13 }}>
                      <Tag size={14} color="var(--gold)" />
                      {genderLabel(s.gender_target)}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:12, marginBottom:14, fontSize:12, color:'var(--text-muted)' }}>
                    <span><Building2 size={12} style={{ verticalAlign:'middle', marginInlineEnd:4 }} />{isAr?s.branch_name:(s.branch_name_en||s.branch_name||'—')}</span>
                    <span><Layers size={12} style={{ verticalAlign:'middle', marginInlineEnd:4 }} />{isAr?s.department_name:(s.department_name_en||s.department_name||'—')}</span>
                    <span><DollarSign size={12} style={{ verticalAlign:'middle', marginInlineEnd:4 }} />{cur.code}</span>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:12, borderTop:'1px solid #F1EDE4' }}>
                    <span style={{ fontSize:20, fontWeight:800, color:'var(--gold)' }}>{Number(s.price).toLocaleString()} {cur.symbol}</span>
                    <span style={{ fontSize:12, color:'#6B7280' }}>{s.total_bookings} {lang==='ar'?'حجز':'bookings'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )})}
      </div>

      {showDeleteModal && deleteTarget && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:100,
          display:'flex', alignItems:'center', justifyContent:'center', padding:20,
          backdropFilter:'blur(4px)',
        }} onClick={() => { setShowDeleteModal(false); setDeleteTarget(null) }}>
          <div className="card" style={{
            maxWidth:420, width:'100%',
            boxShadow:'0 25px 60px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h2 style={{ fontSize:15, fontWeight:600 }}>
                {lang==='ar'?'تأكيد الحذف':'Confirm Delete'}
              </h2>
            </div>
            <div className="card-body" style={{ textAlign:'center', padding:32 }}>
              <div style={{
                width:56, height:56, borderRadius:'50%',
                background:'var(--danger-bg)', display:'flex',
                alignItems:'center', justifyContent:'center',
                margin:'0 auto 16px',
              }}>
                <Trash2 size={24} color="#EF4444" />
              </div>
              <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:4 }}>
                {lang==='ar'?'هل أنت متأكد من حذف':'Are you sure you want to delete'}
              </p>
              <p style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:20 }}>
                {deleteTarget.name}
              </p>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button className="btn btn-ghost" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null) }}>
                  {lang==='ar'?'إلغاء':'Cancel'}
                </button>
                <button className="btn btn-danger" onClick={deleteItem}>
                  <Trash2 size={14} /> {lang==='ar'?'حذف':'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
