import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { items, customerName, customerPhone, address, paymentMethod, debitBank, debitAccount, debitHolder } = await req.json()

    if (!items?.length || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    /* ── Resolve real prices server-side ──
       Never trust a price/total sent by the client - look up each product's
       current price and build the order from that, so a tampered request
       can't check out for less than the real total. */
    const resolvedItems: { productId: string; qty: number; price: number }[] = []
    for (const it of items) {
      const productId = it.productId || it.product_id
      const qty = Math.max(1, Math.floor(Number(it.qty || it.quantity) || 1))
      if (!productId) continue
      const prod = await pool.query(
        'SELECT price FROM products WHERE id = $1 AND is_active = true', [productId]
      ).catch(() => ({ rows: [] }))
      if (prod.rows.length === 0) continue // skip products that don't exist or are inactive
      resolvedItems.push({ productId, qty, price: Number(prod.rows[0].price) || 0 })
    }
    if (resolvedItems.length === 0) {
      return NextResponse.json({ error: 'لا توجد منتجات صالحة في الطلب' }, { status: 400 })
    }

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

    const subtotal = resolvedItems.reduce((s, it) => s + it.price * it.qty, 0)

    // Build notes including payment details
    let notes = `طلب عبر الموقع — ${customerName} — ${customerPhone}`
    if (address) notes += ` — ${address}`
    if (paymentMethod === 'bank_transfer') notes += ' — (حوالة بنكية)'
    if (paymentMethod === 'direct_debit' && debitBank) notes += ` — خصم من حساب: ${debitBank} / ${debitAccount} / ${debitHolder}`

    const result = await pool.query(
      `INSERT INTO orders (customer_id, salon_id, status, subtotal, discount, shipping_fee, total, shipping_address, payment_method, payment_status, notes)
       VALUES ($1, $2, 'pending', $3, 0, 0, $4, $5, $6, 'pending', $7) RETURNING id`,
      [customerId, salonId, subtotal, subtotal, address || '', validPayMethod, notes]
    )

    // Insert order items using the server-resolved prices
    // (subtotal is a GENERATED ALWAYS column - must not be included here)
    for (const it of resolvedItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
        [result.rows[0].id, it.productId, it.qty, it.price]
      )
    }

    return NextResponse.json({
      ok:      true,
      id:      `OR${Date.now().toString(36).toUpperCase()}`,
      dbId:    result.rows[0].id,
      message: 'تم تقديم الطلب بنجاح',
    })
  } catch (err: any) {
    console.error('[public-orders POST]', err.message)
    return NextResponse.json({ error: 'حدث خطأ في تقديم الطلب: ' + err.message }, { status: 500 })
  }
}
