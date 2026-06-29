export interface MockAppointment {
  id: number | string
  customer_name: string
  customer_phone: string
  service_name: string
  duration_min: number
  staff_name: string
  date: string
  start_time: string
  end_time: string
  status: string
  service_price: number
  products_price: number
  total: number
  notes: string
}

let nextId = 200
export const mockAppointments: MockAppointment[] = [
  { id: 1, customer_name: 'سارة الأحمدي', customer_phone: '+966500000002', service_name: 'قص وتصفيف', duration_min: 60, staff_name: 'نورة القحطاني', date: new Date().toISOString().split('T')[0], start_time: '10:00', end_time: '11:00', status: 'pending', service_price: 150, products_price: 0, total: 150, notes: '' },
  { id: 2, customer_name: 'نورة القحطاني', customer_phone: '+966500000003', service_name: 'صبغ شعر', duration_min: 120, staff_name: 'سارة الأحمدي', date: new Date().toISOString().split('T')[0], start_time: '14:00', end_time: '16:00', status: 'confirmed', service_price: 350, products_price: 45, total: 395, notes: 'لون بني غامق' },
  { id: 3, customer_name: 'مها الشمري', customer_phone: '+966500000005', service_name: 'عناية بشرة', duration_min: 45, staff_name: 'فهد المالكي', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], start_time: '11:30', end_time: '12:15', status: 'pending', service_price: 200, products_price: 0, total: 200, notes: '' },
]

export function addMockAppointment(data: Partial<MockAppointment>): MockAppointment {
  const appt: MockAppointment = {
    id: nextId++, customer_name: data.customer_name || 'عميل', customer_phone: data.customer_phone || '',
    service_name: data.service_name || 'خدمة', duration_min: data.duration_min || 60,
    staff_name: data.staff_name || 'موظف', date: data.date || new Date().toISOString().split('T')[0],
    start_time: data.start_time || '09:00', end_time: data.end_time || '10:00',
    status: data.status || 'pending', service_price: data.service_price || 0,
    products_price: data.products_price || 0, total: data.total || 0, notes: data.notes || '',
  }
  mockAppointments.unshift(appt)
  return appt
}
