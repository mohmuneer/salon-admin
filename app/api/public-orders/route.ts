import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      items,
      customerName,
      customerPhone,
      address,
      paymentMethod,
      debitBank,
      debitAccount,
      debitHolder,
      orderType: clientOrderType,
    } = body

    if (!items?.length || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    /* ── Classify items ── */
    const productItems: { productId: string; qty: number }[] = []
    const serviceItems: { serviceId: string; qty: number; price?: number }[] = []

    for (const it of items) {
      const productId = it.productId || it.product_id
      const serviceId = it.serviceId || it.service_id
      const qty = Math.max(1, Math.floor(Number(it.qty || it.quantity) || 1))
      if (serviceId) {
        serviceItems.push({ serviceId, qty, price: Number(it.price || it.priceSar) || undefined })
      } else if (productId) {
        productItems.push({ productId, qty })
      }
    }

    const hasProducts = productItems.length > 0
    const hasServices = serviceItems.length > 0

    if (!hasProducts && !hasServices) {
      return NextResponse.json({ error: 'لا توجد منتجات أو خدمات صالحة في الطلب' }, { status: 400 })
    }

    /* ── Resolve real prices server-side ── */
    const resolvedProducts: { productId: string; qty: number; price: number }[] = []
    for (const it of productItems) {
      const prod = await pool.query(
        'SELECT price FROM products WHERE id = $1 AND is_active = true', [it.productId]
      ).catch(() => ({ rows: [] }))
      if (prod.rows.length === 0) continue
      resolvedProducts.push({ productId: it.productId, qty: it.qty, price: Number(prod.rows[0].price) || 0 })
    }

    const resolvedServices: { serviceId: string; qty: number; price: number }[] = []
    for (const it of serviceItems) {
      const svc = await pool.query(
        'SELECT price FROM services WHERE id = $1 AND is_active = true', [it.serviceId]
      ).catch(() => ({ rows: [] }))
      if (svc.rows.length === 0) continue
      const dbPrice = Number(svc.rows[0].price) || 0
      resolvedServices.push({ serviceId: it.serviceId, qty: it.qty, price: it.price || dbPrice })
    }

    if (resolvedProducts.length === 0 && resolvedServices.length === 0) {
      return NextResponse.json({ error: 'لا توجد منتجات أو خدمات صالحة في الطلب' }, { status: 400 })
    }

    /* ── Determine order_type ── */
    const orderType: 'product' | 'service' | 'mixed' =
      clientOrderType && ['product', 'service', 'mixed'].includes(clientOrderType)
        ? clientOrderType
        : hasProducts && hasServices ? 'mixed'
        : hasProducts ? 'product'
        : 'service'

    // Get default salon
    const salonResult = await pool.query('SELECT id FROM salons ORDER BY id LIMIT 1')
    const salonId = salonResult.rows[0]?.id || '11111111-1111-1111-1111-111111111111'

    // Find or create customer by phone (last 9 digits for format tolerance)
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '')
    const last9      = cleanPhone.slice(-9)
    const existing   = await pool.query(
      `SELECT id FROM users WHERE RIGHT(REGEXP_REPLACE(phone,'[^0-9]','','g'),9) = $1 LIMIT 1`,
      [last9]
    )
    let customerId: string
    if (existing.rows.length > 0) {
      customerId = existing.rows[0].id
    } else {
      const phoneFormatted = cleanPhone.startsWith('966') ? '+' + cleanPhone : '0' + last9
      const newCust = await pool.query(
        `INSERT INTO users (name, phone, password_hash, role) VALUES ($1, $2, '', 'customer') RETURNING id`,
        [customerName, phoneFormatted]
      )
      customerId = newCust.rows[0].id
    }

    // Map payment method to valid enum value
    const validPayMethod = ['bank_transfer','direct_debit','cod','card','mada','applepay','stcpay','cash'].includes(paymentMethod)
      ? paymentMethod
      : 'cash'

    const productSubtotal = resolvedProducts.reduce((s, it) => s + it.price * it.qty, 0)
    const serviceSubtotal = resolvedServices.reduce((s, it) => s + it.price * it.qty, 0)
    const subtotal = productSubtotal + serviceSubtotal

    // Build notes including payment details
    let notes = `طلب عبر الموقع — ${customerName} — ${customerPhone}`
    if (orderType === 'product') notes += ' — (منتجات)'
    else if (orderType === 'service') notes += ' — (خدمات)'
    else notes += ' — (منتجات + خدمات)'
    if (address) notes += ` — ${address}`
    if (paymentMethod === 'bank_transfer') notes += ' — (حوالة بنكية)'
    if (paymentMethod === 'direct_debit' && debitBank) notes += ` — خصم من حساب: ${debitBank} / ${debitAccount} / ${debitHolder}`

    const result = await pool.query(
      `INSERT INTO orders (customer_id, salon_id, order_type, status, subtotal, discount, shipping_fee, total, shipping_address, payment_method, payment_status, notes)
       VALUES ($1, $2, $3, 'pending', $4, 0, 0, $5, $6, $7, 'pending', $8) RETURNING id`,
      [customerId, salonId, orderType, subtotal, subtotal, address || '', validPayMethod, notes]
    )

    const orderId = result.rows[0].id

    // Insert product items
    for (const it of resolvedProducts) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, item_type) VALUES ($1, $2, $3, $4, 'product')`,
        [orderId, it.productId, it.qty, it.price]
      )
    }

    // Insert service items
    for (const it of resolvedServices) {
      await pool.query(
        `INSERT INTO order_items (order_id, service_id, quantity, unit_price, item_type) VALUES ($1, $2, $3, $4, 'service')`,
        [orderId, it.serviceId, it.qty, it.price]
      )
    }

    return NextResponse.json({
      ok:       true,
      id:       `OR${Date.now().toString(36).toUpperCase()}`,
      dbId:     orderId,
      orderType,
      message:  'تم تقديم الطلب بنجاح',
    })
  } catch (err: any) {
    console.error('[public-orders POST]', err.message)
    return NextResponse.json({ error: 'حدث خطأ في تقديم الطلب: ' + err.message }, { status: 500 })
  }
}
