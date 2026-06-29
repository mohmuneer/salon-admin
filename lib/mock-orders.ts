export interface MockOrder {
  id: number | string
  customer_name: string
  phone: string
  status: string
  subtotal: number
  discount: number
  shipping_fee: number
  total: number
  payment_status: string
  payment_method: string
  created_at: string
  items_count: number
}

let nextId = 1000
export const mockOrders: MockOrder[] = [
  { id: 1, customer_name: 'سارة الأحمدي', phone: '+966500000002', status: 'pending', subtotal: 178, discount: 0, shipping_fee: 0, total: 178, payment_status: 'pending', payment_method: 'cash', created_at: new Date(Date.now() - 60000).toISOString(), items_count: 2 },
  { id: 2, customer_name: 'نورة القحطاني', phone: '+966500000003', status: 'confirmed', subtotal: 399, discount: 0, shipping_fee: 15, total: 414, payment_status: 'paid', payment_method: 'mada', created_at: new Date(Date.now() - 3600000).toISOString(), items_count: 3 },
  { id: 3, customer_name: 'مها الشمري', phone: '+966500000005', status: 'preparing', subtotal: 89, discount: 0, shipping_fee: 0, total: 89, payment_status: 'paid', payment_method: 'card', created_at: new Date(Date.now() - 7200000).toISOString(), items_count: 1 },
]

export function addMockOrder(data: Partial<MockOrder>): MockOrder {
  const order: MockOrder = {
    id: nextId++, customer_name: data.customer_name || 'عميل', phone: data.phone || '',
    status: data.status || 'pending', subtotal: data.subtotal || 0, discount: data.discount || 0,
    shipping_fee: data.shipping_fee || 0, total: data.total || 0,
    payment_status: data.payment_status || 'pending', payment_method: data.payment_method || 'cash',
    created_at: data.created_at || new Date().toISOString(), items_count: data.items_count || 0,
  }
  mockOrders.unshift(order)
  return order
}
