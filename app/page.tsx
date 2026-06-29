'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useLang } from '@/app/layout'
import { t } from '@/lib/translations'
import {
  TrendingUp, Calendar, Users, UserCheck, Star, Plus, Package,
  DollarSign, Clock, ArrowUpRight, ShoppingBag, RefreshCw,
  ChevronUp, ChevronDown, Scissors, Smile, Shield, Bell,
  PieChart, BarChart3, Activity, Target, Award, Gift,
  AlertTriangle, CheckCircle, XCircle, HelpCircle,
  Sparkles, Zap, Heart, ThumbsUp, MessageSquare,
  LogIn, Fingerprint, Monitor, Lock, FileText,
  ArrowRight, ArrowLeft, UserPlus, CalendarPlus,
  Megaphone, FileSpreadsheet, Phone, Mail, MapPin,
  Briefcase, Clock3, Sun, Moon, Palette, Globe,
  Settings, Eye, EyeOff, Search, Filter, Layers,
} from 'lucide-react'
import Link from 'next/link'
import ChartWrapper from '@/components/ChartWrapper'

// ─── Recharts ──────────────────────────────────────────────
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
  BarChart, Bar, Legend, LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'

// ─── Constants ─────────────────────────────────────────────
const AVATAR_COLORS = ['#C9A55F','#4F8A63','#2563EB','#8B5CF6','#EC4899','#F59E0B','#10B981','#6366F1','#EF4444','#14B8A6']

function useThemeColors() {
  const [colors, setColors] = useState({ GOLD: '#C9A55F', GOLD_LIGHT: '#DEBF7A', CHART_COLORS: ['#C9A55F','#DEBF7A','#A8884E','#F59E0B','#10B981','#6366F1','#EC4899','#3B82F6'] })
  useEffect(() => {
    const resolve = () => {
      const cs = getComputedStyle(document.documentElement)
      const p = cs.getPropertyValue('--primary-500').trim() || '#C9A55F'
      const pl = cs.getPropertyValue('--primary-300').trim() || '#DEBF7A'
      const pd = cs.getPropertyValue('--primary-700').trim() || '#A8884E'
      setColors({ GOLD: p, GOLD_LIGHT: pl, CHART_COLORS: [p, pl, pd, '#F59E0B','#10B981','#6366F1','#EC4899','#3B82F6'] })
    }
    resolve()
    const obs = new MutationObserver(resolve)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-mode', 'style'] })
    return () => obs.disconnect()
  }, [])
  return colors
}
const STATUS_COLORS: Record<string, string> = {
  completed: '#10B981', confirmed: '#3B82F6', pending: '#F59E0B',
  cancelled: '#EF4444', in_progress: '#8B5CF6', no_show: '#6B7280',
}

// ─── Mock Data ──────────────────────────────────────────────
const MOCK_REVENUE = [
  { month: 'يناير', monthEn: 'Jan', revenue: 28500, appointments: 142, target: 25000 },
  { month: 'فبراير', monthEn: 'Feb', revenue: 32000, appointments: 158, target: 26000 },
  { month: 'مارس', monthEn: 'Mar', revenue: 29800, appointments: 151, target: 27000 },
  { month: 'أبريل', monthEn: 'Apr', revenue: 35600, appointments: 175, target: 28000 },
  { month: 'مايو', monthEn: 'May', revenue: 38900, appointments: 192, target: 30000 },
  { month: 'يونيو', monthEn: 'Jun', revenue: 42300, appointments: 210, target: 32000 },
  { month: 'يوليو', monthEn: 'Jul', revenue: 45800, appointments: 228, target: 35000 },
  { month: 'أغسطس', monthEn: 'Aug', revenue: 47200, appointments: 235, target: 36000 },
]

const MOCK_STATUS = [
  { name: 'مكتمل', nameEn: 'Completed', value: 185, color: '#10B981' },
  { name: 'مؤكد', nameEn: 'Confirmed', value: 95, color: '#3B82F6' },
  { name: 'معلق', nameEn: 'Pending', value: 42, color: '#F59E0B' },
  { name: 'ملغى', nameEn: 'Cancelled', value: 18, color: '#EF4444' },
  { name: 'جارٍ', nameEn: 'In Progress', value: 28, color: '#8B5CF6' },
]

const MOCK_SERVICES = [
  { name: 'قص شعر رجالي', nameEn: 'Men\'s Haircut', bookings: 245, revenue: 36750 },
  { name: 'صبغ شعر', nameEn: 'Hair Coloring', bookings: 189, revenue: 47250 },
  { name: 'عناية بالبشرة', nameEn: 'Facial', bookings: 156, revenue: 23400 },
  { name: 'مانيكير', nameEn: 'Manicure', bookings: 134, revenue: 13400 },
  { name: 'حلاقة كاملة', nameEn: 'Full Shave', bookings: 112, revenue: 11200 },
  { name: 'مكياج', nameEn: 'Makeup', bookings: 98, revenue: 19600 },
]

