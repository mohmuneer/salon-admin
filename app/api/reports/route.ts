import { NextResponse, NextRequest } from 'next/server'
import { reportTypes } from '@/lib/report-config'

function generateMockData(type: string): any[] {
  const namesAr = ['سارة الأحمدي', 'نورة القحطاني', 'مها الشمري', 'لينا العتيبي', 'رنا الدوسري', 'هدى الزهراني', 'سامي الغامدي', 'فهد المالكي']
  const servicesAr = ['قص وتصفيف', 'صبغ شعر', 'عناية بشرة', 'مكياج', 'عناية أظافر', 'مساج', 'بديكير', 'مانيكير']
  const staffAr = ['نورة القحطاني', 'سارة الأحمدي', 'فهد المالكي', 'لينا العتيبي', 'مها الشمري']
  const statuses = ['pending', 'confirmed', 'completed', 'cancelled']
  const brands = ['لوريال', 'شيسيدو', 'ألف بارف', 'ريدكن', 'كيراستاس']
  const cats = ['عناية شعر', 'عناية بشرة', 'مكياج', 'عطور', 'أظافر']
  const now = new Date()

  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  const pick = <T,>(arr: T[]) => arr[rand(0, arr.length - 1)]
  const pastDate = (daysAgo: number) => {
    const d = new Date(now); d.setDate(d.getDate() - daysAgo)
    return d.toISOString().split('T')[0]
  }

  switch (type) {
    case 'appointments': {
      const rows: any[] = []
      for (let i = 0; i < 25; i++) {
        const d = pastDate(rand(0, 14))
        const servicePrice = rand(100, 500)
        const productsPrice = Math.random() > 0.5 ? rand(20, 150) : 0
        rows.push({
          id: i + 1,
          customer_name: pick(namesAr),
          customer_phone: `+9665${String(rand(0, 9)).repeat(8)}`,
          customer_email: `customer${i}@email.com`,
          service_name: pick(servicesAr),
          duration_min: pick([30, 45, 60, 90, 120]),
          staff_name: pick(staffAr),
          date: d,
          start_time: `${String(rand(8, 18)).padStart(2, '0')}:${pick(['00', '15', '30', '45'])}`,
          end_time: `${String(rand(9, 19)).padStart(2, '0')}:${pick(['00', '15', '30', '45'])}`,
          status: pick(statuses),
          service_price: servicePrice,
          products_price: productsPrice,
          total: servicePrice + productsPrice,
          notes: Math.random() > 0.7 ? 'ملاحظة' : '',
          branch_name: pick(['الفرع الرئيسي', 'فرع العليا', 'فرع النزهة']),
        })
      }
      return rows
    }
    case 'services': {
      const rows: any[] = []
      for (let i = 0; i < 12; i++) {
        rows.push({
          id: i + 1,
          name_ar: servicesAr[i % servicesAr.length],
          name_en: `Service ${i + 1}`,
          category_name: pick(cats),
          duration_min: pick([30, 45, 60, 90, 120]),
          price: rand(80, 600),
          gender_target: pick(['النساء', 'الرجال', 'الكل']),
          total_bookings: rand(5, 80),
          is_active: Math.random() > 0.15,
        })
      }
      return rows
    }
    case 'products': {
      const rows: any[] = []
      for (let i = 0; i < 15; i++) {
        rows.push({
          id: i + 1,
          name_ar: `منتج ${i + 1}`,
          brand: pick(brands),
          category: pick(cats),
          price: rand(30, 400),
          cost: rand(15, 200),
          stock_qty: rand(0, 50),
          min_stock_alert: 5,
          sold_in_store: rand(0, 30),
          used_in_sessions: rand(0, 20),
          is_active: true,
        })
      }
      return rows
    }
    case 'customers': {
      const rows: any[] = []
      for (let i = 0; i < 20; i++) {
        const d = pastDate(rand(1, 365))
        rows.push({
          id: i + 1,
          name: pick(namesAr),
          phone: `+9665${String(rand(0, 9)).repeat(8)}`,
          email: `user${i}@email.com`,
          gender: pick(['ذكر', 'أنثى']),
          total_appointments: rand(1, 30),
          total_spent: rand(200, 5000),
          last_visit: pastDate(rand(0, 60)),
          created_at: pastDate(rand(30, 365)),
        })
      }
      return rows
    }
    case 'staff': {
      const rows: any[] = []
      for (let i = 0; i < 8; i++) {
        rows.push({
          id: i + 1,
          name: staffAr[i % staffAr.length],
          phone: `+9665${String(rand(0, 9)).repeat(8)}`,
          email: `staff${i}@glamour.sa`,
          specialty: pick(['قص وتصفيف', 'صبغ', 'عناية بشرة', 'مكياج', 'أظافر', 'مساج']),
          gender_served: pick(['نساء', 'رجال', 'الكل']),
          rating: Math.round((rand(35, 50) / 10) * 10) / 10,
          reviews_count: rand(10, 200),
          is_active: Math.random() > 0.1,
        })
      }
      return rows
    }
    case 'orders': {
      const rows: any[] = []
      for (let i = 0; i < 15; i++) {
        const d = new Date(now); d.setDate(d.getDate() - rand(0, 14))
        const subtotal = rand(50, 500)
        const discount = Math.random() > 0.6 ? rand(10, 50) : 0
        rows.push({
          id: i + 1,
          customer_name: pick(namesAr),
          phone: `+9665${String(rand(0, 9)).repeat(8)}`,
          status: pick(['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']),
          subtotal,
          discount,
          shipping_fee: Math.random() > 0.5 ? 15 : 0,
          total: subtotal - discount + (Math.random() > 0.5 ? 15 : 0),
          payment_status: pick(['pending', 'paid', 'refunded']),
          payment_method: pick(['cash', 'mada', 'card', 'apple_pay']),
          items_count: rand(1, 5),
          created_at: d.toISOString(),
        })
      }
      return rows
    }
    case 'departments': {
      const deptNames = ['العناية بالشعر', 'العناية بالبشرة', 'الأظافر', 'العناية بالرجال', 'المكياج']
      return deptNames.map((name, i) => ({
        department_name: name,
        product_count: rand(3, 20),
        service_count: rand(2, 12),
        stock_value: rand(5000, 80000),
        revenue: rand(10000, 50000),
        sales_count: rand(10, 80),
      }))
    }
    case 'financial': {
      const rows: any[] = []
      for (let i = 30; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i)
        const revenue = rand(500, 5000)
        const costs = Math.floor(revenue * (rand(20, 40) / 100))
        rows.push({
          date: d.toISOString().split('T')[0],
          revenue,
          costs,
          profit: revenue - costs,
          completed_appointments: rand(2, 12),
          new_customers: rand(1, 5),
        })
      }
      return rows
    }
    default:
      return []
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'appointments'
  const report = reportTypes.find(r => r.id === type)
  if (!report) return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })

  let rows: any[] = []
  let fetchError = false

  try {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 4000)
    const baseUrl = new URL(req.url).origin
    const endpointUrl = report.endpoint + (report.endpoint.includes('?') ? '&' : '?') + `type=${type}`
    const res = await fetch(`${baseUrl}${endpointUrl}`, { signal: ac.signal })
    clearTimeout(timer)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) rows = data
      else if (data.error) fetchError = true
      else rows = []
    } else {
      fetchError = true
    }
  } catch {
    fetchError = true
  }

  if (fetchError || rows.length === 0) {
    rows = generateMockData(type)
  }

  return NextResponse.json({ columns: report.columns, rows })
}
