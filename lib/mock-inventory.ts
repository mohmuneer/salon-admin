export const defaultProducts = [
  { id: 1, name_ar: 'شامبو لوريال', brand: 'لوريال', category: 'عناية شعر', price: 89, cost: 45, stock_qty: 25, min_stock_alert: 5, department_id: null, department_name: 'العناية بالشعر' },
  { id: 2, name_ar: 'كريم شيسيدو', brand: 'شيسيدو', category: 'عناية بشرة', price: 220, cost: 110, stock_qty: 12, min_stock_alert: 5, department_id: null, department_name: 'العناية بالبشرة' },
  { id: 3, name_ar: 'ماسك شعر', brand: 'كيراستاس', category: 'عناية شعر', price: 150, cost: 75, stock_qty: 8, min_stock_alert: 5, department_id: null, department_name: 'العناية بالشعر' },
  { id: 4, name_ar: 'زيت أرغان', brand: 'ألف بارف', category: 'عناية شعر', price: 95, cost: 40, stock_qty: 3, min_stock_alert: 5, department_id: null, department_name: 'العناية بالشعر' },
  { id: 5, name_ar: 'طلاء أظافر', brand: 'أوبي', category: 'أظافر', price: 45, cost: 20, stock_qty: 30, min_stock_alert: 10, department_id: null, department_name: 'الأظافر' },
  { id: 6, name_ar: 'مقوي أظافر', brand: 'أوبي', category: 'أظافر', price: 55, cost: 25, stock_qty: 18, min_stock_alert: 10, department_id: null, department_name: 'الأظافر' },
  { id: 7, name_ar: 'سيروم فيتامين سي', brand: 'سيروم', category: 'عناية بشرة', price: 180, cost: 90, stock_qty: 6, min_stock_alert: 5, department_id: null, department_name: 'العناية بالبشرة' },
  { id: 8, name_ar: 'واقي شمس', brand: 'لاروش بوزيه', category: 'عناية بشرة', price: 130, cost: 65, stock_qty: 2, min_stock_alert: 5, department_id: null, department_name: 'العناية بالبشرة' },
  { id: 9, name_ar: 'بلسم شعر', brand: 'لوريال', category: 'عناية شعر', price: 75, cost: 35, stock_qty: 15, min_stock_alert: 5, department_id: null, department_name: 'العناية بالشعر' },
  { id: 10, name_ar: 'موس تصفيف', brand: 'ريدكن', category: 'عناية شعر', price: 65, cost: 30, stock_qty: 10, min_stock_alert: 5, department_id: null, department_name: 'العناية بالشعر' },
]

export interface MockTx {
  id: number
  product_id: number | string
  product_name: string
  type: 'in' | 'out' | 'adjust'
  quantity: number
  prev_stock: number
  new_stock: number
  reference: string
  notes: string
  created_by: string
  created_at: string
}

let nextTxId = 1000
const transactions: MockTx[] = []
const stockMap: Record<string, number> = {}

function init() {
  if (Object.keys(stockMap).length > 0) return
  for (const p of defaultProducts) {
    stockMap[String(p.id)] = p.stock_qty
  }
}
init()

export function getStockLevel(productId: number | string): number {
  return stockMap[String(productId)] ?? 0
}

export function getAllStockLevels() {
  init()
  return defaultProducts.map(p => {
    const id = String(p.id)
    const productTxs = transactions.filter(t => String(t.product_id) === id)
    const totalIn = productTxs.filter(t => t.type === 'in').reduce((s, t) => s + Math.abs(t.quantity), 0)
    const totalOut = productTxs.filter(t => t.type === 'out').reduce((s, t) => s + Math.abs(t.quantity), 0)
    return {
      id: p.id,
      name_ar: p.name_ar,
      brand: p.brand,
      category: p.category,
      price: p.price,
      cost: p.cost,
      current_stock: stockMap[id] ?? p.stock_qty,
      min_stock_alert: p.min_stock_alert,
      total_received: totalIn,
      total_dispensed: totalOut,
      department_id: p.department_id,
      department_name: p.department_name,
    }
  })
}

export function getLowStockProducts() {
  return getAllStockLevels().filter(p => p.current_stock <= p.min_stock_alert)
}

export function addTransaction(
  productId: number | string,
  type: 'in' | 'out' | 'adjust',
  quantity: number,
  reference: string,
  notes: string,
) {
  init()
  const product = defaultProducts.find(p => String(p.id) === String(productId))
  if (!product) return null

  const id = String(productId)
  const prevStock = stockMap[id] ?? product.stock_qty
  let newStock = prevStock

  if (type === 'in') newStock = prevStock + quantity
  else if (type === 'out') newStock = Math.max(0, prevStock - quantity)
  else if (type === 'adjust') newStock = quantity

  stockMap[id] = newStock

  const tx: MockTx = {
    id: nextTxId++,
    product_id: productId,
    product_name: product.name_ar,
    type,
    quantity: type === 'out' ? -quantity : quantity,
    prev_stock: prevStock,
    new_stock: newStock,
    reference: reference || '',
    notes: notes || '',
    created_by: 'مدير النظام',
    created_at: new Date().toISOString(),
  }
  transactions.unshift(tx)
  return tx
}

export function getTransactions(productId?: number | string, days = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  let txs = [...transactions]
  if (productId) txs = txs.filter(t => String(t.product_id) === String(productId))
  txs = txs.filter(t => new Date(t.created_at) >= cutoff)
  txs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return txs
}

export function getProductsWithRecentMovements() {
  const recentIds = new Set(transactions.map(t => String(t.product_id)))
  return getAllStockLevels().filter(p => recentIds.has(String(p.id)))
}