const MOCK_GROWTH = [
  { month: 'يناير', monthEn: 'Jan', new: 45, returning: 120, total: 165 },
  { month: 'فبراير', monthEn: 'Feb', new: 52, returning: 138, total: 190 },
  { month: 'مارس', monthEn: 'Mar', new: 48, returning: 145, total: 193 },
  { month: 'أبريل', monthEn: 'Apr', new: 63, returning: 162, total: 225 },
  { month: 'مايو', monthEn: 'May', new: 58, returning: 178, total: 236 },
  { month: 'يونيو', monthEn: 'Jun', new: 72, returning: 195, total: 267 },
  { month: 'يوليو', monthEn: 'Jul', new: 81, returning: 210, total: 291 },
  { month: 'أغسطس', monthEn: 'Aug', new: 68, returning: 225, total: 293 },
]

const MOCK_BRANCHES = [
  { name: 'الفرع الرئيسي', nameEn: 'Main', revenue: 142000, customers: 856, rating: 4.8 },
  { name: 'فرع النخيل', nameEn: 'Nakheel', revenue: 98000, customers: 623, rating: 4.6 },
  { name: 'فرع الروضة', nameEn: 'Rawdah', revenue: 76500, customers: 498, rating: 4.7 },
  { name: 'فرع العليا', nameEn: 'Olaya', revenue: 124000, customers: 745, rating: 4.9 },
]

const MOCK_PEAK_HOURS = [
  { hour: '9ص', hourEn: '9AM', bookings: 8 },
  { hour: '10ص', hourEn: '10AM', bookings: 15 },
  { hour: '11ص', hourEn: '11AM', bookings: 22 },
  { hour: '12م', hourEn: '12PM', bookings: 28 },
  { hour: '1م', hourEn: '1PM', bookings: 18 },
  { hour: '2م', hourEn: '2PM', bookings: 12 },
  { hour: '3م', hourEn: '3PM', bookings: 20 },
  { hour: '4م', hourEn: '4PM', bookings: 32 },
  { hour: '5م', hourEn: '5PM', bookings: 38 },
  { hour: '6م', hourEn: '6PM', bookings: 42 },
  { hour: '7م', hourEn: '7PM', bookings: 35 },
  { hour: '8م', hourEn: '8PM', bookings: 25 },
  { hour: '9م', hourEn: '9PM', bookings: 14 },
]

const MOCK_STAFF = [
  { id: 1, name: 'أحمد محمد', nameEn: 'Ahmed Mohammed', role: 'حلاق', roleEn: 'Barber', rating: 4.9, completed: 182, attendance: 98, commission: 12400, image: null },
  { id: 2, name: 'سارة علي', nameEn: 'Sara Ali', role: 'أخصائية تجميل', roleEn: 'Beautician', rating: 4.8, completed: 156, attendance: 96, commission: 11200, image: null },
  { id: 3, name: 'خالد عمر', nameEn: 'Khaled Omar', role: 'حلاق', roleEn: 'Barber', rating: 4.7, completed: 145, attendance: 95, commission: 9800, image: null },
  { id: 4, name: 'نورة عبدالله', nameEn: 'Noura Abdullah', role: 'أخصائية بشرة', roleEn: 'Skin Specialist', rating: 4.9, completed: 134, attendance: 99, commission: 15600, image: null },
  { id: 5, name: 'فيصل حسن', nameEn: 'Faisal Hassan', role: 'حلاق', roleEn: 'Barber', rating: 4.6, completed: 128, attendance: 93, commission: 8700, image: null },
]

const MOCK_APPOINTMENTS_TODAY = [
  { id: 1, time: '09:00', customer: 'أحمد الشمري', customerEn: 'Ahmed Al-Shammari', service: 'قص شعر', serviceEn: 'Haircut', status: 'completed', staff: 'أحمد محمد', staffEn: 'Ahmed M.' },
  { id: 2, time: '10:30', customer: 'نورة القحطاني', customerEn: 'Noura Al-Qahtani', service: 'صبغ شعر', serviceEn: 'Hair Coloring', status: 'in_progress', staff: 'سارة علي', staffEn: 'Sara A.' },
  { id: 3, time: '11:00', customer: 'فهد العتيبي', customerEn: 'Fahad Al-Otaibi', service: 'حلاقة كاملة', serviceEn: 'Full Shave', status: 'confirmed', staff: 'خالد عمر', staffEn: 'Khaled O.' },
  { id: 4, time: '12:30', customer: 'هند الدوسري', customerEn: 'Hind Al-Dosari', service: 'عناية بالبشرة', serviceEn: 'Facial', status: 'confirmed', staff: 'نورة عبدالله', staffEn: 'Noura A.' },
  { id: 5, time: '14:00', customer: 'سعود الرشيد', customerEn: 'Saud Al-Rashid', service: 'قص شعر', serviceEn: 'Haircut', status: 'pending', staff: 'فيصل حسن', staffEn: 'Faisal H.' },
  { id: 6, time: '15:30', customer: 'لينا الحربي', customerEn: 'Lina Al-Harbi', service: 'مكياج', serviceEn: 'Makeup', status: 'pending', staff: 'سارة علي', staffEn: 'Sara A.' },
  { id: 7, time: '16:00', customer: 'عبدالله السالم', customerEn: 'Abdullah Al-Salem', service: 'قص شعر', serviceEn: 'Haircut', status: 'confirmed', staff: 'أحمد محمد', staffEn: 'Ahmed M.' },
]

