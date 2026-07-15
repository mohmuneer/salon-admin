import { NextResponse, NextRequest } from 'next/server'
import pool from '@/lib/db'
import { mockOrders, addMockOrder } from '@/lib/mock-orders'

export async function GET(req: NextRequest) {
  try {
    const orderType = req.nextUrl.searchParams.get('order_type')
    let query = `
      SELECT o.id, u.name AS customer_name, u.phone,
             o.status, o.order_type, o.subtotal, o.discount, o.shipping_fee, o.total,
             o.payment_status, o.payment_method, o.created_at,
             COUNT(oi.id) AS items_count
      FROM orders o
      JOIN users u ON u.id = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
    `
    const params: any[] = []
    if (orderType && ['product', 'service', 'mixed'].includes(orderType)) {
      query += ` WHERE o.order_type = $1`
      params.push(orderType)
    }
    query += ` GROUP BY o.id, u.name, u.phone ORDER BY o.created_at DESC LIMIT 50`
    const result = await pool.query(query, params)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('DB unavailable, returning mock orders:', (err as Error).message)
    try {
      const ac = new AbortController()
      setTimeout(() => ac.abort(), 2000)
      const customerRes = await fetch('http://localhost:3002/api/internal/orders', { signal: ac.signal })
      if (customerRes.ok) {
        const customerOrders = await customerRes.json()
        const merged = [...mockOrders, ...customerOrders]
        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        return NextResponse.json(merged.slice(0, 50))
      }
    } catch {}
    return NextResponse.json(mockOrders)
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  try {
    const customer = await pool.query('SELECT id, name, phone FROM users WHERE phone=$1', [body.phone || ''])
    if (customer.rows.length === 0) throw new Error('customer not found')
    const order = await pool.query(
      `INSERT INTO orders (customer_id, salon_id, subtotal, total, shipping_address, status, payment_status, payment_method)
       VALUES ($1,(SELECT id FROM salons LIMIT 1),$2,$2,$3,'pending','pending',$4) RETURNING id`,
      [customer.rows[0].id, body.total || 0, body.address || '', body.payment_method || 'cash']
    )
    if (body.items) {
      for (const item of body.items) {
        await pool.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
          [order.rows[0].id, item.product_id, item.quantity, item.unit_price || 0]
        )
      }
    }
    return NextResponse.json({ ok: true, orderId: order.rows[0].id })
  } catch (err) {
    console.error('DB unavailable, creating mock order:', (err as Error).message)
    const order = addMockOrder({
      customer_name: body.customer_name || 'عميل', phone: body.phone || '',
      total: body.total || 0, payment_method: body.payment_method || 'cash',
      items_count: body.items?.length || 0,
    })
    return NextResponse.json({ ok: true, orderId: order.id })
  }
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  try {
    await pool.query('UPDATE orders SET status=$1 WHERE id=$2', [status, id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DB unavailable, updating mock order status:', (err as Error).message)
    const order = mockOrders.find(o => o.id === id)
    if (order) order.status = status
    return NextResponse.json({ ok: true })
  }
}
