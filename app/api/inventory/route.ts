import { NextResponse, NextRequest } from 'next/server'
import {
  getAllStockLevels, getTransactions, addTransaction, getProductsWithRecentMovements,
} from '@/lib/mock-inventory'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('product_id')
  const days = Number(searchParams.get('days')) || 30

  // Try DB first
  try {
    const productsResult = await pool.query(`
      SELECT p.id, p.name_ar, p.brand, p.category, p.price, p.cost, p.stock_qty AS current_stock,
             p.min_stock_alert, d.name_ar AS department_name, d.name_en AS department_name_en, d.id AS department_id
      FROM products p
      LEFT JOIN departments d ON d.id = p.department_id
      WHERE p.is_active = true
      ORDER BY p.name_ar
    `)

    const txResult = await pool.query(`
      SELECT id, product_id, type, quantity, prev_stock, new_stock, reference, notes, created_at,
             (SELECT name_ar FROM products WHERE id = product_id) AS product_name
      FROM inventory_transactions
      WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
      ORDER BY created_at DESC LIMIT 100
    `, [days])

    const inventoryData = productId
      ? productsResult.rows.filter((p: any) => String(p.id) === productId)
      : productsResult.rows

    return NextResponse.json({
      products: inventoryData.map((p: any) => ({
        ...p,
        total_received: 0,
        total_dispensed: 0,
      })),
      transactions: txResult.rows,
    })
  } catch {
    // Fallback to mock
    const inventoryData = productId
      ? getAllStockLevels().filter(p => String(p.id) === productId)
      : getAllStockLevels()

    const txs = getTransactions(productId || undefined, days)

    return NextResponse.json({ products: inventoryData, transactions: txs })
  }
}

export async function POST(req: NextRequest) {
  const { product_id, type, quantity, reference, notes } = await req.json()

  // Try DB first
  try {
    await pool.query(
      `INSERT INTO inventory_transactions (product_id, type, quantity, reference, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [product_id, type, quantity, reference || '', notes || '']
    )
    return NextResponse.json({ ok: true })
  } catch {
    const tx = addTransaction(product_id, type, quantity, reference || '', notes || '')
    if (!tx) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    return NextResponse.json({ ok: true, transaction: tx })
  }
}