const MOCK_VIP = [
  { id: 1, name: 'هند الدوسري', nameEn: 'Hind Al-Dosari', visits: 48, spent: 28500, points: 2850, tier: 'بلاتينيوم', tierEn: 'Platinum' },
  { id: 2, name: 'نورة القحطاني', nameEn: 'Noura Al-Qahtani', visits: 36, spent: 22100, points: 2210, tier: 'ذهب', tierEn: 'Gold' },
  { id: 3, name: 'أحمد الشمري', nameEn: 'Ahmed Al-Shammari', visits: 42, spent: 19300, points: 1930, tier: 'ذهب', tierEn: 'Gold' },
  { id: 4, name: 'فهد العتيبي', nameEn: 'Fahad Al-Otaibi', visits: 28, spent: 14200, points: 1420, tier: 'فضة', tierEn: 'Silver' },
  { id: 5, name: 'سعد المطيري', nameEn: 'Saad Al-Mutairi', visits: 31, spent: 16800, points: 1680, tier: 'ذهب', tierEn: 'Gold' },
]

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'booking', messageAr: 'حجز جديد من أحمد الشمري - قص شعر', messageEn: 'New booking from Ahmed Al-Shammari - Haircut', time: '5 دقائق', timeEn: '5 min ago', read: false },
  { id: 2, type: 'reminder', messageAr: 'تذكير: موعد نورة القحطاني بعد 30 دقيقة', messageEn: 'Reminder: Noura Al-Qahtani in 30 min', time: '15 دقيقة', timeEn: '15 min ago', read: false },
  { id: 3, type: 'staff', messageAr: 'تسجيل دخول - خالد عمر الساعة 8:45 ص', messageEn: 'Check-in - Khaled Omar at 8:45 AM', time: 'ساعة', timeEn: '1 hour ago', read: false },
  { id: 4, type: 'system', messageAr: 'تم تحديث النظام إلى الإصدار 2.5.0', messageEn: 'System updated to v2.5.0', time: 'ساعتين', timeEn: '2 hours ago', read: true },
  { id: 5, type: 'booking', messageAr: 'إلغاء حجز - سعود الرشيد الساعة 2:00 م', messageEn: 'Cancellation - Saud Al-Rashid at 2:00 PM', time: '3 ساعات', timeEn: '3 hours ago', read: true },
]

const MOCK_SECURITY = {
  loginActivity: [
    { date: 'الاثنين', dateEn: 'Mon', success: 12, failed: 2 },
    { date: 'الثلاثاء', dateEn: 'Tue', success: 15, failed: 1 },
    { date: 'الأربعاء', dateEn: 'Wed', success: 10, failed: 3 },
    { date: 'الخميس', dateEn: 'Thu', success: 18, failed: 0 },
    { date: 'الجمعة', dateEn: 'Fri', success: 8, failed: 1 },
    { date: 'السبت', dateEn: 'Sat', success: 14, failed: 2 },
    { date: 'الأحد', dateEn: 'Sun', success: 20, failed: 4 },
  ],
  activeSessions: 12,
  totalUsers: 18,
  failedToday: 4,
}

// ─── Shared Components ──────────────────────────────────────

function AnimatedCounter({ value, suffix = '', duration = 1200 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const startTime = useRef(0)
  const frame = useRef(0)
  useEffect(() => {
    startTime.current = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) frame.current = requestAnimationFrame(animate)
    }
    frame.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame.current)
  }, [value, duration])
  return <>{display.toLocaleString()}{suffix}</>
}

function AvatarLetter({ name, index = 0, size = 32 }: { name: string; index?: number; size?: number }) {
  const letter = (name || '?').charAt(0).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: AVATAR_COLORS[index % AVATAR_COLORS.length],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
    }}>{letter}</div>
  )
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`status-pill ${status}`}>
      <span className="dot" />
      {status === 'completed' ? 'مكتمل' : status === 'confirmed' ? 'مؤكد' : status === 'pending' ? 'معلق' : status === 'cancelled' ? 'ملغى' : status === 'in_progress' ? 'جارٍ' : 'لم يحضر'}
    </span>
  )
}

