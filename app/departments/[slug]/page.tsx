'use client'
import { useEffect, useState, useCallback, useReducer } from 'react'
import { useParams } from 'next/navigation'
import { X, ShoppingCart, Plus, Minus, Trash2, Clock, Phone, User, LogIn, LogOut, ChevronRight, ChevronLeft } from 'lucide-react'

const C: Record<string,string> = {
  navy: '#0a1628', navyLight: '#0f1f38', navyCard: '#13203a',
  blue: '#2f7bff', gold: '#d4a437', goldLight: '#e8c25e', goldGlow: '#d4a43744',
  text: '#eaf1ff', textMuted: '#9fb2d4', textDim: '#6a7d9e',
  border: 'rgba(255,255,255,0.06)', success: '#22c55e', error: '#ef4444',
}

function rgbToHex(c: string): string {
  const m = c.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
  if (m) return '#' + [m[1],m[2],m[3]].map(v => parseInt(v).toString(16).padStart(2,'0')).join('')
  return c
}

function useThemeWatcher() {
  const [, force] = useReducer(x => x + 1, 0)
  useEffect(() => {
    function apply(pc: string) {
      const primary = pc || '#C9A55F'
      C.gold = primary
      C.goldLight = '#' + [0,1,2].map(i => Math.min(255, parseInt(primary.slice(1+i*2,3+i*2),16)+40).toString(16).padStart(2,'0')).join('')
      C.goldGlow = primary.length === 7 ? primary + '44' : 'rgba(212,164,55,0.267)'
      C.success = '#22c55e'
      C.error = '#ef4444'
      C.blue = '#2f7bff'
      force()
    }
    function fetchTheme() {
      try {
        const raw = localStorage.getItem('public_theme_preview')
        if (raw) {
          const d = JSON.parse(raw)
          if (d?.primary_color && d.primary_color !== C.gold) { apply(d.primary_color); return }
        }
      } catch {}
      fetch('/api/public-theme?t=' + Date.now()).then(r => r.json()).then(d => {
        if (d.primary_color && d.primary_color !== C.gold) apply(d.primary_color)
      }).catch(() => {})
    }
    fetchTheme()
    const id = setInterval(fetchTheme, 2000)
    return () => clearInterval(id)
  }, [])
}
const ICONS = ['💇‍♀️','🎨','💅','💄','🧴','💆‍♀️','✨','🌸']
const PI    = ['🧴','💧','🌿','✨','💎','💅','🧪','🌸']

function genSlots() {
  const s: string[] = []
  for (let h = 9; h <= 20; h++) {
    s.push(`${h.toString().padStart(2,'0')}:00`)
    if (h < 20) s.push(`${h.toString().padStart(2,'0')}:30`)
  }
  return s
}

interface ImgItem  { url: string; thumbnail?: string; type?: string }
interface DeptInfo { id:string; name_ar:string; description?:string; icon?:string; image_url?:string }
interface Service  { id:string; name_ar:string; description?:string; duration_min:number; price:number; image_url?:string; is_featured?:boolean; category_name?:string; images?:ImgItem[] }
interface Product  { id:string; name_ar:string; brand?:string; price:number; stock_qty?:number; image_url?:string; is_featured?:boolean; images?:ImgItem[] }
interface CItem    { product:Product; qty:number }

/* ── Helpers ── */
function Toast({ msg, type, onClose }: { msg:string; type:'success'|'error'; onClose:()=>void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return <div style={{ position:'fixed', bottom:30, right:30, zIndex:9999, padding:'14px 24px', borderRadius:14,
    background:type==='success'?C.success:C.error, color:'#fff', fontSize:14, fontWeight:600,
    boxShadow:`0 8px 32px ${type==='success'?C.success:C.error}44`, display:'flex', alignItems:'center', gap:10 }}>
    {type==='success'?'✓':'✕'} {msg}
  </div>
}

function Modal({ children, onClose, title }: { children:React.ReactNode; onClose:()=>void; title?:string }) {
  useEffect(() => { document.body.style.overflow='hidden'; return ()=>{ document.body.style.overflow='' } }, [])
  return <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)' }} />
    <div onClick={e=>e.stopPropagation()} style={{ position:'relative', width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto',
      background:C.navyCard, borderRadius:24, border:`1px solid ${C.border}`, padding:28, animation:'mi .3s ease' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        {title && <h2 style={{ color:'#fff', fontSize:19, fontWeight:700, margin:0 }}>{title}</h2>}
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.07)', border:'none', color:C.textMuted, cursor:'pointer', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', marginRight:'auto' }}><X size={17}/></button>
      </div>
      {children}
    </div>
  </div>
}

function Field({ label, value, onChange, type='text', placeholder, rows }:
  { label?:string; value:string; onChange:(v:string)=>void; type?:string; placeholder?:string; rows?:number }) {
  const base: React.CSSProperties = { width:'100%', padding:'11px 14px', borderRadius:11, border:`1px solid ${C.border}`,
    background:C.navy, color:C.text, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border .2s' }
  return <div style={{ marginBottom:13 }}>
    {label && <label style={{ display:'block', color:C.textMuted, fontSize:13, marginBottom:5, fontWeight:500 }}>{label}</label>}
    {rows
      ? <textarea style={{ ...base, minHeight:80, resize:'vertical' }} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} />
      : <input style={base} value={value} onChange={e=>onChange(e.target.value)} type={type} placeholder={placeholder}
          onFocus={e=>e.currentTarget.style.borderColor=`${C.gold}55`}
          onBlur={e=>e.currentTarget.style.borderColor=C.border} />}
  </div>
}

function Btn({ children, onClick, variant='primary', fullWidth, disabled, style }:
  { children:React.ReactNode; onClick?:()=>void; variant?:'primary'|'ghost'; fullWidth?:boolean; disabled?:boolean; style?:React.CSSProperties }) {
  return <button onClick={onClick} disabled={disabled}
    style={{ padding:'12px 28px', borderRadius:12, border:'none',
      background:variant==='primary'?`linear-gradient(135deg,${C.gold},${C.goldLight})`:'rgba(255,255,255,0.07)',
      color:variant==='primary'?C.navy:C.textMuted, fontWeight:600, fontSize:14,
      cursor:disabled?'not-allowed':'pointer', opacity:disabled?.5:1, width:fullWidth?'100%':undefined,
      transition:'all .25s', display:'inline-flex', alignItems:'center', gap:8, justifyContent:'center', ...style }}
    onMouseEnter={e=>{ if(!disabled){ e.currentTarget.style.filter='brightness(1.1)'; e.currentTarget.style.transform='translateY(-2px)' }}}
    onMouseLeave={e=>{ if(!disabled){ e.currentTarget.style.filter='none'; e.currentTarget.style.transform='translateY(0)' }}}>
    {children}
  </button>
}

