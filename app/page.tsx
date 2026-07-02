'use client'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLang } from '@/app/layout'
import { useSalonSettings } from '@/lib/useSalonSettings'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, Users, Scissors, Smile, Clock, Gift, UserCheck, Layers,
  RefreshCw, CalendarPlus, UserPlus, Briefcase, ShoppingBag, Megaphone, FileSpreadsheet,
} from 'lucide-react'
import { useDashboardData } from '@/lib/useDashboardData'
import { useThemeColors } from '@/components/dashboard/useThemeColors'
import {
  ARABIC_MONTHS, EN_MONTHS, STATUS_MAP,
  MOCK_REVENUE, MOCK_STATUS, MOCK_SERVICES, MOCK_GROWTH, MOCK_PEAK_HOURS,
  MOCK_STAFF, MOCK_APPOINTMENTS_TODAY, MOCK_VIP, MOCK_RECENT_CUSTOMERS, MOCK_NOTIFICATIONS,
} from '@/components/dashboard/constants'
import StatCard, { statCardVariants } from '@/components/dashboard/StatCard'
import QuickActionCard from '@/components/dashboard/QuickActionCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import AppointmentStatusChart from '@/components/dashboard/AppointmentStatusChart'
import TopServicesChart from '@/components/dashboard/TopServicesChart'
import ServiceDistributionChart from '@/components/dashboard/ServiceDistributionChart'
import CustomerGrowthChart from '@/components/dashboard/CustomerGrowthChart'
import PeakHoursChart from '@/components/dashboard/PeakHoursChart'
import BranchPerformanceChart from '@/components/dashboard/BranchPerformanceChart'
import SecurityPanel from '@/components/dashboard/SecurityPanel'
import BookingsList from '@/components/dashboard/BookingsList'
import StaffPerformanceList from '@/components/dashboard/StaffPerformanceList'
import VipCustomers from '@/components/dashboard/VipCustomers'
import RecentCustomers from '@/components/dashboard/RecentCustomers'
import NotificationCenter from '@/components/dashboard/NotificationCenter'
import RecentAppointmentsTable from '@/components/dashboard/RecentAppointmentsTable'
import StockAlerts from '@/components/dashboard/StockAlerts'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const sectionVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function Dashboard() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const { settings } = useSalonSettings()
  const salonName = (isAr ? settings.name : settings.name_en) || settings.name
  const { GOLD, CHART_COLORS } = useThemeColors()

  const { data, isLoading, refetch, isFetching } = useDashboardData()
  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => fetch('/api/departments').then(r => (r.ok ? r.json() : [])),
  })

  const deptInfo = useMemo(() => {
    const active = Array.isArray(depts) ? depts.filter((x: any) => x.is_active) : []
    let top: any = active[0] || {}
    active.forEach((x: any) => {
      if ((x.employee_count + x.service_count) > ((top.employee_count || 0) + (top.service_count || 0))) top = x
    })
    return { total: active.length, topName: top.name_ar || '' }
  }, [depts])

  const stats = data?.stats || {}
  const lowStock = data?.stockAlerts || []
  const recent = data?.recentAppointments || []
  const topServices = data?.topServices || []

  const revenueTrendData = useMemo(() => {
    const rows = data?.revenueTrend
    if (!rows?.length) return MOCK_REVENUE
    return rows.map((r: any) => {
      const idx = parseInt(r.month_key.split('-')[1]) - 1
      return { month: ARABIC_MONTHS[idx], monthEn: EN_MONTHS[idx], revenue: Number(r.revenue), appointments: Number(r.appointments), target: 0 }
    })
  }, [data])

  const apptStatusData = useMemo(() => {
    const rows = data?.appointmentStatus
    if (!rows?.length) return MOCK_STATUS
    return rows.map((r: any) => ({
      name: STATUS_MAP[r.status]?.ar || r.status,
      nameEn: STATUS_MAP[r.status]?.en || r.status,
      value: Number(r.value),
      color: STATUS_MAP[r.status]?.color || '#9CA3AF',
    }))
  }, [data])

  const customerGrowthData = useMemo(() => {
    const rows = data?.customerGrowth
    if (!rows?.length) return MOCK_GROWTH
    return rows.map((r: any) => {
      const idx = parseInt(r.month_key.split('-')[1]) - 1
      return { month: ARABIC_MONTHS[idx], monthEn: EN_MONTHS[idx], new: Number(r.new), returning: Number(r.returning), total: Number(r.new) + Number(r.returning) }
    })
  }, [data])

  const peakHoursData = useMemo(() => {
    const rows = data?.peakHours
    if (!rows?.length) return MOCK_PEAK_HOURS
    return rows.map((r: any) => {
      const h = Number(r.hour)
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      return { hour: `${h12}${h < 12 ? 'ص' : 'م'}`, hourEn: `${h12}${h < 12 ? 'AM' : 'PM'}`, bookings: Number(r.bookings) }
    })
  }, [data])

  const todayApptsData = useMemo(() => {
    const rows = data?.todayAppointments
    if (!rows?.length) return MOCK_APPOINTMENTS_TODAY
    return rows.map((r: any, i: number) => ({
      id: i + 1, time: r.time,
      customer: r.customer, customerEn: r.customer,
      service: r.service, serviceEn: r.service,
      status: r.status,
      staff: r.staff, staffEn: r.staff,
    }))
  }, [data])

  const staffPerfData = useMemo(() => {
    const rows = data?.staffPerformance
    if (!rows?.length) return MOCK_STAFF.map((s: any) => ({ ...s, completionRate: s.attendance }))
    return rows.map((r: any, i: number) => {
      const totalAssigned = Number(r.total_assigned || 0)
      const completed = Number(r.completed)
      const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0
      return {
        id: i + 1, name: r.name, nameEn: r.name,
        role: r.role || 'موظف', roleEn: r.role || 'Staff',
        rating: Number(r.rating), completed, completionRate,
        commission: Number(r.commission),
      }
    })
  }, [data])

  const vipData = useMemo(() => {
    const rows = data?.vipCustomers
    if (!rows?.length) return MOCK_VIP
    return rows.map((r: any, i: number) => {
      const spent = Number(r.spent)
      const tier = spent >= 20000 ? { ar: 'بلاتينيوم', en: 'Platinum' } : spent >= 10000 ? { ar: 'ذهب', en: 'Gold' } : { ar: 'فضة', en: 'Silver' }
      return { id: i + 1, name: r.name, nameEn: r.name, visits: Number(r.visits), spent, points: Math.round(spent / 10), tier: tier.ar, tierEn: tier.en }
    })
  }, [data])

  const recentCustomersData = useMemo(() => {
    const rows = data?.recentCustomers
    if (!rows?.length) return MOCK_RECENT_CUSTOMERS
    return rows.map((r: any, i: number) => ({
      id: i + 1, name: r.name, nameEn: r.name,
      lastVisit: r.last_visit, visits: Number(r.visits),
    }))
  }, [data])

  const notifsData = useMemo(() => {
    const rows = data?.notifications
    if (!rows?.length) return MOCK_NOTIFICATIONS
    return rows.map((r: any, i: number) => ({
      id: i + 1, type: r.type,
      messageAr: r.body_ar, messageEn: r.body_ar,
      time: r.created_at ? new Date(r.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '',
      timeEn: r.created_at ? new Date(r.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
      read: r.is_read,
    }))
  }, [data])

  const topServicesNorm = useMemo(() => {
    if (!topServices.length) return MOCK_SERVICES
    return topServices.map((r: any) => ({ name: r.name_ar, nameEn: r.name_ar, bookings: Number(r.bookings), revenue: Number(r.revenue) }))
  }, [topServices])

  const premiumStats = [
    { label: isAr ? 'إجمالي الإيرادات' : 'Total Revenue', value: Number(stats.monthly_revenue || 42300), icon: DollarSign, change: '+12.5%', up: true, color: GOLD, period: isAr ? 'هذا الشهر' : 'this month' },
    { label: isAr ? 'عملاء اليوم' : "Today's Customers", value: Number(stats.today_appointments || 28), icon: Users, change: '+8.2%', up: true, color: '#10B981', period: isAr ? 'مقارنة بالأمس' : 'vs yesterday' },
    { label: isAr ? 'الخدمات المكتملة' : 'Services Done', value: Number(stats.completed_services || 156), icon: Scissors, change: '+15.3%', up: true, color: GOLD, period: isAr ? 'هذا الأسبوع' : 'this week' },
    { label: isAr ? 'رضا العملاء' : 'Satisfaction', value: 96, icon: Smile, change: '4.8 ★', up: true, color: '#8B5CF6', period: isAr ? 'متوسط التقييم' : 'avg rating', suffix: '%' },
    { label: isAr ? 'الحجوزات المعلقة' : 'Pending', value: Number(stats.pending_appointments || 12), icon: Clock, change: '-3', up: false, color: '#F59E0B', period: isAr ? 'في انتظار التأكيد' : 'awaiting confirmation' },
    { label: isAr ? 'نقاط الولاء' : 'Loyalty Pts', value: 4820, icon: Gift, change: '+22%', up: true, color: '#EC4899', period: isAr ? 'هذا الشهر' : 'this month' },
    { label: isAr ? 'حضور الموظفين' : 'Attendance', value: 97, icon: UserCheck, change: '+2.1%', up: true, color: '#14B8A6', period: isAr ? 'معدل اليوم' : "today's rate", suffix: '%' },
    { label: isAr ? 'الأقسام النشطة' : 'Active Depts', value: deptInfo.total, icon: Layers, change: deptInfo.topName || '—', up: true, color: '#6366F1', period: isAr ? 'إجمالي الأقسام' : 'total departments' },
  ]

  const quickActions = [
    { icon: CalendarPlus, label: isAr ? 'موعد جديد' : 'New Appointment', description: isAr ? 'احجز موعداً لعميل' : 'Book a customer appointment', href: '/appointments', color: GOLD },
    { icon: UserPlus, label: isAr ? 'عميل جديد' : 'New Customer', description: isAr ? 'أضف عميلاً جديداً' : 'Add a new customer', href: '/customers', color: '#10B981' },
    { icon: Briefcase, label: isAr ? 'موظف جديد' : 'New Staff', description: isAr ? 'أضف موظفاً جديداً' : 'Add a new staff member', href: '/staff', color: GOLD },
    { icon: ShoppingBag, label: isAr ? 'إضافة منتج' : 'Add Product', description: isAr ? 'أضف منتجاً للمخزون' : 'Add a product to inventory', href: '/inventory', color: '#8B5CF6' },
    { icon: Megaphone, label: isAr ? 'عرض جديد' : 'Create Offer', description: isAr ? 'أنشئ عرضاً ترويجياً' : 'Create a promotional offer', href: '/public-page', color: '#F59E0B' },
    { icon: FileSpreadsheet, label: isAr ? 'تقرير جديد' : 'New Report', description: isAr ? 'أنشئ تقريراً تفصيلياً' : 'Generate a detailed report', href: '/reports', color: '#EC4899' },
  ]

  return (
    <div>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="skeleton" exit={{ opacity: 0 }}>
            <DashboardSkeleton />
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* ═══════════════ HEADER ═══════════════ */}
            <motion.div className="page-header" variants={sectionVariants} initial="hidden" animate="show">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
                    {isAr ? `مرحباً بك في ${salonName}` : `Welcome to ${salonName}`}
                  </h1>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 20, background: 'var(--primary-bg)', color: GOLD }}>v2.0</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                  {new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => refetch()}>
                  <RefreshCw size={15} style={{ animation: isFetching ? 'spin .8s linear infinite' : 'none' }} />
                  {isAr ? 'تحديث' : 'Refresh'}
                </button>
              </div>
            </motion.div>

            {/* ═══════════════ STATS GRID ═══════════════ */}
            <motion.div className="dashboard-4col" style={{ marginBottom: 24 }} variants={containerVariants} initial="hidden" animate="show">
              {premiumStats.map((s) => <StatCard key={s.label} {...s} />)}
            </motion.div>

            {/* ═══════════════ QUICK ACTIONS ═══════════════ */}
            <motion.div className="glass-card" style={{ padding: '18px 22px', marginBottom: 24 }} variants={sectionVariants} initial="hidden" animate="show" transition={{ delay: 0.05 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <FileSpreadsheet size={16} style={{ color: GOLD }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{isAr ? 'إجراءات سريعة' : 'Quick Actions'}</span>
              </div>
              <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }} variants={containerVariants} initial="hidden" animate="show">
                {quickActions.map((a) => <QuickActionCard key={a.label} {...a} />)}
              </motion.div>
            </motion.div>

            {/* ═══════════════ CHARTS & ANALYTICS ═══════════════ */}
            <motion.div className="dashboard-2col" style={{ marginBottom: 24 }} variants={sectionVariants} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
              <RevenueChart data={revenueTrendData} isAr={isAr} GOLD={GOLD} />
              <AppointmentStatusChart data={apptStatusData} isAr={isAr} />
            </motion.div>

            <motion.div className="dashboard-3col" style={{ marginBottom: 24 }} variants={sectionVariants} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
              <TopServicesChart data={topServicesNorm} isAr={isAr} CHART_COLORS={CHART_COLORS} />
              <CustomerGrowthChart data={customerGrowthData} isAr={isAr} GOLD={GOLD} />
              <PeakHoursChart data={peakHoursData} isAr={isAr} GOLD={GOLD} />
            </motion.div>

            <motion.div className="dashboard-2col" style={{ marginBottom: 24 }} variants={sectionVariants} initial="hidden" animate="show" transition={{ delay: 0.18 }}>
              <ServiceDistributionChart data={topServicesNorm} isAr={isAr} CHART_COLORS={CHART_COLORS} />
              <BranchPerformanceChart isAr={isAr} GOLD={GOLD} />
            </motion.div>

            {/* ═══════════════ APPOINTMENTS + STAFF ═══════════════ */}
            <motion.div className="dashboard-2col" style={{ marginBottom: 24 }} variants={sectionVariants} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
              <BookingsList data={todayApptsData} isAr={isAr} />
              <StaffPerformanceList data={staffPerfData} isAr={isAr} GOLD={GOLD} />
            </motion.div>

            {/* ═══════════════ CUSTOMER INSIGHTS ═══════════════ */}
            <motion.div className="dashboard-2col" style={{ marginBottom: 24 }} variants={sectionVariants} initial="hidden" animate="show" transition={{ delay: 0.25 }}>
              <VipCustomers data={vipData} isAr={isAr} GOLD={GOLD} />
              <RecentCustomers data={recentCustomersData} isAr={isAr} />
            </motion.div>

            {/* ═══════════════ NOTIFICATIONS + SECURITY ═══════════════ */}
            <motion.div className="dashboard-2col" style={{ marginBottom: 24 }} variants={sectionVariants} initial="hidden" animate="show" transition={{ delay: 0.3 }}>
              <NotificationCenter data={notifsData} isAr={isAr} GOLD={GOLD} />
              <SecurityPanel isAr={isAr} GOLD={GOLD} />
            </motion.div>

            {/* ═══════════════ RECENT ACTIVITY (real data only) ═══════════════ */}
            {recent.length > 0 && <RecentAppointmentsTable data={recent} isAr={isAr} GOLD={GOLD} />}
            {lowStock.length > 0 && <StockAlerts data={lowStock} isAr={isAr} />}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }
      `}</style>
    </div>
  )
}