function StatusPillEn({ status }: { status: string }) {
  const labels: Record<string, string> = { completed: 'Completed', confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled', in_progress: 'In Progress', no_show: 'No Show' }
  return (
    <span className={`status-pill ${status}`}>
      <span className="dot" />
      {labels[status] || status}
    </span>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color || 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  )
}

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="section-title">
      <span className="accent" />
      <Icon size={16} style={{ color: 'var(--primary)' }} />
      {label}
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────

export default function Dashboard() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const { GOLD, GOLD_LIGHT, CHART_COLORS } = useThemeColors()
  const [data, setData] = useState<any>(null)
  const [deptInfo, setDeptInfo] = useState({ total: 0, topName: '', topRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, deptRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/departments'),
      ])
      const d = await dRes.json()
      const depts = deptRes.ok ? (await deptRes.json()) : []
      const active = Array.isArray(depts) ? depts.filter((x: any) => x.is_active) : []
      setData(d)
      // Find top department by employee+service count
      let top = active[0] || {}
      active.forEach((x: any) => {
        if ((x.employee_count + x.service_count) > ((top.employee_count || 0) + (top.service_count || 0))) top = x
      })
      setDeptInfo({ total: active.length, topName: top.name_ar || '', topRevenue: top.employee_count || 0 })
    } catch {}
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const stats = data?.stats || {}
  const lowStock = data?.stockAlerts || []
  const recent = data?.recentAppointments || []
  const topServices = data?.topServices || []
  const maxRevenue = Math.max(...topServices.map((x: any) => Number(x.revenue)), 1)

  // ─── Normalize API data → chart shape (MOCK as fallback) ──────────────
  const ARABIC_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  const EN_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const revenueTrendData = (() => {
    const rows = data?.revenueTrend
    if (!rows?.length) return MOCK_REVENUE
    return rows.map((r: any) => {
      const idx = parseInt(r.month_key.split('-')[1]) - 1
      return { month: ARABIC_MONTHS[idx], monthEn: EN_MONTHS[idx], revenue: Number(r.revenue), appointments: Number(r.appointments), target: 0 }
    })
  })()

  const STATUS_MAP: Record<string, { ar: string; en: string; color: string }> = {
    completed:   { ar: 'مكتمل',    en: 'Completed',   color: '#10B981' },
    confirmed:   { ar: 'مؤكد',     en: 'Confirmed',   color: '#3B82F6' },
    pending:     { ar: 'معلق',     en: 'Pending',     color: '#F59E0B' },
    cancelled:   { ar: 'ملغى',     en: 'Cancelled',   color: '#EF4444' },
    in_progress: { ar: 'جارٍ',     en: 'In Progress', color: '#8B5CF6' },
    no_show:     { ar: 'لم يحضر', en: 'No Show',     color: '#6B7280' },
  }

  const apptStatusData = (() => {
    const rows = data?.appointmentStatus
    if (!rows?.length) return MOCK_STATUS
    return rows.map((r: any) => ({
      name:   STATUS_MAP[r.status]?.ar    || r.status,
      nameEn: STATUS_MAP[r.status]?.en    || r.status,
      value:  Number(r.value),
      color:  STATUS_MAP[r.status]?.color || '#9CA3AF',
    }))
  })()

  const customerGrowthData = (() => {
    const rows = data?.customerGrowth
    if (!rows?.length) return MOCK_GROWTH
    return rows.map((r: any) => {
      const idx = parseInt(r.month_key.split('-')[1]) - 1
      return { month: ARABIC_MONTHS[idx], monthEn: EN_MONTHS[idx], new: Number(r.new), returning: Number(r.returning), total: Number(r.new) + Number(r.returning) }
    })
  })()

  const peakHoursData = (() => {
    const rows = data?.peakHours
    if (!rows?.length) return MOCK_PEAK_HOURS
    return rows.map((r: any) => {
      const h = Number(r.hour)
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      return { hour: `${h12}${h < 12 ? 'ص' : 'م'}`, hourEn: `${h12}${h < 12 ? 'AM' : 'PM'}`, bookings: Number(r.bookings) }
    })
  })()

  const todayApptsData = (() => {
    const rows = data?.todayAppointments
    if (!rows?.length) return MOCK_APPOINTMENTS_TODAY
    return rows.map((r: any, i: number) => ({
      id: i + 1, time: r.time,
      customer: r.customer, customerEn: r.customer,
      service: r.service, serviceEn: r.service,
      status: r.status,
      staff: r.staff, staffEn: r.staff,
    }))
  })()

  const staffPerfData = (() => {
    const rows = data?.staffPerformance
    if (!rows?.length) return MOCK_STAFF
    return rows.map((r: any, i: number) => ({
      id: i + 1, name: r.name, nameEn: r.name,
      role: r.role || 'موظف', roleEn: r.role || 'Staff',
      rating: Number(r.rating), completed: Number(r.completed),
      attendance: 95, commission: Number(r.commission), image: null,
    }))
  })()

  const vipData = (() => {
    const rows = data?.vipCustomers
    if (!rows?.length) return MOCK_VIP
    return rows.map((r: any, i: number) => {
      const spent = Number(r.spent)
      const tier = spent >= 20000 ? { ar: 'بلاتينيوم', en: 'Platinum' } : spent >= 10000 ? { ar: 'ذهب', en: 'Gold' } : { ar: 'فضة', en: 'Silver' }
      return { id: i + 1, name: r.name, nameEn: r.name, visits: Number(r.visits), spent, points: Math.round(spent / 10), tier: tier.ar, tierEn: tier.en }
    })
  })()

  const notifsData = (() => {
    const rows = data?.notifications
    if (!rows?.length) return MOCK_NOTIFICATIONS
    return rows.map((r: any, i: number) => ({
      id: i + 1, type: r.type,
      messageAr: r.body_ar, messageEn: r.body_ar,
      time:   r.created_at ? new Date(r.created_at).toLocaleTimeString('ar-SA',  { hour: '2-digit', minute: '2-digit' }) : '',
      timeEn: r.created_at ? new Date(r.created_at).toLocaleTimeString('en-US',  { hour: '2-digit', minute: '2-digit' }) : '',
      read: r.is_read,
    }))
  })()

  const topServicesNorm = (() => {
    if (!topServices.length) return MOCK_SERVICES
    return topServices.map((r: any) => ({ name: r.name_ar, nameEn: r.name_ar, bookings: Number(r.bookings), revenue: Number(r.revenue) }))
  })()

  // ─── Stat Cards Data ──────────────────────────────────────
  const premiumStats = [
    { label: isAr ? 'إجمالي الإيرادات' : 'Total Revenue', value: Number(stats.monthly_revenue || 42300), icon: DollarSign, change: '+12.5%', up: true, color: GOLD, period: 'هذا الشهر' },
    { label: isAr ? 'عملاء اليوم' : "Today's Customers", value: Number(stats.today_appointments || 28), icon: Users, change: '+8.2%', up: true, color: '#10B981', period: isAr ? 'مقارنة بالأمس' : 'vs yesterday' },
    { label: isAr ? 'الخدمات المكتملة' : 'Services Done', value: Number(stats.completed_services || 156), icon: Scissors, change: '+15.3%', up: true, color: GOLD, period: isAr ? 'هذا الأسبوع' : 'this week' },
    { label: isAr ? 'رضا العملاء' : 'Satisfaction', value: 96, icon: Smile, change: '4.8 ★', up: true, color: '#8B5CF6', period: isAr ? 'متوسط التقييم' : 'avg rating', suffix: '%' },
    { label: isAr ? 'الحجوزات المعلقة' : 'Pending', value: Number(stats.pending_appointments || 12), icon: Clock, change: '-3', up: false, color: '#F59E0B', period: isAr ? 'في انتظار التأكيد' : 'awaiting confirmation' },
    { label: isAr ? 'نقاط الولاء' : 'Loyalty Pts', value: 4820, icon: Gift, change: '+22%', up: true, color: '#EC4899', period: isAr ? 'هذا الشهر' : 'this month' },
    { label: isAr ? 'حضور الموظفين' : 'Attendance', value: 97, icon: UserCheck, change: '+2.1%', up: true, color: '#14B8A6', period: isAr ? 'معدل اليوم' : "today's rate", suffix: '%' },
    { label: isAr ? 'الأقسام النشطة' : 'Active Depts', value: deptInfo.total, icon: Layers, change: deptInfo.topName || (isAr ? '—' : '—'), up: true, color: '#6366F1', period: isAr ? 'إجمالي الأقسام' : 'total departments' },
  ]

  // ─── Quick Actions ───────────────────────────────────────
  const quickActions = [
    { icon: CalendarPlus, label: isAr ? 'موعد جديد' : 'New Appointment', href: '/appointments', color: GOLD },
    { icon: UserPlus, label: isAr ? 'إضافة عميل' : 'Add Customer', href: '/customers', color: '#10B981' },
    { icon: Briefcase, label: isAr ? 'إضافة موظف' : 'Add Employee', href: '/staff', color: GOLD },
    { icon: Megaphone, label: isAr ? 'عرض جديد' : 'Create Offer', href: '/public-page', color: '#8B5CF6' },
    { icon: Bell, label: isAr ? 'إشعار' : 'Notification', href: '#', color: '#F59E0B' },
    { icon: FileSpreadsheet, label: isAr ? 'تقرير' : 'Report', href: '/reports', color: '#EC4899' },
  ]

  // ─── Notifications ───────────────────────────────────────
  const notifIcons: Record<string, any> = { booking: Calendar, reminder: Clock, staff: UserCheck, system: Activity }
  const notifColors: Record<string, string> = { booking: GOLD, reminder: '#F59E0B', staff: '#10B981', system: '#8B5CF6' }

  // ─── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 600, gap: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: GOLD,
          animation: 'spin .8s linear infinite',
        }} />
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{isAr ? 'جاري تحميل لوحة التحكم...' : 'Loading dashboard...'}</div>
      </div>
    )
  }

  return (
    <div className="anim-fade-in">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
              {isAr ? 'لوحة التحكم' : 'Dashboard'}
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 20,
              background: 'var(--primary-bg)', color: GOLD,
            }}>v2.0</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '6px 0 0' }}>
            {new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-ghost" onClick={load}>
            <RefreshCw size={15} />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ═══════════════ STATS GRID ═══════════════ */}
      <div className="dashboard-4col anim-stagger" style={{ marginBottom: 24 }}>
        {premiumStats.map(({ label, value, icon: Icon, change, up, color, period, suffix = '' }) => (
          <div key={label} className="premium-stat">
            <div className="stat-glow" />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="premium-icon" style={{ background: `${color}15`, color }}>
                <Icon size={20} />
              </div>
              <span className={`metric-badge ${up ? 'up' : 'down'}`}>
                {up ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {change}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', marginBottom: 2 }}>
              <AnimatedCounter value={value} suffix={suffix} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.6, marginTop: 2 }}>{period}</div>
          </div>
        ))}
      </div>

      {/* ═══════════════ QUICK ACTIONS ═══════════════ */}
      <div className="glass-card" style={{ padding: '18px 22px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Zap size={16} style={{ color: GOLD }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{isAr ? 'إجراءات سريعة' : 'Quick Actions'}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          {quickActions.map(({ icon: Icon, label, href, color }) => (
            <Link key={label} href={href} className="quick-action-btn" style={{ textDecoration: 'none' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${color}15`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={16} color={color} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════════════ CHARTS & ANALYTICS ═══════════════ */}
      <div className="dashboard-2col" style={{ marginBottom: 24 }}>
        {/* Revenue Trend */}
        <div className="card">
          <div className="card-header">
            <SectionTitle icon={TrendingUp} label={isAr ? 'اتجاه الإيرادات' : 'Revenue Trend'} />
            <div style={{ display: 'flex', gap: 8 }}>
              {[isAr ? 'شهري' : 'Monthly', isAr ? 'سنوي' : 'Yearly'].map((l, i) => (
                <button key={l} className={`btn btn-chip ${i === 0 ? 'active' : ''}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <ChartWrapper height={280}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey={isAr ? 'month' : 'monthEn'} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={3} fill="url(#revGrad)" name={isAr ? 'الإيرادات' : 'Revenue'} />
                  <Area type="monotone" dataKey="target" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="6 4" fill="none" name={isAr ? 'الهدف' : 'Target'} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>
        </div>

        {/* Appointment Status */}
        <div className="card">
          <div className="card-header">
            <SectionTitle icon={PieChart} label={isAr ? 'حالة المواعيد' : 'Appointment Status'} />
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: 280, width: '100%', position: 'relative', overflow: 'hidden' }}>
              <div style={{ flex: '0 0 180px', height: '100%' }}>
                <ChartWrapper height={280}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={apptStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {apptStatusData.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </RePieChart>
                  </ResponsiveContainer>
                </ChartWrapper>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {apptStatusData.map((s: any) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{isAr ? s.name : s.nameEn}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s.value}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 40, textAlign: 'end' }}>
                      {Math.round((s.value / apptStatusData.reduce((a: any, b: any) => a + b.value, 0)) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ MORE CHARTS ═══════════════ */}
      <div className="dashboard-3col" style={{ marginBottom: 24 }}>
        {/* Top Services */}
        <div className="card">
          <div className="card-header">
            <SectionTitle icon={BarChart3} label={isAr ? 'أكثر الخدمات طلباً' : 'Top Services'} />
          </div>
          <div className="card-body" style={{ height: 260 }}>
            <ChartWrapper height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServicesNorm} layout="vertical" margin={{ left: 0, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey={isAr ? 'name' : 'nameEn'} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="bookings" radius={[0, 6, 6, 0]} name={isAr ? 'حجوزات' : 'Bookings'}>
                    {topServicesNorm.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>
        </div>

        {/* Customer Growth */}
        <div className="card">
          <div className="card-header">
            <SectionTitle icon={Activity} label={isAr ? 'نمو العملاء' : 'Customer Growth'} />
          </div>
          <div className="card-body" style={{ height: 260 }}>
            <ChartWrapper height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customerGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey={isAr ? 'month' : 'monthEn'} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="new" stroke={GOLD} strokeWidth={2} dot={{ fill: GOLD, strokeWidth: 0, r: 3 }} name={isAr ? 'جدد' : 'New'} />
                  <Line type="monotone" dataKey="returning" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', strokeWidth: 0, r: 3 }} name={isAr ? 'عادون' : 'Returning'} />
                </LineChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="card">
          <div className="card-header">
            <SectionTitle icon={BarChart3} label={isAr ? 'ساعات الذروة' : 'Peak Hours'} />
          </div>
          <div className="card-body" style={{ height: 260 }}>
            <ChartWrapper height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={peakHoursData}>
                  <defs>
                    <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey={isAr ? 'hour' : 'hourEn'} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="bookings" stroke={GOLD} strokeWidth={2} fill="url(#peakGrad)" name={isAr ? 'حجوزات' : 'Bookings'} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>
        </div>
      </div>

      {/* ═══════════════ APPOINTMENTS + STAFF ═══════════════ */}
      <div className="dashboard-2col" style={{ marginBottom: 24 }}>
        {/* Today's Appointments */}
        <div className="card">
          <div className="card-header">
            <SectionTitle icon={Calendar} label={isAr ? 'مواعيد اليوم' : "Today's Schedule"} />
            <Link href="/appointments" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
              {isAr ? 'عرض الكل' : 'View All'}
              {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </Link>
          </div>
          <div style={{ padding: '4px 0' }}>
            {todayApptsData.map((a: any, i: number) => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 22px', transition: 'background 0.15s',
                borderBottom: i < todayApptsData.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <div style={{
                  width: 44, textAlign: 'center', flexShrink: 0,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{a.time}</div>
                </div>
                <div style={{ width: 3, height: 32, borderRadius: 2, background: STATUS_COLORS[a.status] || 'var(--border)', flexShrink: 0 }} />
                <AvatarLetter name={isAr ? a.customer : a.customerEn} index={i} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isAr ? a.customer : a.customerEn}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {isAr ? a.service : a.serviceEn} · {isAr ? a.staff : a.staffEn}
                  </div>
                </div>
                {isAr ? <StatusPill status={a.status} /> : <StatusPillEn status={a.status} />}
              </div>
            ))}
          </div>
        </div>

        {/* Staff Performance */}
        <div className="card">
          <div className="card-header">
            <SectionTitle icon={Award} label={isAr ? 'أداء الموظفين' : 'Staff Performance'} />
            <Link href="/staff" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
              {isAr ? 'عرض الكل' : 'View All'}
              {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </Link>
          </div>
          <div style={{ padding: '4px 0' }}>
            {staffPerfData.map((s: any, i: number) => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 22px', borderBottom: i < staffPerfData.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <AvatarLetter name={isAr ? s.name : s.nameEn} index={i} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{isAr ? s.name : s.nameEn}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isAr ? s.role : s.roleEn}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0 10px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>{s.rating}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isAr ? 'تقييم' : 'Rating'}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0 10px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>{s.attendance}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isAr ? 'حضور' : 'Attend'}</div>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{s.commission.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isAr ? 'عمولة' : 'Comm.'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ CUSTOMER INSIGHTS + BRANCH PERFORMANCE ═══════════════ */}
      <div className="dashboard-2col" style={{ marginBottom: 24 }}>
        {/* VIP Customers */}
        <div className="card">
          <div className="card-header">
            <SectionTitle icon={Heart} label={isAr ? 'عملاء VIP' : 'VIP Customers'} />
            <Link href="/customers" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
              {isAr ? 'عرض الكل' : 'View All'}
              {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </Link>
          </div>
          <div style={{ padding: '4px 0' }}>
            {vipData.map((c: any, i: number) => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 22px', borderBottom: i < vipData.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <AvatarLetter name={isAr ? c.name : c.nameEn} index={i} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{isAr ? c.name : c.nameEn}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.visits} {isAr ? 'زيارة' : 'visits'}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 10,
                      background: c.tier === 'بلاتينيوم' || c.tier === 'Platinum' ? 'rgba(201,165,95,0.15)' : c.tier === 'ذهب' || c.tier === 'Gold' ? 'rgba(245,158,11,0.12)' : 'rgba(156,163,175,0.12)',
                      color: c.tier === 'بلاتينيوم' || c.tier === 'Platinum' ? GOLD : c.tier === 'ذهب' || c.tier === 'Gold' ? '#F59E0B' : '#9CA3AF',
                    }}>{isAr ? c.tier : c.tierEn}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{c.spent.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.points} {isAr ? 'نقطة' : 'pts'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Performance */}
        <div className="card">
          <div className="card-header">
            <SectionTitle icon={Target} label={isAr ? 'أداء الفروع' : 'Branch Performance'} />
          </div>
          <div className="card-body" style={{ height: 300 }}>
            <ChartWrapper height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={MOCK_BRANCHES}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey={isAr ? 'name' : 'nameEn'} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} />
                  <Radar name={isAr ? 'الإيرادات' : 'Revenue'} dataKey="revenue" stroke={GOLD} fill={GOLD} fillOpacity={0.15} strokeWidth={2} />
                  <Radar name={isAr ? 'العملاء' : 'Customers'} dataKey="customers" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>
        </div>
      </div>

      {/* ═══════════════ NOTIFICATION CENTER + SECURITY ═══════════════ */}
      <div className="dashboard-2col" style={{ marginBottom: 24 }}>
        {/* Notification Center */}
        <div className="card">
          <div className="card-header">
            <SectionTitle icon={Bell} label={isAr ? 'مركز الإشعارات' : 'Notifications'} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 10,
                background: 'rgba(239,68,68,0.1)', color: '#EF4444',
              }}>{notifsData.filter((n: any) => !n.read).length} {isAr ? 'جديد' : 'new'}</span>
            </div>
          </div>
          <div style={{ padding: '4px 0', maxHeight: 340, overflowY: 'auto' }}>
            {notifsData.map((n: any, i: number) => {
              const Icon = notifIcons[n.type] || Bell
              const color = notifColors[n.type] || 'var(--text-muted)'
              return (
                <div key={n.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 22px', cursor: 'pointer', transition: 'background 0.15s',
                  background: n.read ? 'transparent' : 'var(--primary-bg)',
                  borderBottom: i < notifsData.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${color}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={16} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>
                      {isAr ? n.messageAr : n.messageEn}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {isAr ? n.time : n.timeEn}
                    </div>
                  </div>
                  {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, flexShrink: 0, marginTop: 4 }} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Security Dashboard */}
        <div className="card">
          <div className="card-header">
            <SectionTitle icon={Shield} label={isAr ? 'لوحة الأمان' : 'Security'} />
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { icon: LogIn, label: isAr ? 'جلسات نشطة' : 'Active Sessions', value: MOCK_SECURITY.activeSessions, color: '#10B981' },
                { icon: Users, label: isAr ? 'إجمالي المستخدمين' : 'Total Users', value: MOCK_SECURITY.totalUsers, color: GOLD },
                { icon: AlertTriangle, label: isAr ? 'محاولات فاشلة اليوم' : "Today's Failed", value: MOCK_SECURITY.failedToday, color: '#EF4444' },
                { icon: CheckCircle, label: isAr ? 'المصادقة الثنائية' : '2FA Enabled', value: isAr ? 'مفعل' : 'Active', color: '#8B5CF6' },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '14px', borderRadius: 12,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <item.icon size={14} color={item.color} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Login Activity Mini Chart */}
            <ChartWrapper height={100}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_SECURITY.loginActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey={isAr ? 'date' : 'dateEn'} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="success" stroke="#10B981" strokeWidth={2} dot={false} name={isAr ? 'ناجح' : 'Success'} />
                  <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} dot={false} name={isAr ? 'فاشل' : 'Failed'} />
                </LineChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>
        </div>
      </div>

      {/* ═══════════════ RECENT ACTIVITY (original data) ═══════════════ */}
      {recent.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <SectionTitle icon={Clock} label={isAr ? 'آخر المواعيد' : 'Recent Appointments'} />
            <Link href="/appointments" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
              {isAr ? 'عرض الكل' : 'View All'}
              {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </Link>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingInlineStart: 22 }}>{isAr ? 'العميل' : 'Customer'}</th>
                  <th>{isAr ? 'الخدمة' : 'Service'}</th>
                  <th>{isAr ? 'التاريخ' : 'Date'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'المبلغ' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 5).map((a: any, i: number) => (
                  <tr key={a.id}>
                    <td style={{ paddingInlineStart: 22 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AvatarLetter name={a.customer_name} index={i} size={32} />
                        <span style={{ fontWeight: 500 }}>{a.customer_name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.service_name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {new Date(a.date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' })}
                    </td>
                    <td>{isAr ? <StatusPill status={a.status} /> : <StatusPillEn status={a.status} />}</td>
                    <td style={{ fontWeight: 600, color: GOLD }}>
                      {Number(a.total || 0).toLocaleString()} {isAr ? 'ر.س' : 'SAR'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Alerts from original data */}
      {lowStock.length > 0 && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(239,68,68,0.15)' }}>
          <div className="card-header" style={{ borderBottomColor: 'rgba(239,68,68,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 2s infinite' }} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                {isAr ? 'تنبيه المخزون' : 'Stock Alert'}
                <span style={{ fontSize: 11, fontWeight: 500, color: '#EF4444', background: '#FEF2F2', padding: '1px 7px', borderRadius: 10 }}>
                  {lowStock.length}
                </span>
              </h2>
            </div>
            <Link href="/inventory" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Package size={13} />
              {isAr ? 'المخزون' : 'Inventory'}
            </Link>
          </div>
          <div style={{ padding: '2px 0' }}>
            {lowStock.slice(0, 4).map((p: any) => {
              const isCritical = p.current_stock <= 3
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 22px',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: p.image_url ? 'transparent' : (isCritical ? '#FEF2F2' : '#FFFBEB'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ShoppingBag size={16} color={isCritical ? '#DC2626' : '#D97706'} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name_ar}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.brand || ''}</div>
                  </div>
                  <div style={{ textAlign: 'end' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: isCritical ? '#DC2626' : '#D97706' }}>{p.current_stock}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isAr ? 'متبقي' : 'left'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Inline Keyframes ──────────────────────────── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }
      `}</style>
    </div>
  )
}