/* ── Image Gallery Card component ── */
function ImageGallery({ images, alt, placeholder, type='service' }: { images: ImgItem[]; alt: string; placeholder: string; type?:string }) {
  const [idx, setIdx] = useState(0)
  const all = images.filter(i => i.url)
  if (all.length === 0) {
    const apiUrl = `/api/placeholder?name=${encodeURIComponent(alt)}&icon=${encodeURIComponent(placeholder)}&type=${type}`
    return <div style={{ height:200, overflow:'hidden' }}>
      <img src={apiUrl} alt={alt} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
    </div>
  }
  const current = all[idx]
  return (
    <div>
      {/* Main image */}
      <div style={{ position:'relative', height:200, overflow:'hidden', background:C.navy }}>
        <img src={current.url} alt={alt} loading="lazy"
          style={{ width:'100%', height:'100%', objectFit:'cover', transition:'opacity .3s' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 55%,rgba(10,22,40,.7))' }} />
        {/* Nav arrows */}
        {all.length > 1 && <>
          <button onClick={e=>{ e.stopPropagation(); setIdx(i=>(i-1+all.length)%all.length) }}
            style={{ position:'absolute', top:'50%', right:8, transform:'translateY(-50%)', width:28, height:28, borderRadius:'50%',
              background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', border:'none', color:'#fff', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChevronRight size={16}/>
          </button>
          <button onClick={e=>{ e.stopPropagation(); setIdx(i=>(i+1)%all.length) }}
            style={{ position:'absolute', top:'50%', left:8, transform:'translateY(-50%)', width:28, height:28, borderRadius:'50%',
              background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', border:'none', color:'#fff', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChevronLeft size={16}/>
          </button>
          {/* Dots */}
          <div style={{ position:'absolute', bottom:8, left:0, right:0, display:'flex', justifyContent:'center', gap:5 }}>
            {all.map((_,i)=>(
              <button key={i} onClick={e=>{ e.stopPropagation(); setIdx(i) }}
                style={{ width:i===idx?18:6, height:6, borderRadius:3, background:i===idx?C.gold:'rgba(255,255,255,0.5)', border:'none', cursor:'pointer', transition:'all .25s', padding:0 }} />
            ))}
          </div>
        </>}
        {/* Image type badge */}
        {current.type && current.type !== 'cover' && (
          <div style={{ position:'absolute', top:8, left:8, padding:'2px 8px', borderRadius:10,
            background:'rgba(10,22,40,0.8)', backdropFilter:'blur(6px)', color:C.gold, fontSize:10, fontWeight:600 }}>
            {current.type === 'before' ? 'قبل' : current.type === 'after' ? 'بعد' : 'معرض'}
          </div>
        )}
      </div>
      {/* Thumbnails strip */}
      {all.length > 1 && (
        <div style={{ display:'flex', gap:4, padding:'6px 6px 0', overflowX:'auto' }}>
          {all.map((img,i)=>(
            <button key={i} onClick={()=>setIdx(i)}
              style={{ flexShrink:0, width:44, height:44, borderRadius:7, overflow:'hidden', border:`2px solid ${i===idx?C.gold:'transparent'}`, padding:0, cursor:'pointer', transition:'border .2s' }}>
              <img src={img.thumbnail||img.url} alt="" loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════ */
export default function DeptPage() {
  useThemeWatcher()
  const { slug } = useParams() as { slug: string }

  const [dept,     setDept]    = useState<DeptInfo|null>(null)
  const [services, setServices]= useState<Service[]>([])
  const [products, setProducts]= useState<Product[]>([])
  const [salon,    setSalon]   = useState<any>({})
  const [loading,  setLoading] = useState(true)
  const [notFound, setNotFound]= useState(false)

  const [tab,       setTab]      = useState<'services'|'products'>('services')
  const [searchQ,   setSearchQ]  = useState('')
  const [sortBy,    setSortBy]   = useState<'featured'|'price_asc'|'price_desc'|'name'>('featured')
  const [minPrice,  setMinPrice] = useState('')
  const [maxPrice,  setMaxPrice] = useState('')
  const [onlyStock, setOnlyStock]= useState(false)

  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null)

  /* Auth (optional — enhances experience) */
  const [authUser,    setAuthUser]  = useState<any>(null)
  const [showLogin,   setShowLogin] = useState(false)
  const [showReg,     setShowReg]   = useState(false)
  const [lPhone, setLPhone] = useState(''); const [lPass, setLPass] = useState('')
  const [rName,  setRName]  = useState(''); const [rPhone, setRPhone] = useState(''); const [rPass, setRPass] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  /* Booking — multi-step, no auth required */
  const [bkSvc,        setBkSvc]        = useState<Service|null>(null)
  const [bkStep,       setBkStep]       = useState<'contact'|'branch'|'staff'|'datetime'|'products'>('contact')
  const [bkName,       setBkName]       = useState('')
  const [bkPhone,      setBkPhone]      = useState('')
  const [bkBranch,     setBkBranch]     = useState<any>(null)
  const [bkStaff,      setBkStaff]      = useState<any>(null)
  const [bkDate,       setBkDate]       = useState('')
  const [bkTime,       setBkTime]       = useState('')
  const [bkIncProducts,setBkIncProducts]= useState<string[]>([])
  const [bkBusy,       setBkBusy]       = useState(false)
  const [bkDone,       setBkDone]       = useState(false)
  const [bkId,         setBkId]         = useState('')
  // Step data
  const [branches,       setBranches]       = useState<any[]>([])
  const [staffList,      setStaffList]      = useState<any[]>([])
  const [bookedSlots,    setBookedSlots]    = useState<string[]>([])
  const [existingBk,     setExistingBk]     = useState<any>(null)
  const [loadingAvail,   setLoadingAvail]   = useState(false)
  const [loadingStaff,   setLoadingStaff]   = useState(false)

  /* My Activity (bookings + orders) */
  const [showActivity,   setShowActivity]   = useState(false)
  const [activityPhone,  setActivityPhone]  = useState('')
  const [activityTab,    setActivityTab]    = useState<'unpaid'|'paid'>('unpaid')
  const [myBookings,     setMyBookings]     = useState<any[]>([])
  const [myOrders,       setMyOrders]       = useState<any[]>([])
  const [loadingActivity,setLoadingActivity]= useState(false)
  const [bookedProductIds,setBookedProductIds]= useState<string[]>([])
  const [modifyingBk,    setModifyingBk]   = useState<any>(null)
  const [actPaidIds,     setActPaidIds]     = useState<Set<string>>(new Set())
  const [showActPay,     setShowActPay]     = useState(false)
  const [actPayMethod,   setActPayMethod]   = useState<'transfer'|'card'>('transfer')
  const [actReceiptFile, setActReceiptFile] = useState<File|null>(null)
  const [actReceiptPrev, setActReceiptPrev] = useState<string|null>(null)
  const [actReceiptErr,  setActReceiptErr]  = useState('')
  const [actPayBusy,     setActPayBusy]     = useState(false)
  const [actCardNum,     setActCardNum]     = useState('')
  const [actCardExp,     setActCardExp]     = useState('')
  const [actCardCvv,     setActCardCvv]     = useState('')
  const [actCardHolder,  setActCardHolder]  = useState('')
  const [actDetail,      setActDetail]      = useState<any>(null)
  const [actDetailType,  setActDetailType]  = useState<'booking'|'order'>('booking')
  const ACT_PAID_KEY = 'lamset-paid-activity-ids'
  const [confirmDlg2,    setConfirmDlg2]   = useState<{msg:string;sub?:string;label?:string;onOk:()=>void}|null>(null)
  const askConfirm2 = (msg:string, sub:string, onOk:()=>void, label='تأكيد') => setConfirmDlg2({msg,sub,label,onOk})

  /* Cart */
  const [cart,     setCart]    = useState<CItem[]>([])
  const [cartOpen, setCartOpen]= useState(false)
  const [cartTab,  setCartTab] = useState<'unpaid'|'paid'>('unpaid')
  const [coOpen,       setCoOpen]      = useState(false)
  const [coName,       setCoName]      = useState('')
  const [coPhone,      setCoPhone]     = useState('')
  const [coAddr,       setCoAddr]      = useState('')
  const [coPay,        setCoPay]       = useState<'cod'|'bank_transfer'>('bank_transfer')
  const [coBusy,       setCoBusy]      = useState(false)
  const [coDone,       setCoDone]      = useState(false)
  const [coId,         setCoId]        = useState('')
  const [deptBank,     setDeptBank]    = useState({ bank_name:'', account_holder:'', iban:'', account_number:'' })
  const [deptIbanShow, setDeptIbanShow]= useState(false)
  const [deptIbanCopy, setDeptIbanCopy]= useState(false)
  const [coDbBank,     setCoDbBank]    = useState('')
  const [coDbAcct,     setCoDbAcct]    = useState('')
  const [coDbOwner,    setCoDbOwner]   = useState('')
  const [payOrder,     setPayOrder]    = useState<any>(null) // activity panel payment

  /* Lightbox */
  const [lightbox, setLightbox] = useState<string|null>(null)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/public-departments/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        setDept(d.department); setServices(d.services||[]); setProducts(d.products||[]); setSalon(d.salon||{})
        document.title = d.department?.page_title_ar || d.department?.name_ar || 'القسم'
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))

    const saved = localStorage.getItem('lamset_cart')
    if (saved) try { setCart(JSON.parse(saved)) } catch {}
    // Fetch bank/payment settings
    fetch('/api/settings').then(r=>r.json()).then(d=>{ if(d) setDeptBank({bank_name:d.bank_name||'',account_holder:d.account_holder||'',iban:d.iban||'',account_number:d.account_number||''}) }).catch(()=>{})
    // Load booked product IDs (products linked to active session bookings)
    const bpIds = localStorage.getItem('lamset_booked_products')
    if (bpIds) try { setBookedProductIds(JSON.parse(bpIds)) } catch {}
    const token = localStorage.getItem('lamset_token')
    if (token)
      fetch('/api/public-auth/profile', { headers:{ Authorization:`Bearer ${token}` } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => { setAuthUser(d.user); setBkName(d.user.name||''); setBkPhone(d.user.phone||'') })
        .catch(() => localStorage.removeItem('lamset_token'))
  }, [slug])

  useEffect(() => { localStorage.setItem('lamset_cart', JSON.stringify(cart)) }, [cart])

  /* Auth */
  const doLogin = async () => {
    if (!lPhone||!lPass) { setToast({msg:'يرجى تعبئة جميع الحقول',type:'error'}); return }
    setAuthBusy(true)
    try {
      const r = await fetch('/api/public-auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:lPhone,password:lPass})})
      const d = await r.json()
      if (!r.ok) { setToast({msg:d.error||'خطأ',type:'error'}); setAuthBusy(false); return }
      localStorage.setItem('lamset_token', d.token)
      setAuthUser(d.user); setBkName(d.user.name||''); setBkPhone(d.user.phone||'')
      setShowLogin(false); setLPhone(''); setLPass('')
      setToast({msg:`مرحباً ${d.user.name} 👋`,type:'success'})
    } catch { setToast({msg:'خطأ في الاتصال',type:'error'}) }
    setAuthBusy(false)
  }

  const doRegister = async () => {
    if (!rName||!rPhone||!rPass) { setToast({msg:'يرجى تعبئة جميع الحقول',type:'error'}); return }
    if (rPass.length<6) { setToast({msg:'كلمة المرور 6 أحرف على الأقل',type:'error'}); return }
    setAuthBusy(true)
    try {
      const r = await fetch('/api/public-auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:rName,phone:rPhone,password:rPass})})
      const d = await r.json()
      if (!r.ok) { setToast({msg:d.error||'خطأ',type:'error'}); setAuthBusy(false); return }
      localStorage.setItem('lamset_token', d.token)
      setAuthUser(d.user); setBkName(d.user.name||''); setBkPhone(d.user.phone||'')
      setShowReg(false); setRName(''); setRPhone(''); setRPass('')
      setToast({msg:'تم إنشاء الحساب ✓',type:'success'})
    } catch { setToast({msg:'خطأ في الاتصال',type:'error'}) }
    setAuthBusy(false)
  }

  const doLogout = () => {
    localStorage.removeItem('lamset_token'); setAuthUser(null); setBkName(''); setBkPhone('')
    setToast({msg:'تم تسجيل الخروج',type:'success'})
  }

  /* ── Booking helpers — multi-step ── */
  const openBooking = (s: Service) => {
    setBkSvc(s); setBkStep('contact')
    setBkBranch(null); setBkStaff(null); setBkDate(''); setBkTime('')
    setBkDone(false); setExistingBk(null); setBookedSlots([]); setBkIncProducts([])
    if (authUser) { setBkName(authUser.name||''); setBkPhone(authUser.phone||'') }
    fetch('/api/public-branches').then(r=>r.json()).then(d=>setBranches(Array.isArray(d)?d:[])).catch(()=>{})
  }

  const handleContactNext = async () => {
    if (!bkName.trim()||!bkPhone.trim()) { setToast({msg:'يرجى إدخال الاسم ورقم الجوال',type:'error'}); return }
    const av = await fetch(`/api/public-availability?phone=${encodeURIComponent(bkPhone)}&service_id=${encodeURIComponent(String(bkSvc!.id))}`)
      .then(r=>r.json()).catch(()=>({customerHasBooking:null}))
    setExistingBk(av.customerHasBooking)
    if (branches.length <= 1) { setBkBranch(branches[0]||null); await loadStaff(branches[0]?.id||''); setBkStep('staff') }
    else setBkStep('branch')
  }

  const loadStaff = async (branchId: string) => {
    setLoadingStaff(true)
    const url = '/api/public-staff?' + (branchId ? 'branch_id=' + encodeURIComponent(branchId) : '') + (dept?.id ? '&department_id=' + encodeURIComponent(dept.id) : '')
    const d = await fetch(url).then(r=>r.json()).catch(()=>[])
    setStaffList(Array.isArray(d)?d:[])
    setLoadingStaff(false)
  }

  const checkAvailability = async (date: string) => {
    setBkDate(date); setBkTime(''); setBookedSlots([])
    if (!bkStaff?.id) return
    setLoadingAvail(true)
    const r = await fetch('/api/public-availability?staff_id=' + encodeURIComponent(bkStaff.id) + '&date=' + encodeURIComponent(date))
      .then(r=>r.json()).catch(()=>({bookedSlots:[]}))
    setBookedSlots(r.bookedSlots||[])
    setLoadingAvail(false)
  }

  const submitBooking = async () => {
    if (!bkDate||!bkTime) { setToast({msg:'يرجى اختيار التاريخ والوقت',type:'error'}); return }
    setBkBusy(true)
    try {
      const body: any = { serviceId:bkSvc!.id, customerName:bkName, customerPhone:bkPhone, date:bkDate, time:bkTime, price:bkSvc!.price }
      if (bkBranch?.id) body.branchId = bkBranch.id
      if (bkStaff?.id)  body.staffId  = bkStaff.id
      if (bkIncProducts.length) body.sessionProductIds = bkIncProducts
      const r = await fetch('/api/public-bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setBkId(d.id||''); setBkDone(true); setToast({msg:'تم الحجز بنجاح ✓',type:'success'})
      // Save booked product IDs to prevent cart removal
      if (bkIncProducts.length > 0) {
        const prev = JSON.parse(localStorage.getItem('lamset_booked_products')||'[]')
        const updated = [...new Set([...prev, ...bkIncProducts])]
        localStorage.setItem('lamset_booked_products', JSON.stringify(updated))
        setBookedProductIds(updated)
      }
      // Save phone for activity access
      if (bkPhone) localStorage.setItem('lamset_last_phone', bkPhone)
    } catch(e:any) { setToast({msg:e.message||'حدث خطأ في الحجز',type:'error'}) }
    setBkBusy(false)
  }

  /* ── My Activity: load bookings + orders ── */
  const loadActivity = async (phone: string) => {
    if (!phone) return
    setLoadingActivity(true)
    // Load paid IDs from localStorage
    try {
      const raw = localStorage.getItem(ACT_PAID_KEY)
      if (raw) setActPaidIds(new Set(JSON.parse(raw)))
    } catch {}
    const [bk, ord] = await Promise.all([
      fetch(`/api/public-my-bookings?phone=${encodeURIComponent(phone)}`).then(r=>r.json()).catch(()=>[]),
      fetch(`/api/public-my-orders?phone=${encodeURIComponent(phone)}`).then(r=>r.json()).catch(()=>[]),
    ])
    setMyBookings(Array.isArray(bk)?bk:[])
    setMyOrders(Array.isArray(ord)?ord:[])
    setLoadingActivity(false)
  }

  const cancelBooking = async (id: string) => {
    // confirmation handled by askConfirm2 wrapper
    const r = await fetch('/api/public-my-bookings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action:'cancel'})})
    const d = await r.json()
    if (r.ok) {
      setToast({msg:'تم إلغاء الحجز ✓',type:'success'})
      setMyBookings(prev=>prev.map(b=>b.id===id?{...b,status:'cancelled'}:b))
      // Release booked products for this booking
      const bpIds = JSON.parse(localStorage.getItem('lamset_booked_products')||'[]')
      localStorage.setItem('lamset_booked_products', JSON.stringify(bpIds))
    } else { setToast({msg:d.error||'حدث خطأ',type:'error'}) }
  }

  const cancelOrder = async (id: string) => {
    // confirmation handled by askConfirm2 wrapper
    const r = await fetch('/api/public-my-orders',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action:'cancel'})})
    const d = await r.json()
    if (r.ok) {
      setToast({msg:'تم إلغاء الطلب ✓',type:'success'})
      setMyOrders(prev=>prev.map(o=>o.id===id?{...o,status:'cancelled'}:o))
    } else { setToast({msg:d.error||'حدث خطأ',type:'error'}) }
  }

  const modifyBooking = async (id: string, date: string, time: string) => {
    const r = await fetch('/api/public-my-bookings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action:'modify',date,time})})
    const d = await r.json()
    if (r.ok) {
      setToast({msg:'تم تعديل الحجز ✓',type:'success'})
      setModifyingBk(null)
      await loadActivity(activityPhone)
    } else { setToast({msg:d.error||'حدث خطأ',type:'error'}) }
  }

  /* Require login before any action */
  const requireAuth = (action: () => void) => {
    if (!authUser) { setToast({ msg: 'يرجى تسجيل الدخول أولاً', type: 'error' }); setShowLogin(true); return }
    action()
  }

  /* Cart */
  const addToCart = (p:Product) => {
    setCart(prev=>{ const ex=prev.find(i=>i.product.id===p.id); if(ex) return prev.map(i=>i.product.id===p.id?{...i,qty:i.qty+1}:i); return [...prev,{product:p,qty:1}] })
    setToast({msg:'تمت الإضافة إلى السلة ✓',type:'success'})
  }
  const updQty = (id:string,d:number) => setCart(p=>p.map(i=>i.product.id===id?{...i,qty:Math.max(0,i.qty+d)}:i).filter(i=>i.qty>0))
  const rmCart = (id:string) => {
    if (bookedProductIds.includes(id)) {
      setToast({msg:'هذا المنتج مرتبط بحجز نشط — أزله من الحجز أولاً من "نشاطي"',type:'error'}); return
    }
    setCart(p=>p.filter(i=>i.product.id!==id))
  }
  const cartTotal = cart.reduce((s,i)=>s+i.product.price*i.qty,0)
  const cartCount = cart.reduce((s,i)=>s+i.qty,0)

  // ── Derived activity data (used in unified cart) ──────────────────────
  const bkStatusClr = (s:string) => s==='completed'?C.success:s==='cancelled'||s==='no_show'?C.error:s==='confirmed'?C.blue:C.gold
  const bkStatusLbl: Record<string,string> = {pending:'قيد الانتظار',confirmed:'مؤكد',in_progress:'جارٍ',completed:'مكتمل',cancelled:'ملغي',no_show:'لم يحضر'}
  const orStatusLbl: Record<string,string> = {pending:'قيد الانتظار',confirmed:'مؤكد',preparing:'قيد التجهيز',shipped:'في الطريق',delivered:'مسلّم',cancelled:'ملغي'}
  const orStatusClr = (s:string) => s==='delivered'?C.success:s==='cancelled'?C.error:s==='confirmed'?C.blue:C.gold
  const unpaidBks  = myBookings.filter(b=>!['cancelled','completed','no_show'].includes(b.status)&&!actPaidIds.has(String(b.id)))
  const unpaidOrds = myOrders.filter(o=>o.status!=='cancelled'&&o.payment_status!=='paid'&&!actPaidIds.has(String(o.id)))
  const paidBks    = myBookings.filter(b=>b.status==='completed'||actPaidIds.has(String(b.id)))
  const paidOrds   = myOrders.filter(o=>o.payment_status==='paid'||actPaidIds.has(String(o.id)))
  const actUnpaidTotal = [...unpaidBks,...unpaidOrds].reduce((s,x)=>s+Number(x.total||x.service_price||0),0)
  const grandTotal     = cartTotal + actUnpaidTotal
  const totalUnpaidCount = cartCount + unpaidBks.length + unpaidOrds.length
  const paidCount = paidBks.length + paidOrds.length

  const submitOrder = async () => {
    if (!coName||!coPhone) { setToast({msg:'يرجى تعبئة الاسم والجوال',type:'error'}); return }
    setCoBusy(true)
    try {
      const r = await fetch('/api/public-orders',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({items:cart.map(i=>({productId:i.product.id,name:i.product.name_ar,qty:i.qty,priceSar:i.product.price})),
          customerName:coName,customerPhone:coPhone,address:coAddr,paymentMethod:coPay,totalSar:cartTotal})})
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setCoId(d.id); setCoDone(true); setCart([])
      setCoDbBank(''); setCoDbAcct(''); setCoDbOwner('')
      setToast({msg:'تم تقديم الطلب ✓',type:'success'})
    } catch { setToast({msg:'حدث خطأ',type:'error'}) }
    setCoBusy(false)
  }

  /* Filtered lists */
  const applyFilters = <T extends {name_ar:string; price:number; is_featured?:boolean}>(list:T[], extra?:(x:T)=>boolean): T[] =>
    list
      .filter(x => !searchQ || x.name_ar.includes(searchQ))
      .filter(x => !minPrice || x.price >= +minPrice)
      .filter(x => !maxPrice || x.price <= +maxPrice)
      .filter(x => extra ? extra(x) : true)
      .sort((a,b) =>
        sortBy==='price_asc'  ? a.price-b.price :
        sortBy==='price_desc' ? b.price-a.price :
        sortBy==='featured'   ? (b.is_featured?1:0)-(a.is_featured?1:0) :
        a.name_ar.localeCompare(b.name_ar)
      )

  const shownSvc = applyFilters(services)
  const shownPrd = applyFilters(products as any, (p:any) => !onlyStock || (p.stock_qty != null && p.stock_qty > 0))

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.navy, flexDirection:'column', gap:20 }}>
      <div style={{ width:44,height:44,borderRadius:'50%',border:`3px solid ${C.gold}22`,borderTopColor:C.gold,animation:'sp .8s linear infinite' }} />
      <span style={{ color:C.gold, fontSize:14 }}>جاري التحميل...</span>
    </div>
  )
  if (notFound) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.navy, flexDirection:'column', gap:16, padding:24, textAlign:'center' }}>
      <span style={{ fontSize:56 }}>🔍</span>
      <h2 style={{ color:'#fff', fontSize:22, fontWeight:700, margin:0 }}>القسم غير موجود</h2>
      <a href="/public" style={{ padding:'12px 28px', borderRadius:12, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, fontWeight:700, fontSize:14, textDecoration:'none' }}>العودة للرئيسية</a>
    </div>
  )

  return (
    <div style={{ fontFamily:"'Tajawal',sans-serif", direction:'rtl', background:C.navy, color:C.text, minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');
        @keyframes sp{to{transform:rotate(360deg)}}
        @keyframes mi{from{opacity:0;transform:scale(.95) translateY(16px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${C.navy}}
        ::-webkit-scrollbar-thumb{background:${C.gold}44;border-radius:3px}
        .scard{transition:all .35s cubic-bezier(.16,1,.3,1);border:1px solid ${C.border}}
        .scard:hover{transform:translateY(-6px);border-color:${C.gold}44;box-shadow:0 18px 50px rgba(212,164,55,.1)}
        .pcard{transition:all .3s;border:1px solid ${C.border}}
        .pcard:hover{transform:translateY(-5px);border-color:${C.blue}44;box-shadow:0 14px 40px rgba(47,123,255,.1)}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}

      {/* Lightbox */}
      {lightbox && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setLightbox(null)}>
          <img src={lightbox} alt="" style={{ maxWidth:'92vw', maxHeight:'88vh', objectFit:'contain', borderRadius:12 }} />
          <button onClick={()=>setLightbox(null)} style={{ position:'absolute', top:20, left:20, background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', cursor:'pointer', borderRadius:'50%', width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center' }}><X size={20}/></button>
        </div>
      )}

      {/* ─── Header ─── */}
      <header style={{ position:'sticky', top:0, zIndex:100, background:`${C.navyLight}f4`, backdropFilter:'blur(20px)', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:62, padding:'0 20px', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, overflow:'hidden' }}>
            <a href="/public" style={{ display:'flex', alignItems:'center', gap:5, color:C.textMuted, textDecoration:'none', fontSize:13, padding:'5px 10px', borderRadius:9, background:'rgba(255,255,255,0.04)', transition:'color .2s', flexShrink:0 }}
              onMouseEnter={e=>e.currentTarget.style.color=C.goldLight} onMouseLeave={e=>e.currentTarget.style.color=C.textMuted}>
              <ChevronRight size={14} style={{ transform:'rotate(180deg)' }}/> الرئيسية
            </a>
            <span style={{ color:C.border, fontSize:16 }}>/</span>
            <span style={{ color:C.gold, fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{dept?.name_ar}</span>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            {authUser ? (
              <>
                <span style={{ color:C.text, fontSize:12, padding:'5px 10px', borderRadius:9, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:4 }}>
                  <User size={11}/>{authUser.name}
                </span>
                <button onClick={doLogout} style={{ padding:6, borderRadius:8, background:'rgba(255,255,255,0.05)', border:'none', color:C.textDim, cursor:'pointer', display:'flex', alignItems:'center' }}><LogOut size={14}/></button>
              </>
            ) : (
              <button onClick={()=>setShowLogin(true)} style={{ padding:'6px 12px', borderRadius:9, background:'rgba(255,255,255,0.06)', border:'none', color:C.textMuted, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:4, fontFamily:'inherit' }}>
                <LogIn size={12}/> دخول
              </button>
            )}
            <button onClick={()=>{ const p=localStorage.getItem('lamset_last_phone')||authUser?.phone||''; setActivityPhone(p); setCartTab('unpaid'); setCartOpen(true); if(p) loadActivity(p) }}
              style={{ padding:'7px 11px', borderRadius:9, background:'rgba(255,255,255,0.06)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              <ShoppingCart size={15} color={C.gold}/>
              {totalUnpaidCount>0 && <span style={{ background:C.gold, color:C.navy, fontWeight:800, fontSize:10, padding:'1px 6px', borderRadius:20 }}>{totalUnpaidCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Department Hero ─── */}
      <div style={{ position:'relative', minHeight:280, display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
        {dept?.image_url
          ? <img src={dept.image_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${C.navyLight},#0d2040)` }} />}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(10,22,40,1) 0%,rgba(10,22,40,.55) 60%,rgba(10,22,40,.1) 100%)' }} />
        <div style={{ position:'relative', maxWidth:1200, margin:'0 auto', padding:'48px 24px 30px', width:'100%' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'3px 14px', borderRadius:20, background:`${C.gold}1a`, border:`1px solid ${C.gold}28`, marginBottom:12 }}>
            <span style={{ fontSize:18 }}>{dept?.icon||'💎'}</span>
            <span style={{ color:C.gold, fontSize:11, fontWeight:600 }}>قسم</span>
          </div>
          <h1 style={{ color:'#fff', fontSize:'clamp(26px,5vw,48px)', fontWeight:900, margin:'0 0 8px', letterSpacing:'-.02em' }}>{dept?.name_ar}</h1>
          {dept?.description && <p style={{ color:'rgba(255,255,255,.62)', fontSize:14, maxWidth:560, lineHeight:1.8, margin:'0 0 20px' }}>{dept.description}</p>}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ padding:'6px 14px', borderRadius:10, background:'rgba(255,255,255,.07)', color:'#fff', fontSize:12, fontWeight:600 }}>{services.length} خدمة</span>
            <span style={{ padding:'6px 14px', borderRadius:10, background:'rgba(255,255,255,.07)', color:'#fff', fontSize:12, fontWeight:600 }}>{products.length} منتج</span>
            {salon?.whatsapp_number && (
              <a href={`https://wa.me/${salon.whatsapp_number}?text=${encodeURIComponent(`مرحباً، أستفسر عن قسم ${dept?.name_ar}`)}`} target="_blank" rel="noopener noreferrer"
                style={{ padding:'6px 14px', borderRadius:10, background:'#25D36618', border:'1px solid #25D36640', color:'#25D366', fontSize:12, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>
                💬 واتساب
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ─── Sticky Tabs + Filters ─── */}
      <div style={{ position:'sticky', top:62, zIndex:90, background:`${C.navy}fa`, backdropFilter:'blur(16px)', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 20px' }}>
          <div style={{ display:'flex', borderBottom:`1px solid ${C.border}` }}>
            {([['services',`الخدمات (${services.length})`],['products',`المنتجات (${products.length})`]] as const).map(([k,label])=>(
              <button key={k} onClick={()=>{ setTab(k); setSearchQ(''); setMinPrice(''); setMaxPrice(''); setOnlyStock(false) }}
                style={{ padding:'13px 22px', background:'transparent', border:'none', borderBottom:tab===k?`2px solid ${C.gold}`:'2px solid transparent',
                  marginBottom:-1, color:tab===k?C.gold:C.textMuted, fontWeight:tab===k?700:400, fontSize:14, cursor:'pointer', transition:'all .2s', fontFamily:'inherit' }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, padding:'10px 0', flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative', flex:1, minWidth:160 }}>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                placeholder={tab==='services'?'ابحث في الخدمات...':'ابحث في المنتجات...'}
                style={{ width:'100%', padding:'8px 34px 8px 12px', borderRadius:9, border:`1px solid ${C.border}`, background:C.navyCard, color:C.text, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }} />
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:C.textDim, fontSize:12, pointerEvents:'none' }}>🔍</span>
            </div>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}
              style={{ padding:'8px 10px', borderRadius:9, border:`1px solid ${C.border}`, background:C.navyCard, color:C.textMuted, fontSize:12, outline:'none', cursor:'pointer', fontFamily:'inherit' }}>
              <option value="featured">المميزة أولاً</option>
              <option value="price_asc">السعر ↑</option>
              <option value="price_desc">السعر ↓</option>
              <option value="name">الاسم أ-ي</option>
            </select>
            <input value={minPrice} onChange={e=>setMinPrice(e.target.value)} placeholder="من" type="number" min="0"
              style={{ width:70, padding:'8px', borderRadius:9, border:`1px solid ${C.border}`, background:C.navyCard, color:C.textMuted, fontSize:12, outline:'none', fontFamily:'inherit' }} />
            <span style={{ color:C.textDim }}>—</span>
            <input value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="إلى" type="number" min="0"
              style={{ width:70, padding:'8px', borderRadius:9, border:`1px solid ${C.border}`, background:C.navyCard, color:C.textMuted, fontSize:12, outline:'none', fontFamily:'inherit' }} />
            {tab==='products' && (
              <label style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', color:C.textMuted, fontSize:12, userSelect:'none' }}>
                <input type="checkbox" checked={onlyStock} onChange={e=>setOnlyStock(e.target.checked)} style={{ accentColor:C.gold, width:13, height:13 }} />
                متوفر فقط
              </label>
            )}
            {(searchQ||minPrice||maxPrice||onlyStock) && (
              <button onClick={()=>{setSearchQ('');setMinPrice('');setMaxPrice('');setOnlyStock(false)}}
                style={{ padding:'7px 12px', borderRadius:9, background:`${C.error}15`, border:`1px solid ${C.error}33`, color:C.error, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                مسح ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 20px 80px' }}>

        {/* ── Services ── */}
        {tab==='services' && (
          <>
            {shownSvc.length===0 && (
              <div style={{ textAlign:'center', padding:'80px 0', color:C.textDim }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🔍</div>
                <p style={{ fontSize:15 }}>لا توجد خدمات تطابق البحث</p>
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:22 }}>
              {shownSvc.map((s, i) => (
                <div key={s.id} className="scard" style={{ borderRadius:20, background:C.navyCard, overflow:'hidden', display:'flex', flexDirection:'column', position:'relative' }}>
                  {s.is_featured && <div style={{ position:'absolute', top:10, left:10, zIndex:3, padding:'2px 10px', borderRadius:20, background:C.gold, color:C.navy, fontSize:10, fontWeight:700 }}>⭐ مميزة</div>}

                  {/* Image gallery */}
                  <div onClick={()=>{ const imgs=s.images||[]; if(imgs.length>0) setLightbox(imgs[0].url) }} style={{ cursor:'zoom-in' }}>
                    <ImageGallery
                      images={s.images || (s.image_url ? [{url:s.image_url,type:'cover'}] : [])}
                      alt={s.name_ar}
                      placeholder={ICONS[i%ICONS.length]}
                      type="service"
                    />
                  </div>

                  <div style={{ padding:'16px 18px 20px', flex:1, display:'flex', flexDirection:'column' }}>
                    {s.category_name && <span style={{ color:C.textDim, fontSize:11, marginBottom:3 }}>{s.category_name}</span>}
                    <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:5 }}>{s.name_ar}</h3>
                    {s.description && <p style={{ color:C.textMuted, fontSize:12, lineHeight:1.7, marginBottom:8, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>{s.description}</p>}
                    <div style={{ fontSize:12, color:C.textDim, marginBottom:14, display:'flex', alignItems:'center', gap:4 }}><Clock size={11}/> {s.duration_min} دقيقة</div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                      <span style={{ fontSize:20, fontWeight:900, color:C.gold }}>{s.price}<span style={{ fontSize:10, color:C.textDim }}> ر.س</span></span>
                      <button onClick={()=>requireAuth(()=>openBooking(s))} style={{ padding:'9px 20px', borderRadius:12, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, fontWeight:700, fontSize:13, border:'none', cursor:'pointer', transition:'all .25s' }}
                        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 22px ${C.goldGlow}`}}
                        onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                        احجز الآن
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Products ── */}
        {tab==='products' && (
          <>
            {shownPrd.length===0 && (
              <div style={{ textAlign:'center', padding:'80px 0', color:C.textDim }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🛍️</div>
                <p style={{ fontSize:15 }}>لا توجد منتجات تطابق البحث</p>
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:18 }}>
              {shownPrd.map((p, i) => (
                <div key={p.id} className="pcard" style={{ borderRadius:18, background:C.navyCard, overflow:'hidden', display:'flex', flexDirection:'column', position:'relative' }}>
                  {p.is_featured && <div style={{ position:'absolute', top:10, left:10, zIndex:3, padding:'2px 8px', borderRadius:10, background:C.gold, color:C.navy, fontSize:10, fontWeight:700 }}>⭐</div>}

                  {/* Image gallery */}
                  <div onClick={()=>{ const imgs=p.images||[]; if(imgs.length>0) setLightbox(imgs[0].url) }} style={{ cursor:'zoom-in' }}>
                    <ImageGallery
                      images={p.images || (p.image_url ? [{url:p.image_url}] : [])}
                      alt={p.name_ar}
                      placeholder={PI[i%PI.length]}
                      type="product"
                    />
                  </div>

                  <div style={{ padding:'12px 14px 16px', flex:1, display:'flex', flexDirection:'column', textAlign:'center' }}>
                    <h3 style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:4 }}>{p.name_ar}</h3>
                    {p.brand && <span style={{ display:'inline-block', padding:'1px 8px', borderRadius:8, background:`${C.blue}14`, color:C.blue, fontSize:10, fontWeight:600, marginBottom:6 }}>{p.brand}</span>}
                    {p.stock_qty != null && (
                      <div style={{ fontSize:11, color:p.stock_qty>0?C.success:C.error, marginBottom:5, fontWeight:500 }}>
                        {p.stock_qty>0 ? `✓ متوفر (${p.stock_qty})` : '✗ نفذ المخزون'}
                      </div>
                    )}
                    <div style={{ fontSize:17, fontWeight:800, color:C.gold, marginBottom:10, marginTop:'auto', paddingTop:6 }}>{p.price}<span style={{ fontSize:9, color:C.textDim }}> ر.س</span></div>
                    <button onClick={()=>requireAuth(()=>addToCart(p))} disabled={p.stock_qty===0}
                      style={{ padding:'8px 12px', borderRadius:11, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, fontWeight:700, fontSize:11, border:'none',
                        cursor:p.stock_qty===0?'not-allowed':'pointer', opacity:p.stock_qty===0?.4:1, width:'100%', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontFamily:'inherit' }}
                      onMouseEnter={e=>{ if(p.stock_qty!==0) e.currentTarget.style.transform='translateY(-1px)' }}
                      onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                      <Plus size={12}/> أضف إلى السلة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* WhatsApp */}
      {salon?.whatsapp_number && (
        <a href={`https://wa.me/${salon.whatsapp_number}?text=${encodeURIComponent(salon.whatsapp_message||'مرحباً')}`} target="_blank" rel="noopener noreferrer"
          style={{ position:'fixed', bottom:24, left:24, zIndex:999, width:52, height:52, borderRadius:'50%', background:'#25D366', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(37,211,102,.4)', transition:'all .3s' }}
          onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.12)';e.currentTarget.style.boxShadow='0 8px 30px rgba(37,211,102,.6)'}}
          onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 4px 20px rgba(37,211,102,.4)'}}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      )}

      {/* ══ Booking Modal — Multi-Step ══ */}
      {bkSvc && !bkDone && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={()=>setBkSvc(null)}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)' }} />
          <div onClick={e=>e.stopPropagation()} style={{ position:'relative', width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto', background:C.navyCard, borderRadius:24, border:`1px solid ${C.border}`, padding:28, animation:'mi .3s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h2 style={{ color:'#fff', fontSize:18, fontWeight:700, margin:0 }}>حجز موعد</h2>
              <button onClick={()=>setBkSvc(null)} style={{ background:'rgba(255,255,255,0.07)',border:'none',color:C.textMuted,cursor:'pointer',borderRadius:10,width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center' }}><X size={16}/></button>
            </div>
            <div style={{ background:`${C.gold}0d`, borderRadius:12, padding:'11px 14px', marginBottom:18, border:`1px solid ${C.gold}22`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div><strong style={{ color:'#fff', fontSize:14 }}>{bkSvc.name_ar}</strong><span style={{ color:C.textDim, fontSize:11, display:'flex', alignItems:'center', gap:3, marginTop:2 }}><Clock size={10}/> {bkSvc.duration_min} دقيقة</span></div>
              <span style={{ color:C.gold, fontWeight:800, fontSize:17 }}>{bkSvc.price}<span style={{ fontSize:10, color:C.textDim }}> ر.س</span></span>
            </div>
            {/* Step 1: Contact */}
            {bkStep==='contact'&&(<div>
              <Field label="الاسم *" value={bkName} onChange={setBkName} placeholder="أدخل اسمك الكامل" />
              <Field label="رقم الجوال *" value={bkPhone} onChange={setBkPhone} type="tel" placeholder="05XXXXXXXX" />
              {existingBk&&(<div style={{ background:'rgba(245,158,11,0.12)', border:'1px solid #F59E0B', borderRadius:10, padding:12, marginBottom:12, fontSize:13, color:'#FCD34D', lineHeight:1.6 }}>
                ⚠️ لديك حجز لهذه الخدمة بتاريخ <strong>{existingBk.date}</strong> الساعة <strong>{existingBk.time}</strong>
                <br/><span style={{ fontSize:11, opacity:0.8 }}>يمكنك المتابعة بحجز جديد إذا أردت</span>
              </div>)}
              <Btn fullWidth onClick={handleContactNext} style={{ padding:'13px', marginTop:4 }}>متابعة ←</Btn>
            </div>)}
            {/* Step 2: Branch */}
            {bkStep==='branch'&&(<div>
              <h3 style={{ color:'#fff', fontSize:15, fontWeight:600, marginBottom:14 }}>🏢 اختر الفرع</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {branches.map(b=>(<button key={b.id} onClick={async()=>{setBkBranch(b);await loadStaff(b.id);setBkStep('staff')}}
                  style={{ padding:'13px 16px', borderRadius:12, border:`1px solid ${bkBranch?.id===b.id?C.gold:C.border}`, background:bkBranch?.id===b.id?`${C.gold}15`:C.navy, color:'#fff', cursor:'pointer', textAlign:'right', transition:'all .2s', fontFamily:'inherit' }}>
                  <div style={{ fontWeight:700 }}>{b.name}</div>
                  {b.address&&<div style={{ fontSize:11, color:C.textDim, marginTop:2 }}>📍 {b.address}</div>}
                </button>))}
              </div>
              <button onClick={()=>setBkStep('contact')} style={{ background:'none',border:'none',color:C.textDim,cursor:'pointer',fontSize:13,marginTop:14,fontFamily:'inherit' }}>← رجوع</button>
            </div>)}
            {/* Step 3: Staff */}
            {bkStep==='staff'&&(<div>
              <h3 style={{ color:'#fff', fontSize:15, fontWeight:600, marginBottom:14 }}>👤 اختر المختص</h3>
              {loadingStaff?<div style={{ textAlign:'center', padding:24, color:C.textDim }}>جاري التحميل...</div>:(
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <button onClick={()=>{setBkStaff(null);setBkStep('datetime')}}
                    style={{ padding:'12px 16px', borderRadius:12, border:`1px solid ${C.gold}44`, background:`${C.gold}0a`, color:C.gold, cursor:'pointer', textAlign:'right', fontWeight:600, fontSize:13, fontFamily:'inherit', display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:22 }}>⭐</span>
                    <div><div style={{ fontWeight:700 }}>أي موظف متاح</div><div style={{ fontSize:11, opacity:0.7, fontWeight:400 }}>سيتم تخصيص أفضل موظف</div></div>
                  </button>
                  {staffList.map(s=>(<button key={s.id} onClick={()=>{setBkStaff(s);setBkStep('datetime')}}
                    style={{ padding:'12px 16px', borderRadius:12, border:`1px solid ${bkStaff?.id===s.id?C.gold:C.border}`, background:bkStaff?.id===s.id?`${C.gold}15`:C.navy, color:'#fff', cursor:'pointer', textAlign:'right', transition:'all .2s', fontFamily:'inherit', display:'flex', alignItems:'center', gap:10 }}>
                    {s.image_url?<img src={s.image_url} alt="" style={{ width:40,height:40,borderRadius:'50%',objectFit:'cover',flexShrink:0 }} />
                      :<div style={{ width:40,height:40,borderRadius:'50%',background:`${C.gold}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>👤</div>}
                    <div><div style={{ fontWeight:700, fontSize:14 }}>{s.name}</div>{s.role&&<div style={{ fontSize:11, color:C.textDim }}>{s.role}</div>}</div>
                  </button>))}
                  {staffList.length===0&&<div style={{ color:C.textDim, fontSize:13, textAlign:'center', padding:16 }}>لا يوجد موظفون متاحون</div>}
                </div>
              )}
              <button onClick={()=>setBkStep(branches.length>1?'branch':'contact')} style={{ background:'none',border:'none',color:C.textDim,cursor:'pointer',fontSize:13,marginTop:14,fontFamily:'inherit' }}>← رجوع</button>
            </div>)}
            {/* Step 4: Date + Time */}
            {bkStep==='datetime'&&(<div>
              <h3 style={{ color:'#fff', fontSize:15, fontWeight:600, marginBottom:14 }}>📅 التاريخ والوقت</h3>
              {bkStaff&&<div style={{ fontSize:12, color:C.gold, marginBottom:10, fontWeight:500 }}>المختص: {bkStaff.name}</div>}
              <Field label="التاريخ *" value={bkDate} onChange={checkAvailability} type="date" />
              {bkDate&&(<div style={{ marginBottom:14 }}>
                <label style={{ display:'block', color:C.textMuted, fontSize:13, marginBottom:6, fontWeight:500 }}>
                  الوقت * {loadingAvail&&<span style={{ fontSize:11, opacity:0.65 }}> — جاري التحقق من التوافر...</span>}
                </label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(70px,1fr))', gap:5 }}>
                  {genSlots().map(t=>{
                    const busy=bookedSlots.includes(t)
                    return(<button key={t} onClick={()=>!busy&&setBkTime(t)} disabled={busy}
                      style={{ padding:'7px 4px', borderRadius:8, border:`1px solid ${busy?C.error+'55':bkTime===t?C.gold:C.border}`, background:busy?`${C.error}10`:bkTime===t?`${C.gold}22`:'transparent', color:busy?C.error:bkTime===t?C.gold:C.textMuted, fontSize:11, fontWeight:bkTime===t?700:400, cursor:busy?'not-allowed':'pointer', transition:'all .15s', fontFamily:'inherit', opacity:busy?.55:1 }}>
                      {t}{busy&&' ✗'}
                    </button>)
                  })}
                </div>
                {bkStaff&&bookedSlots.length>0&&<p style={{ fontSize:11, color:C.error, marginTop:8 }}>🔴 {bookedSlots.length} وقت محجوز — اختر وقتاً متاحاً</p>}
              </div>)}
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button onClick={()=>setBkStep('staff')} style={{ flex:1, padding:'12px', borderRadius:12, background:'rgba(255,255,255,0.07)', border:`1px solid ${C.border}`, color:C.textMuted, cursor:'pointer', fontFamily:'inherit' }}>← رجوع</button>
                <Btn onClick={()=>cart.length>0?setBkStep('products'):submitBooking()} disabled={!bkDate||!bkTime||bkBusy} style={{ flex:2, padding:'12px' }}>
                  {bkBusy?'جاري...':cart.length>0?'التالي — منتجات الجلسة →':'تأكيد الحجز'}
                </Btn>
              </div>
            </div>)}
            {/* Step 5: Session products */}
            {bkStep==='products'&&cart.length>0&&(<div>
              <h3 style={{ color:'#fff', fontSize:15, fontWeight:600, marginBottom:6 }}>🛒 منتجات الجلسة (اختياري)</h3>
              <p style={{ fontSize:12, color:C.textMuted, marginBottom:14, lineHeight:1.7 }}>اختر المنتجات من سلتك لاستخدامها في هذه الجلسة</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                {cart.map(item=>{
                  const id=String(item.product.id); const checked=bkIncProducts.includes(id)
                  return(<label key={id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:10, background:checked?`${C.gold}12`:C.navy, border:`1px solid ${checked?C.gold:C.border}`, cursor:'pointer', transition:'all .15s' }}>
                    <input type="checkbox" checked={checked} onChange={e=>setBkIncProducts(prev=>e.target.checked?[...prev,id]:prev.filter(x=>x!==id))} style={{ accentColor:C.gold, width:16, height:16 }} />
                    <div style={{ flex:1 }}><div style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{item.product.name_ar}</div><div style={{ color:C.textDim, fontSize:11 }}>الكمية: {item.qty} — {item.product.price*item.qty} ر.س</div></div>
                  </label>)
                })}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setBkStep('datetime')} style={{ flex:1, padding:'12px', borderRadius:12, background:'rgba(255,255,255,0.07)', border:`1px solid ${C.border}`, color:C.textMuted, cursor:'pointer', fontFamily:'inherit' }}>← رجوع</button>
                <Btn onClick={submitBooking} disabled={bkBusy} style={{ flex:2, padding:'12px' }}>{bkBusy?'جاري الحجز...':'تأكيد الحجز'}</Btn>
              </div>
            </div>)}
          </div>
        </div>
      )}
            {bkDone && (
        <Modal onClose={()=>{setBkSvc(null);setBkDone(false)}} title="تم الحجز ✓">
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ width:58,height:58,borderRadius:'50%',background:`${C.success}22`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',fontSize:24 }}>✅</div>
            <p style={{ color:'#fff', fontSize:16, fontWeight:700, marginBottom:2 }}>{bkSvc?.name_ar}</p>
            <p style={{ color:C.textMuted, fontSize:13, marginBottom:2 }}>👤 {bkName} — 📞 {bkPhone}</p>
            <p style={{ color:C.gold, fontSize:13 }}>{bkDate} — {bkTime}</p>
            <div style={{ marginTop:14,padding:10,background:`${C.gold}0a`,borderRadius:10,border:`1px solid ${C.gold}22`,color:C.textDim,fontSize:12 }}>رقم الحجز: {bkId||'BK'+Date.now().toString(36).toUpperCase()}</div>
            <Btn onClick={()=>{setBkSvc(null);setBkDone(false)}} style={{ marginTop:18 }}>تم</Btn>
          </div>
        </Modal>
      )}

      {/* ── Auth modals ── */}
      {showLogin && (
        <Modal onClose={()=>setShowLogin(false)} title="تسجيل الدخول">
          <Field label="رقم الجوال" value={lPhone} onChange={setLPhone} type="tel" placeholder="05XXXXXXXX" />
          <Field label="كلمة المرور" value={lPass} onChange={setLPass} type="password" />
          <Btn fullWidth onClick={doLogin} disabled={authBusy} style={{ padding:'13px' }}>{authBusy?'جاري...':'دخول'}</Btn>
          <div style={{ textAlign:'center', marginTop:12 }}>
            <span style={{ color:C.textDim, fontSize:13 }}>ليس لديك حساب؟ </span>
            <button onClick={()=>{setShowLogin(false);setShowReg(true)}} style={{ background:'none',border:'none',color:C.gold,cursor:'pointer',fontSize:13,fontFamily:'inherit' }}>إنشاء حساب</button>
          </div>
        </Modal>
      )}
      {showReg && (
        <Modal onClose={()=>setShowReg(false)} title="إنشاء حساب">
          <Field label="الاسم" value={rName} onChange={setRName} />
          <Field label="رقم الجوال" value={rPhone} onChange={setRPhone} type="tel" placeholder="05XXXXXXXX" />
          <Field label="كلمة المرور" value={rPass} onChange={setRPass} type="password" />
          <Btn fullWidth onClick={doRegister} disabled={authBusy} style={{ padding:'13px' }}>{authBusy?'جاري...':'إنشاء حساب'}</Btn>
          <div style={{ textAlign:'center', marginTop:12 }}>
            <span style={{ color:C.textDim, fontSize:13 }}>لديك حساب؟ </span>
            <button onClick={()=>{setShowReg(false);setShowLogin(true)}} style={{ background:'none',border:'none',color:C.gold,cursor:'pointer',fontSize:13,fontFamily:'inherit' }}>تسجيل الدخول</button>
          </div>
        </Modal>
      )}

      {/* ══ Unified Cart Drawer (products + bookings + orders) ══ */}
      {cartOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:1001 }} onClick={()=>setCartOpen(false)}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} />
          <div onClick={e=>e.stopPropagation()} style={{ position:'absolute', right:0, top:0, bottom:0, width:'100%', maxWidth:480, background:C.navyCard, borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', animation:'su .3s ease' }}>
            {/* Header */}
            <div style={{ padding:'18px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <h2 style={{ color:'#fff', fontSize:17, fontWeight:700, margin:0, display:'flex', alignItems:'center', gap:8 }}>
                <ShoppingCart size={16} color={C.gold}/> السلة
                {totalUnpaidCount>0&&<span style={{ background:C.gold, color:C.navy, fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20 }}>{totalUnpaidCount}</span>}
              </h2>
              <button onClick={()=>setCartOpen(false)} style={{ background:'rgba(255,255,255,.07)',border:'none',color:C.textMuted,cursor:'pointer',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center' }}><X size={15}/></button>
            </div>

            {/* Phone input if not set */}
            {!activityPhone ? (
              <div style={{ padding:20 }}>
                <p style={{ color:C.textMuted, fontSize:13, marginBottom:12 }}>أدخل رقم جوالك للاطلاع على حجوزاتك وطلباتك</p>
                <div style={{ display:'flex', gap:8 }}>
                  <input value={activityPhone} onChange={e=>setActivityPhone(e.target.value)} placeholder="05XXXXXXXX" type="tel" dir="ltr"
                    style={{ flex:1, padding:'10px 12px', borderRadius:10, border:`1px solid ${C.border}`, background:C.navy, color:C.text, fontSize:14, outline:'none', fontFamily:'inherit' }}
                    onKeyDown={e=>e.key==='Enter'&&loadActivity(activityPhone)} />
                  <button onClick={()=>loadActivity(activityPhone)}
                    style={{ padding:'10px 16px', borderRadius:10, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, fontWeight:700, fontSize:13, border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                    بحث
                  </button>
                </div>
              </div>
            ) : (() => {
              const unpaidBks = myBookings.filter(b=>!['cancelled','completed','no_show'].includes(b.status)&&!actPaidIds.has(String(b.id)))
              const unpaidOrds = myOrders.filter(o=>o.status!=='cancelled'&&o.payment_status!=='paid'&&!actPaidIds.has(String(o.id)))
              const paidBks  = myBookings.filter(b=>b.status==='completed'||actPaidIds.has(String(b.id)))
              const paidOrds = myOrders.filter(o=>o.payment_status==='paid'||actPaidIds.has(String(o.id)))
              const unpaidTotal = [...unpaidBks,...unpaidOrds].reduce((s,x)=>s+Number(x.total||x.service_price||0),0)
              const unpaidCount = unpaidBks.length + unpaidOrds.length
              const bkStatusClr = (s:string) => s==='completed'?C.success:s==='cancelled'||s==='no_show'?C.error:s==='confirmed'?C.blue:C.gold
              const bkStatusLbl: Record<string,string> = {pending:'قيد الانتظار',confirmed:'مؤكد',in_progress:'جارٍ',completed:'مكتمل',cancelled:'ملغي',no_show:'لم يحضر'}
              const orStatusLbl: Record<string,string> = {pending:'قيد الانتظار',confirmed:'مؤكد',preparing:'قيد التجهيز',shipped:'في الطريق',delivered:'مسلّم',cancelled:'ملغي'}
              const orStatusClr = (s:string) => s==='delivered'?C.success:s==='cancelled'?C.error:s==='confirmed'?C.blue:C.gold

              const doPayAll = () => {
                const newIds = new Set([...actPaidIds,...unpaidBks.map(b=>String(b.id)),...unpaidOrds.map(o=>String(o.id))])
                setActPaidIds(newIds)
                try { localStorage.setItem(ACT_PAID_KEY, JSON.stringify([...newIds])) } catch {}
                setShowActPay(false)
                setToast({msg:'تم إرسال طلب الدفع ✓ سيتم التحقق خلال دقائق',type:'success'})
              }

              return (
              <>
                {/* Tabs */}
                <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                  {([['unpaid','غير مدفوعة',totalUnpaidCount],['paid','مدفوعة',paidCount]] as const).map(([k,l,cnt])=>(
                    <button key={k} type="button" onClick={()=>{setCartTab(k);setActDetail(null)}}
                      style={{ flex:1, padding:'12px 8px', background:'transparent', border:'none', borderBottom:cartTab===k?`3px solid ${C.gold}`:'3px solid transparent', marginBottom:-1, color:cartTab===k?C.gold:C.textMuted, fontWeight:cartTab===k?700:400, fontSize:13, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      {l}
                      {cnt>0&&<span style={{ background:cartTab===k?C.gold:'rgba(255,255,255,.12)', color:cartTab===k?C.navy:'#fff', fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:20 }}>{cnt}</span>}
                    </button>
                  ))}
                </div>

                {/* Phone row */}
                <div style={{ padding:'8px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                  <span style={{ fontSize:12, color:C.textDim }}>📞 {activityPhone}</span>
                  <div style={{ display:'flex', gap:8 }}>
                    <button type="button" onClick={()=>loadActivity(activityPhone)} style={{ background:'none',border:'none',color:C.gold,cursor:'pointer',fontSize:11,fontFamily:'inherit' }}>🔄 تحديث</button>
                    <button type="button" onClick={()=>{ setActivityPhone(''); setMyBookings([]); setMyOrders([]) }} style={{ background:'none',border:'none',color:C.textMuted,cursor:'pointer',fontSize:11,fontFamily:'inherit' }}>تغيير الرقم</button>
                  </div>
                </div>

                <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', paddingBottom: unpaidCount>0?70:12 }}>
                  {loadingActivity && <div style={{ textAlign:'center', padding:40, color:C.textDim }}>جاري التحميل...</div>}

                  {/* ══ TAB 1: غير مدفوعة ══ */}
                  {!loadingActivity && cartTab==='unpaid' && (
                    totalUnpaidCount===0 ? (
                      <div style={{ textAlign:'center', padding:40 }}>
                        <div style={{ fontSize:44, marginBottom:10 }}>✅</div>
                        <p style={{ color:C.textDim }}>لا توجد مدفوعات معلقة</p>
                      </div>
                    ) : (
                      <>
                        {/* ── منتجات السلة ── */}
                        {cart.length>0&&<>
                          <p style={{ color:C.textDim, fontSize:11, fontWeight:600, marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>📦 منتجات السلة</p>
                          {cart.map(item=>(
                            <div key={item.product.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                              <div style={{ flex:1 }}>
                                <div style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{item.product.name_ar}</div>
                                <div style={{ color:C.gold, fontWeight:700, fontSize:12 }}>{(item.product.price*item.qty).toLocaleString()} ر.س</div>
                              </div>
                              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                <button onClick={()=>updQty(item.product.id,-1)} style={{ width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:'transparent',color:C.textMuted,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><Minus size={11}/></button>
                                <span style={{ color:'#fff', fontWeight:700, fontSize:13, minWidth:18, textAlign:'center' }}>{item.qty}</span>
                                <button onClick={()=>updQty(item.product.id,1)} style={{ width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:'transparent',color:C.textMuted,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><Plus size={11}/></button>
                              </div>
                              <button onClick={()=>rmCart(item.product.id)} style={{ width:26,height:26,borderRadius:6,border:'none',background:`${C.error}22`,color:C.error,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><Trash2 size={11}/></button>
                            </div>
                          ))}
                          <div style={{ marginBottom:14 }}/>
                        </>}
                        {unpaidBks.length>0&&<>
                          <p style={{ color:C.textDim, fontSize:11, fontWeight:600, marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>✂️ خدمات محجوزة</p>
                          {unpaidBks.map(b=>(
                            <div key={b.id} style={{ marginBottom:12, borderRadius:14, background:C.navy, border:`1.5px solid ${C.gold}55`, overflow:'hidden' }}>
                              <div style={{ padding:'12px 14px' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                                  <div>
                                    <div style={{ color:'#fff', fontWeight:700, fontSize:14 }}>{b.service_name}</div>
                                    <div style={{ fontSize:11, color:C.textDim, marginTop:2 }}>{b.branch_name}{b.staff_name?` — ${b.staff_name}`:''}</div>
                                  </div>
                                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:600, background:`${bkStatusClr(b.status)}22`, color:bkStatusClr(b.status) }}>
                                    {bkStatusLbl[b.status]||b.status}
                                  </span>
                                </div>
                                <div style={{ display:'flex', gap:12, fontSize:11, color:C.textMuted, marginBottom:8 }}>
                                  <span>📅 {b.date}</span><span>🕐 {b.start_time?.slice(0,5)}</span>
                                </div>
                                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                                  <span style={{ color:C.gold, fontWeight:800, fontSize:16 }}>{Number(b.total||b.service_price||0).toLocaleString()} ر.س</span>
                                </div>
                              </div>
                              <div style={{ padding:'8px 14px', borderTop:`1px solid ${C.border}`, display:'flex', gap:7 }}>
                                {modifyingBk?.id===b.id ? (
                                  <div style={{ flex:1 }}>
                                    <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                                      <input type="date" defaultValue={b.date} onChange={e=>setModifyingBk({...b,newDate:e.target.value})} style={{ flex:1,padding:'6px 8px',borderRadius:7,border:`1px solid ${C.border}`,background:C.navyCard,color:C.text,fontSize:11,outline:'none',fontFamily:'inherit' }}/>
                                      <select defaultValue={b.start_time?.slice(0,5)} onChange={e=>setModifyingBk({...b,newDate:modifyingBk.newDate||b.date,newTime:e.target.value})} style={{ flex:1,padding:'6px 8px',borderRadius:7,border:`1px solid ${C.border}`,background:C.navyCard,color:C.text,fontSize:11,outline:'none',fontFamily:'inherit' }}>
                                        {genSlots().map(t=><option key={t} value={t}>{t}</option>)}
                                      </select>
                                    </div>
                                    <div style={{ display:'flex', gap:6 }}>
                                      <button type="button" onClick={()=>setModifyingBk(null)} style={{ flex:1,padding:'6px',borderRadius:7,background:'rgba(255,255,255,.07)',border:`1px solid ${C.border}`,color:C.textMuted,cursor:'pointer',fontSize:11,fontFamily:'inherit' }}>إلغاء</button>
                                      <button type="button" onClick={()=>modifyBooking(b.id,modifyingBk.newDate||b.date,modifyingBk.newTime||b.start_time?.slice(0,5))} style={{ flex:2,padding:'6px',borderRadius:7,background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,border:'none',color:C.navy,fontWeight:700,cursor:'pointer',fontSize:11,fontFamily:'inherit' }}>حفظ التعديل</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <button type="button" onClick={()=>setModifyingBk({...b,newDate:b.date,newTime:b.start_time?.slice(0,5)})} style={{ flex:1,padding:'7px',borderRadius:8,background:`${C.blue}15`,border:`1px solid ${C.blue}33`,color:C.blue,cursor:'pointer',fontSize:11,fontFamily:'inherit' }}>✏️ تعديل</button>
                                    <button type="button" onClick={()=>askConfirm2("إلغاء الحجز","هل أنت متأكد؟",()=>cancelBooking(b.id),"إلغاء الحجز")} style={{ flex:1,padding:'7px',borderRadius:8,background:`${C.error}12`,border:`1px solid ${C.error}33`,color:C.error,cursor:'pointer',fontSize:11,fontFamily:'inherit' }}>✕ إلغاء</button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </>}

                        {unpaidOrds.length>0&&<>
                          <p style={{ color:C.textDim, fontSize:11, fontWeight:600, marginBottom:8, marginTop:unpaidBks.length>0?14:0, display:'flex', alignItems:'center', gap:4 }}>📦 طلبات معلقة</p>
                          {unpaidOrds.map(o=>(
                            <div key={o.id} style={{ marginBottom:12, borderRadius:14, background:C.navy, border:`1.5px solid ${C.gold}55`, overflow:'hidden' }}>
                              <div style={{ padding:'12px 14px' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                                  <div>
                                    <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>طلب #{o.id?.slice(-8).toUpperCase()}</div>
                                    <div style={{ fontSize:11, color:C.textDim, marginTop:1 }}>{new Date(o.created_at).toLocaleDateString('ar-SA')}</div>
                                  </div>
                                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:600, background:`${orStatusClr(o.status)}22`, color:orStatusClr(o.status) }}>{orStatusLbl[o.status]||o.status}</span>
                                </div>
                                {(o.items||[]).slice(0,2).map((it:any,i:number)=>(
                                  <div key={i} style={{ display:'flex', gap:8, padding:'5px 0', borderTop:`1px solid ${C.border}` }}>
                                    <div style={{ width:28,height:28,borderRadius:6,background:`${C.gold}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0 }}>🛍️</div>
                                    <div style={{ flex:1,minWidth:0 }}>
                                      <div style={{ color:'#fff',fontSize:11,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis' }}>{it.name}</div>
                                      <div style={{ color:C.textDim,fontSize:10 }}>{it.qty} × {it.price} ر.س</div>
                                    </div>
                                  </div>
                                ))}
                                {(o.items||[]).length>2&&<div style={{ fontSize:10,color:C.textDim,marginTop:3 }}>+{o.items.length-2} أخرى</div>}
                                <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                                  <span style={{ fontSize:11,color:C.textDim }}>{o.payment_method==='bank_transfer'?'💳 تحويل':o.payment_method==='cod'?'💵 كاش':'💳'}</span>
                                  <span style={{ color:C.gold,fontWeight:800,fontSize:16 }}>{Number(o.total||0).toLocaleString()} ر.س</span>
                                </div>
                              </div>
                              <div style={{ padding:'8px 14px', borderTop:`1px solid ${C.border}` }}>
                                <button type="button" onClick={()=>askConfirm2("إلغاء الطلب","هل أنت متأكد؟",()=>cancelOrder(o.id),"إلغاء الطلب")} style={{ width:'100%',padding:'7px',borderRadius:8,background:`${C.error}12`,border:`1px solid ${C.error}33`,color:C.error,cursor:'pointer',fontSize:11,fontFamily:'inherit' }}>✕ إلغاء الطلب</button>
                              </div>
                            </div>
                          ))}
                        </>}
                      </>
                    )
                  )}

                  {/* ══ TAB 2: مدفوعة ══ */}
                  {!loadingActivity && cartTab==='paid' && (
                    paidBks.length===0 && paidOrds.length===0 ? (
                      <div style={{ textAlign:'center', padding:40 }}><div style={{ fontSize:44, marginBottom:10 }}>📭</div><p style={{ color:C.textDim }}>لا توجد عناصر مدفوعة</p></div>
                    ) : (
                      <>
                        {paidBks.length>0&&<>
                          <p style={{ color:C.textDim, fontSize:11, fontWeight:600, marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>✂️ خدمات تم سدادها</p>
                          {paidBks.map(b=>(
                            <div key={b.id} style={{ marginBottom:12, borderRadius:14, background:C.navy, border:`1.5px solid ${C.success}55`, overflow:'hidden' }}>
                              <div style={{ padding:'12px 14px' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                                  <div>
                                    <div style={{ color:'#fff', fontWeight:700, fontSize:14 }}>{b.service_name}</div>
                                    <div style={{ fontSize:11, color:C.textDim, marginTop:2 }}>{b.branch_name}{b.staff_name?` — ${b.staff_name}`:''}</div>
                                  </div>
                                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:`${C.success}22`, color:C.success }}>✓ تم السداد</span>
                                </div>
                                <div style={{ display:'flex', gap:12, fontSize:11, color:C.textMuted, marginBottom:8 }}>
                                  <span>📅 {b.date}</span><span>🕐 {b.start_time?.slice(0,5)}</span>
                                </div>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                                  <span style={{ color:C.gold, fontWeight:800, fontSize:16 }}>{Number(b.total||b.service_price||0).toLocaleString()} ر.س</span>
                                  <button type="button" onClick={()=>{setActDetailType('booking');setActDetail(b)}} style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,background:'rgba(255,255,255,.06)',border:`1px solid ${C.border}`,color:C.textMuted,cursor:'pointer',fontSize:11,fontFamily:'inherit' }}>👁 التفاصيل</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>}
                        {paidOrds.length>0&&<>
                          <p style={{ color:C.textDim, fontSize:11, fontWeight:600, marginBottom:8, marginTop:paidBks.length>0?14:0, display:'flex', alignItems:'center', gap:4 }}>📦 طلبات مدفوعة</p>
                          {paidOrds.map(o=>(
                            <div key={o.id} style={{ marginBottom:12, borderRadius:14, background:C.navy, border:`1.5px solid ${C.success}55`, overflow:'hidden' }}>
                              <div style={{ padding:'12px 14px' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                                  <div>
                                    <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>طلب #{o.id?.slice(-8).toUpperCase()}</div>
                                    <div style={{ fontSize:11, color:C.textDim, marginTop:1 }}>{new Date(o.created_at).toLocaleDateString('ar-SA')}</div>
                                  </div>
                                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:`${C.success}22`, color:C.success }}>✓ مدفوع</span>
                                </div>
                                {(o.items||[]).slice(0,2).map((it:any,i:number)=>(
                                  <div key={i} style={{ display:'flex', gap:8, padding:'5px 0', borderTop:`1px solid ${C.border}` }}>
                                    <div style={{ width:28,height:28,borderRadius:6,background:`${C.gold}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0 }}>🛍️</div>
                                    <div style={{ flex:1,minWidth:0 }}>
                                      <div style={{ color:'#fff',fontSize:11,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis' }}>{it.name}</div>
                                      <div style={{ color:C.textDim,fontSize:10 }}>{it.qty} × {it.price} ر.س</div>
                                    </div>
                                  </div>
                                ))}
                                {(o.items||[]).length>2&&<div style={{ fontSize:10,color:C.textDim,marginTop:3 }}>+{o.items.length-2} أخرى</div>}
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                                  <span style={{ color:C.gold,fontWeight:800,fontSize:16 }}>{Number(o.total||0).toLocaleString()} ر.س</span>
                                  <button type="button" onClick={()=>{setActDetailType('order');setActDetail(o)}} style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,background:'rgba(255,255,255,.06)',border:`1px solid ${C.border}`,color:C.textMuted,cursor:'pointer',fontSize:11,fontFamily:'inherit' }}>👁 التفاصيل</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>}
                      </>
                    )
                  )}
                </div>

                {/* ─ Fixed payment button ─ */}
                {cartTab==='unpaid' && totalUnpaidCount>0 && (
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'10px 14px', background:C.navyCard, borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
                    {/* Breakdown */}
                    {cart.length>0 && (unpaidBks.length+unpaidOrds.length)>0 && (
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.textDim, marginBottom:6 }}>
                        <span>منتجات: {cartTotal.toLocaleString()} ر.س</span>
                        <span>خدمات وطلبات: {actUnpaidTotal.toLocaleString()} ر.س</span>
                      </div>
                    )}
                    <div style={{ display:'flex', gap:8 }}>
                      {cart.length>0 && (
                        <button type="button" onClick={()=>{setCartOpen(false);setCoOpen(true);setCoName(authUser?.name||'');setCoPhone(authUser?.phone||activityPhone||'')}}
                          style={{ flex:1, padding:'11px 6px', borderRadius:11, border:`1px solid ${C.gold}55`, background:`${C.gold}15`, color:C.gold, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                          🛍️ منتجات ({cartTotal.toLocaleString()})
                        </button>
                      )}
                      {(unpaidBks.length+unpaidOrds.length)>0 && (
                        <button type="button" onClick={()=>setShowActPay(true)}
                          style={{ flex:2, padding:'11px 6px', borderRadius:11, border:'none', background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.navy, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                          💳 دفع الكل · {grandTotal.toLocaleString()} ر.س
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ─ Detail sub-modal ─ */}
                {actDetail && (
                  <div onClick={()=>setActDetail(null)} style={{ position:'fixed', inset:0, zIndex:1200, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
                    <div onClick={e=>e.stopPropagation()} style={{ background:C.navyCard, borderRadius:18, padding:22, maxWidth:400, width:'100%', border:`1px solid ${C.border}`, maxHeight:'85vh', overflowY:'auto' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                        <h3 style={{ color:'#fff', fontWeight:700, fontSize:15, margin:0 }}>{actDetailType==='booking'?'تفاصيل الخدمة':'تفاصيل الطلب'}</h3>
                        <button type="button" onClick={()=>setActDetail(null)} style={{ background:'rgba(255,255,255,.08)',border:'none',borderRadius:'50%',width:28,height:28,cursor:'pointer',color:C.textMuted,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
                      </div>
                      {actDetailType==='booking' ? (
                        <>
                          <div style={{ background:`${C.gold}0f`,border:`1px solid ${C.gold}33`,borderRadius:10,padding:'12px 14px',marginBottom:12 }}>
                            <div style={{ color:'#fff',fontWeight:800,fontSize:15,marginBottom:2 }}>{actDetail.service_name}</div>
                            {actDetail.staff_name&&<div style={{ color:C.textDim,fontSize:12 }}>👤 {actDetail.staff_name}</div>}
                          </div>
                          {[['📅 التاريخ',actDetail.date],['🕐 الوقت',`${actDetail.start_time?.slice(0,5)||''}${actDetail.end_time?` – ${actDetail.end_time.slice(0,5)}`:''}`],['🏢 الفرع',actDetail.branch_name||'—']].map(([l,v])=>(
                            <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:`1px solid ${C.border}` }}>
                              <span style={{ color:C.textDim,fontSize:12 }}>{l}</span>
                              <span style={{ color:'#fff',fontWeight:600,fontSize:13 }}>{v}</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          <div style={{ color:'#fff',fontWeight:800,fontSize:14,marginBottom:10 }}>طلب #{actDetail.id?.slice(-8).toUpperCase()}</div>
                          {(actDetail.items||[]).map((it:any,i:number)=>(
                            <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,.04)',borderRadius:9,padding:'9px 12px',marginBottom:6 }}>
                              <div><div style={{ color:'#fff',fontWeight:600,fontSize:12 }}>{it.name}</div><div style={{ fontSize:10,color:C.textDim }}>{it.qty} × {it.price} ر.س</div></div>
                              <span style={{ color:C.gold,fontWeight:700 }}>{(it.qty*it.price).toLocaleString()} ر.س</span>
                            </div>
                          ))}
                        </>
                      )}
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:12,borderTop:`2px solid ${C.gold}`,marginTop:8 }}>
                        <span style={{ color:C.textDim,fontWeight:600,fontSize:13 }}>الإجمالي</span>
                        <span style={{ color:C.gold,fontWeight:900,fontSize:20 }}>{Number(actDetail.total||actDetail.service_price||0).toLocaleString()} ر.س</span>
                      </div>
                      <Btn fullWidth onClick={()=>setActDetail(null)} style={{ marginTop:14,padding:'10px' }}>إغلاق</Btn>
                    </div>
                  </div>
                )}

                {/* ─ Payment modal ─ */}
                {showActPay && (
                  <div onClick={()=>{ setShowActPay(false); setActReceiptFile(null); setActReceiptPrev(null); setActReceiptErr('') }} style={{ position:'fixed', inset:0, zIndex:1200, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
                    <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:520, background:C.navyCard, borderRadius:'22px 22px 0 0', maxHeight:'92vh', overflowY:'auto', display:'flex', flexDirection:'column' }}>

                      {/* Header */}
                      <div style={{ padding:'18px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                        <div>
                          <h3 style={{ color:'#fff', fontWeight:800, fontSize:17, margin:0 }}>إتمام الدفع</h3>
                          <p style={{ color:C.textDim, fontSize:12, margin:'3px 0 0' }}>{unpaidBks.length + unpaidOrds.length} عنصر · {grandTotal.toLocaleString()} ر.س</p>
                        </div>
                        <button type="button" onClick={()=>{ setShowActPay(false); setActReceiptFile(null); setActReceiptPrev(null); setActReceiptErr('') }} style={{ background:'rgba(255,255,255,.08)', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', color:C.textMuted, display:'flex', alignItems:'center', justifyContent:'center' }}><X size={15}/></button>
                      </div>

                      {/* Summary */}
                      <div style={{ margin:'14px 20px 0', background:'rgba(255,255,255,.04)', borderRadius:12, padding:'10px 14px' }}>
                        {unpaidBks.map(b=><div key={b.id} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:`1px solid ${C.border}` }}><span style={{ color:C.textMuted }}>✂️ {b.service_name}</span><span style={{ color:C.gold, fontWeight:600 }}>{Number(b.total||b.service_price||0).toLocaleString()} ر.س</span></div>)}
                        {unpaidOrds.map(o=><div key={o.id} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:`1px solid ${C.border}` }}><span style={{ color:C.textMuted }}>📦 طلب #{o.id?.slice(-6).toUpperCase()}</span><span style={{ color:C.gold, fontWeight:600 }}>{Number(o.total||0).toLocaleString()} ر.س</span></div>)}
                        <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, marginTop:4 }}>
                          <span style={{ fontWeight:800, fontSize:14, color:'#fff' }}>الإجمالي</span>
                          <span style={{ fontWeight:900, fontSize:20, color:C.gold }}>{grandTotal.toLocaleString()} ر.س</span>
                        </div>
                      </div>

                      {/* Payment method tabs */}
                      <div style={{ display:'flex', margin:'16px 20px 0', gap:10 }}>
                        {([['transfer','🏦 تحويل بنكي'],['card','💳 بطاقة بنكية']] as const).map(([k,l])=>(
                          <button key={k} type="button" onClick={()=>setActPayMethod(k)}
                            style={{ flex:1, padding:'11px 8px', borderRadius:12, border:actPayMethod===k?`2px solid ${C.gold}`:`1px solid ${C.border}`, background:actPayMethod===k?`${C.gold}15`:'transparent', color:actPayMethod===k?C.gold:C.textMuted, fontWeight:actPayMethod===k?700:400, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all .2s' }}>
                            {l}
                          </button>
                        ))}
                      </div>

                      <div style={{ padding:'16px 20px 24px' }}>

                        {/* ══ تحويل بنكي ══ */}
                        {actPayMethod==='transfer' && <>
                          {/* IBAN */}
                          <div style={{ background:`${C.gold}0f`, border:`1px solid ${C.gold}33`, borderRadius:12, padding:'12px 14px', marginBottom:12 }}>
                            <div style={{ color:C.textDim, fontSize:11, marginBottom:5 }}>الآيبان — IBAN</div>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                              <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:800, color:'#fff', direction:'ltr', letterSpacing:2 }}>
                                {deptIbanShow ? deptBank.iban : deptBank.iban.slice(0,4)+' **** **** **** '+deptBank.iban.slice(-4)}
                              </span>
                              <div style={{ display:'flex', gap:5 }}>
                                <button type="button" onClick={()=>setDeptIbanShow(s=>!s)} style={{ background:'rgba(255,255,255,.08)', border:'none', borderRadius:7, padding:'4px 8px', cursor:'pointer', color:C.textMuted, fontSize:11 }}>{deptIbanShow?'🙈':'👁'}</button>
                                <button type="button" onClick={()=>{ navigator.clipboard.writeText(deptBank.iban).catch(()=>{}); setDeptIbanCopy(true); setTimeout(()=>setDeptIbanCopy(false),2000) }} style={{ background:deptIbanCopy?`${C.success}22`:`${C.gold}22`, border:`1px solid ${deptIbanCopy?C.success:C.gold}55`, borderRadius:7, padding:'4px 10px', cursor:'pointer', color:deptIbanCopy?C.success:C.gold, fontSize:11, fontWeight:700, fontFamily:'inherit' }}>
                                  {deptIbanCopy?'✓ تم':'📋 نسخ'}
                                </button>
                              </div>
                            </div>
                          </div>
                          {/* Bank details */}
                          {[['البنك',deptBank.bank_name],['المستفيد',deptBank.account_holder],['رقم الحساب',deptBank.account_number]].map(([l,v])=>(
                            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                              <span style={{ color:C.textDim, fontSize:12 }}>{l}</span>
                              <span style={{ color:'#fff', fontWeight:700, fontSize:13 }}>{v||'—'}</span>
                            </div>
                          ))}

                          {/* Receipt upload */}
                          <div style={{ marginTop:16, marginBottom:4 }}>
                            <label style={{ display:'block', color:C.textMuted, fontSize:12, fontWeight:600, marginBottom:8 }}>📎 رفع إيصال التحويل</label>
                            {actReceiptPrev
                              ? <div style={{ position:'relative', borderRadius:12, overflow:'hidden', border:`1px solid ${C.gold}44` }}>
                                  <img src={actReceiptPrev} alt="receipt" style={{ width:'100%', maxHeight:180, objectFit:'contain', background:'rgba(0,0,0,.3)' }} />
                                  <button type="button" onClick={()=>{ setActReceiptFile(null); setActReceiptPrev(null) }} style={{ position:'absolute', top:8, left:8, background:'rgba(0,0,0,.6)', border:'none', borderRadius:'50%', width:26, height:26, cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>✕</button>
                                </div>
                              : <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:'22px 16px', borderRadius:12, border:`2px dashed ${C.border}`, cursor:'pointer', transition:'border .2s' }}
                                  onMouseEnter={e=>e.currentTarget.style.borderColor=`${C.gold}55`}
                                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                                  <span style={{ fontSize:32 }}>📄</span>
                                  <span style={{ color:C.textMuted, fontSize:12, textAlign:'center' }}>اضغط لرفع صورة الإيصال<br/><span style={{ fontSize:10, color:C.textDim }}>JPG, PNG, PDF حتى 5 MB</span></span>
                                  <input type="file" accept="image/*,application/pdf" style={{ display:'none' }}
                                    onChange={e=>{ const f=e.target.files?.[0]; if(!f) return; if(f.size>5*1024*1024){ setActReceiptErr('الملف أكبر من 5 MB'); return } setActReceiptErr(''); setActReceiptFile(f); const r=new FileReader(); r.onload=ev=>setActReceiptPrev(ev.target?.result as string); r.readAsDataURL(f) }} />
                                </label>
                            }
                            {actReceiptErr && <p style={{ color:C.error, fontSize:11, marginTop:5 }}>{actReceiptErr}</p>}
                          </div>

                          <div style={{ background:`${C.gold}0a`, border:`1px solid ${C.gold}22`, borderRadius:9, padding:'9px 12px', margin:'12px 0', fontSize:11, color:C.textDim, lineHeight:1.7 }}>
                            ⚠️ قم بالتحويل أولاً ثم ارفع صورة الإيصال واضغط تأكيد.
                          </div>

                          <button type="button" disabled={actPayBusy} onClick={async()=>{
                            setActPayBusy(true)
                            try {
                              if (actReceiptFile) {
                                const fd = new FormData()
                                fd.append('file', actReceiptFile)
                                fd.append('customer_phone', activityPhone)
                                fd.append('amount', String(grandTotal))
                                fd.append('appointment_ids', JSON.stringify(unpaidBks.map(b=>String(b.id))))
                                await fetch('/api/public-transfer-receipt', { method:'POST', body:fd }).catch(()=>{})
                              }
                              doPayAll()
                            } catch { doPayAll() }
                            setActPayBusy(false)
                            setActReceiptFile(null); setActReceiptPrev(null)
                          }}
                            style={{ width:'100%', padding:'14px', borderRadius:13, border:'none', background:actPayBusy?'rgba(255,255,255,.1)':`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:actPayBusy?C.textDim:C.navy, fontWeight:800, fontSize:14, cursor:actPayBusy?'wait':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .2s', opacity:actPayBusy?.7:1 }}>
                            {actPayBusy ? '⏳ جاري الإرسال...' : `✓ تأكيد التحويل — ${grandTotal.toLocaleString()} ر.س`}
                          </button>
                        </>}

                        {/* ══ بطاقة بنكية ══ */}
                        {actPayMethod==='card' && <>
                          {/* Card preview */}
                          <div style={{ borderRadius:16, padding:'20px 22px', marginBottom:18, background:`linear-gradient(135deg,${C.navyLight} 0%,#1a3060 100%)`, border:`1px solid ${C.gold}33`, position:'relative', overflow:'hidden', minHeight:130 }}>
                            <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:`${C.gold}10` }} />
                            <div style={{ position:'absolute', bottom:-30, left:-10, width:100, height:100, borderRadius:'50%', background:`${C.gold}08` }} />
                            <div style={{ position:'relative' }}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                                <span style={{ color:C.gold, fontSize:13, fontWeight:700, letterSpacing:2 }}>GLAMOUR</span>
                                <span style={{ color:'#fff', fontSize:22, fontWeight:300 }}>VISA</span>
                              </div>
                              <div style={{ fontFamily:'monospace', fontSize:16, color:'#fff', letterSpacing:4, marginBottom:12 }}>
                                {actCardNum.replace(/(.{4})/g,'$1 ').trim() || '**** **** **** ****'}
                              </div>
                              <div style={{ display:'flex', gap:24 }}>
                                <div><div style={{ color:C.textDim, fontSize:9, marginBottom:2 }}>CARDHOLDER</div><div style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{actCardHolder||'— — — —'}</div></div>
                                <div><div style={{ color:C.textDim, fontSize:9, marginBottom:2 }}>EXPIRES</div><div style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{actCardExp||'MM/YY'}</div></div>
                              </div>
                            </div>
                          </div>

                          {/* Card form */}
                          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                            <div>
                              <label style={{ display:'block', color:C.textMuted, fontSize:11, fontWeight:600, marginBottom:5 }}>رقم البطاقة</label>
                              <input value={actCardNum} maxLength={19}
                                onChange={e=>setActCardNum(e.target.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim().slice(0,19))}
                                placeholder="0000 0000 0000 0000" dir="ltr"
                                style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1px solid ${C.border}`, background:C.navy, color:'#fff', fontSize:15, fontFamily:'monospace', letterSpacing:2, outline:'none', boxSizing:'border-box' }} />
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                              <div>
                                <label style={{ display:'block', color:C.textMuted, fontSize:11, fontWeight:600, marginBottom:5 }}>تاريخ الانتهاء</label>
                                <input value={actCardExp} maxLength={5}
                                  onChange={e=>{ let v=e.target.value.replace(/\D/g,''); if(v.length>=3) v=v.slice(0,2)+'/'+v.slice(2,4); setActCardExp(v) }}
                                  placeholder="MM/YY" dir="ltr"
                                  style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1px solid ${C.border}`, background:C.navy, color:'#fff', fontSize:14, fontFamily:'monospace', outline:'none', boxSizing:'border-box' }} />
                              </div>
                              <div>
                                <label style={{ display:'block', color:C.textMuted, fontSize:11, fontWeight:600, marginBottom:5 }}>CVV</label>
                                <input value={actCardCvv} maxLength={4} type="password"
                                  onChange={e=>setActCardCvv(e.target.value.replace(/\D/g,'').slice(0,4))}
                                  placeholder="•••"
                                  style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1px solid ${C.border}`, background:C.navy, color:'#fff', fontSize:14, fontFamily:'monospace', outline:'none', boxSizing:'border-box' }} />
                              </div>
                            </div>
                            <div>
                              <label style={{ display:'block', color:C.textMuted, fontSize:11, fontWeight:600, marginBottom:5 }}>اسم حامل البطاقة</label>
                              <input value={actCardHolder} onChange={e=>setActCardHolder(e.target.value.toUpperCase())} placeholder="MOHAMMED ALI" dir="ltr"
                                style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1px solid ${C.border}`, background:C.navy, color:'#fff', fontSize:13, fontFamily:'monospace', letterSpacing:1, outline:'none', boxSizing:'border-box' }} />
                            </div>
                          </div>

                          <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:9, padding:'9px 12px', margin:'14px 0', fontSize:11, color:'rgba(34,197,94,0.9)', lineHeight:1.7, display:'flex', alignItems:'center', gap:8 }}>
                            🔒 معلوماتك محمية بتشفير SSL 256-bit
                          </div>

                          <button type="button"
                            disabled={actPayBusy || actCardNum.replace(/\s/g,'').length < 16 || actCardExp.length < 5 || actCardCvv.length < 3 || !actCardHolder}
                            onClick={async()=>{
                              setActPayBusy(true)
                              await new Promise(r=>setTimeout(r,1400))
                              doPayAll()
                              setActPayBusy(false)
                              setActCardNum(''); setActCardExp(''); setActCardCvv(''); setActCardHolder('')
                            }}
                            style={{ width:'100%', padding:'14px', borderRadius:13, border:'none', background:`linear-gradient(135deg,#1a56db,#2f7bff)`, color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:(actPayBusy||actCardNum.replace(/\s/g,'').length<16||actCardExp.length<5||actCardCvv.length<3||!actCardHolder)?.5:1, transition:'opacity .2s' }}>
                            {actPayBusy ? '⏳ جاري المعالجة...' : `💳 ادفع الآن — ${grandTotal.toLocaleString()} ر.س`}
                          </button>
                        </>}

                      </div>
                    </div>
                  </div>
                )}
              </>
              )
            })()}
          </div>
        </div>
      )}

      {/* ── Payment Modal for Activity Orders ── */}
      {payOrder && (
        <div onClick={()=>setPayOrder(null)} style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.navyCard, borderRadius:18, padding:24, maxWidth:420, width:'100%', border:`1px solid ${C.border}`, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ color:'#fff', fontWeight:700, fontSize:16, margin:0 }}>💳 إتمام الدفع</h3>
              <button type="button" onClick={()=>setPayOrder(null)} style={{ background:'rgba(255,255,255,.08)', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', color:C.textMuted, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            {/* Order summary */}
            <div style={{ background:'rgba(255,255,255,.04)', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
              <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>طلب #{payOrder.id?.slice(-8).toUpperCase()}</div>
              <div style={{ color:C.gold, fontWeight:900, fontSize:20, marginTop:4 }}>{payOrder.total} ر.س</div>
            </div>
            {/* IBAN */}
            <div style={{ background:`${C.gold}0f`, border:`1px solid ${C.gold}33`, borderRadius:12, padding:'14px 16px', marginBottom:14 }}>
              <div style={{ color:C.textDim, fontSize:11, marginBottom:6 }}>الآيبان — IBAN</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:800, color:'#fff', direction:'ltr', letterSpacing:2 }}>
                  {deptIbanShow ? deptBank.iban : deptBank.iban.slice(0,4)+' **** **** **** '+deptBank.iban.slice(-4)}
                </span>
                <div style={{ display:'flex', gap:6 }}>
                  <button type="button" onClick={()=>setDeptIbanShow(s=>!s)} style={{ background:'rgba(255,255,255,.08)', border:'none', borderRadius:7, padding:'5px 9px', cursor:'pointer', color:C.textMuted, fontSize:12 }}>{deptIbanShow?'🙈':'👁'}</button>
                  <button type="button" onClick={()=>{navigator.clipboard.writeText(deptBank.iban).catch(()=>{}); setDeptIbanCopy(true); setTimeout(()=>setDeptIbanCopy(false),2000)}}
                    style={{ background:deptIbanCopy?`${C.success}22`:`${C.gold}22`, border:`1px solid ${deptIbanCopy?C.success:C.gold}55`, borderRadius:7, padding:'5px 12px', cursor:'pointer', color:deptIbanCopy?C.success:C.gold, fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                    {deptIbanCopy?'✓ تم':'📋 نسخ'}
                  </button>
                </div>
              </div>
            </div>
            {/* Bank details */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
              {[['البنك', deptBank.bank_name], ['المستفيد', deptBank.account_holder], ['رقم الحساب', deptBank.account_number]].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ color:C.textDim, fontSize:12 }}>{l}</span>
                  <span style={{ color:'#fff', fontWeight:700, fontSize:13 }}>{v||'—'}</span>
                </div>
              ))}
            </div>
            <div style={{ background:`${C.gold}0a`, border:`1px solid ${C.gold}22`, borderRadius:10, padding:'10px 12px', marginBottom:16, fontSize:11, color:C.textDim, lineHeight:1.7 }}>
              ⚠️ بعد إتمام التحويل أغلق هذه النافذة وسيتم التحقق من دفعتك خلال دقائق.
            </div>
            <Btn fullWidth onClick={()=>setPayOrder(null)} style={{ padding:'12px' }}>أغلق</Btn>
          </div>
        </div>
      )}


      {/* ── Checkout ── */}
      {coOpen && !coDone && (
        <Modal onClose={()=>setCoOpen(false)} title="إتمام الطلب">
          <div style={{ marginBottom:14 }}>
            {cart.map(item=>(
              <div key={item.product.id} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${C.border}`, fontSize:12 }}>
                <span style={{ color:C.text }}>{item.product.name_ar} × {item.qty}</span>
                <span style={{ color:C.gold, fontWeight:600 }}>{item.product.price*item.qty} ر.س</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', fontSize:14 }}>
              <span style={{ color:'#fff', fontWeight:700 }}>المجموع</span>
              <span style={{ color:C.gold, fontWeight:800 }}>{cartTotal} ر.س</span>
            </div>
          </div>
          <Field label="الاسم *" value={coName} onChange={setCoName} />
          <Field label="رقم الجوال *" value={coPhone} onChange={setCoPhone} type="tel" placeholder="05XXXXXXXX" />
          <Field label="العنوان (اختياري)" value={coAddr} onChange={setCoAddr} />

          {/* Payment method */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', color:C.textMuted, fontSize:13, marginBottom:8, fontWeight:600 }}>طريقة الدفع</label>
            <div style={{ display:'flex', gap:7, marginBottom:14 }}>
              {([['bank_transfer','🏦 حوالة بنكية'],['cod','💵 عند الاستلام']] as const).map(([v,l])=>(
                <button key={v} type="button" onClick={()=>setCoPay(v)}
                  style={{ flex:1, padding:'9px 8px', borderRadius:10, border:`1px solid ${coPay===v?C.gold:C.border}`, background:coPay===v?`${C.gold}15`:'transparent', color:coPay===v?C.gold:C.textMuted, cursor:'pointer', fontSize:12, fontWeight:coPay===v?700:400, fontFamily:'inherit', whiteSpace:'nowrap' }}>
                  {l}
                </button>
              ))}
            </div>

            {coPay==='bank_transfer'&&(
              <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:14, border:`1px solid ${C.border}` }}>
                <div style={{ background:`${C.gold}0f`, border:`1px solid ${C.gold}33`, borderRadius:10, padding:'11px 14px', marginBottom:12 }}>
                  <div style={{ color:C.textDim, fontSize:11, marginBottom:4 }}>الآيبان — IBAN</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:800, color:'#fff', direction:'ltr', letterSpacing:2 }}>
                      {deptIbanShow ? deptBank.iban : deptBank.iban.slice(0,4)+' **** **** **** '+deptBank.iban.slice(-4)}
                    </span>
                    <div style={{ display:'flex', gap:6 }}>
                      <button type="button" onClick={()=>setDeptIbanShow(s=>!s)} style={{ background:'rgba(255,255,255,.08)', border:'none', borderRadius:7, padding:'4px 8px', cursor:'pointer', color:C.textMuted, fontSize:11 }}>
                        {deptIbanShow?'🙈':'👁'}
                      </button>
                      <button type="button" onClick={()=>{navigator.clipboard.writeText(deptBank.iban).catch(()=>{}); setDeptIbanCopy(true); setTimeout(()=>setDeptIbanCopy(false),2000)}}
                        style={{ background:deptIbanCopy?`${C.success}22`:`${C.gold}22`, border:`1px solid ${deptIbanCopy?C.success:C.gold}55`, borderRadius:7, padding:'4px 10px', cursor:'pointer', color:deptIbanCopy?C.success:C.gold, fontSize:11, fontWeight:700, fontFamily:'inherit' }}>
                        {deptIbanCopy?'✓ تم':'📋 نسخ'}
                      </button>
                    </div>
                  </div>
                </div>
                {[['البنك',deptBank.bank_name],['المستفيد',deptBank.account_holder],['رقم الحساب',deptBank.account_number]].map(([l,v])=>(
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ color:C.textDim, fontSize:12 }}>{l}</span>
                    <span style={{ color:'#fff', fontWeight:700, fontSize:12 }}>{v||'—'}</span>
                  </div>
                ))}
                <div style={{ background:`${C.gold}0a`, border:`1px solid ${C.gold}22`, borderRadius:8, padding:'9px 12px', marginTop:12, fontSize:11, color:C.textDim, lineHeight:1.7 }}>
                  ⚠️ بعد إتمام التحويل اضغط "تأكيد الطلب" وسيتم التحقق من دفعتك.
                </div>
              </div>
            )}

            {coPay==='cod'&&(
              <div style={{ background:'rgba(255,255,255,.04)', border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px', color:C.textDim, fontSize:12, lineHeight:1.7 }}>
                💵 سيتم الدفع نقداً عند استلام الطلب أو الزيارة.
              </div>
            )}
          </div>
          <Btn fullWidth onClick={submitOrder} disabled={coBusy} style={{ padding:'13px' }}>
            {coBusy?'جارٍ...':'تأكيد الطلب — '+cartTotal+' ر.س'}
          </Btn>
        </Modal>
      )}
      {coDone && (
        <Modal onClose={()=>{setCoOpen(false);setCoDone(false)}} title="تم الطلب ✓">
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ width:58,height:58,borderRadius:'50%',background:`${C.success}22`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',fontSize:24 }}>✅</div>
            <p style={{ color:C.gold, fontWeight:700, fontSize:15, marginBottom:14 }}>سنتواصل معك قريباً</p>
            <div style={{ padding:10,background:`${C.gold}0a`,borderRadius:10,border:`1px solid ${C.gold}22`,color:C.textDim,fontSize:12 }}>رقم الطلب: {coId||'OR'+Date.now().toString(36).toUpperCase()}</div>
            <Btn onClick={()=>{setCoOpen(false);setCoDone(false)}} style={{ marginTop:18 }}>تم</Btn>
          </div>
        </Modal>
      )}
      {/* Confirm Dialog */}
      {confirmDlg2 && (
        <div style={{ position:'fixed', inset:0, zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={()=>setConfirmDlg2(null)}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)' }} />
          <div onClick={e=>e.stopPropagation()} style={{ position:'relative', background:C.navyCard, borderRadius:22, padding:'28px 26px', maxWidth:380, width:'100%', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 24px 64px rgba(0,0,0,0.5)', animation:'mi .25s ease' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(239,68,68,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:28 }}>{'⚠️'}</div>
            <h3 style={{ color:'#fff', fontSize:17, fontWeight:700, textAlign:'center', marginBottom:8 }}>{confirmDlg2.msg}</h3>
            {confirmDlg2.sub && <p style={{ color:C.textMuted, fontSize:13, textAlign:'center', lineHeight:1.7, marginBottom:22 }}>{confirmDlg2.sub}</p>}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setConfirmDlg2(null)} style={{ flex:1, padding:'12px', borderRadius:12, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.06)', color:C.textMuted, cursor:'pointer', fontSize:14, fontFamily:'inherit', fontWeight:500 }}>إلغاء الأمر</button>
              <button onClick={()=>{ const fn=confirmDlg2.onOk; setConfirmDlg2(null); fn() }} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:C.error, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14, fontFamily:'inherit' }}>{confirmDlg2.label||'تأكيد'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
