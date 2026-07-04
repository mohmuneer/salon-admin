import { NextResponse } from 'next/server'
import pool from '@/lib/db'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE     = 5 * 1024 * 1024 // 5 MB

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_receipts (
      id               SERIAL PRIMARY KEY,
      order_id         TEXT,
      appointment_ids  TEXT[],
      customer_name    TEXT NOT NULL DEFAULT '',
      customer_phone   TEXT NOT NULL DEFAULT '',
      receipt_url      TEXT NOT NULL,
      amount           NUMERIC DEFAULT 0,
      payment_method   TEXT DEFAULT 'bank_transfer',
      status           TEXT DEFAULT 'pending',
      notes            TEXT DEFAULT '',
      created_at       TIMESTAMP DEFAULT NOW()
    )
  `)
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file           = formData.get('file')            as File | null
    const customer_name  = (formData.get('customer_name')  as string) || ''
    const customer_phone = (formData.get('customer_phone') as string) || ''
    const amount         = parseFloat((formData.get('amount') as string) || '0')
    const order_id       = (formData.get('order_id')       as string) || null
    const apptIdsRaw     = (formData.get('appointment_ids') as string) || '[]'
    const payment_method = (formData.get('payment_method') as string) || 'bank_transfer'

    let appointment_ids: string[] = []
    try { appointment_ids = JSON.parse(apptIdsRaw) } catch {}

    let receipt_url = 'no-receipt'

    if (file) {
      if (!ALLOWED_MIME.includes(file.type)) {
        return NextResponse.json({ error: 'نوع الملف غير مسموح به. يُقبل JPG أو PNG فقط' }, { status: 400 })
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'حجم الملف يتجاوز 5MB' }, { status: 400 })
      }

      const bytes  = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      receipt_url  = `data:${file.type};base64,${base64}`
    }

    await ensureTable()
    const receiptResult = await pool.query(
      `INSERT INTO payment_receipts
         (order_id, appointment_ids, customer_name, customer_phone, receipt_url, amount, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [order_id, appointment_ids, customer_name, customer_phone, receipt_url, amount, payment_method]
    )

    const receiptId = receiptResult.rows[0].id

    // Also insert into payments table for linked appointments
    for (const apptId of appointment_ids) {
      await pool.query(
        `INSERT INTO payments (source_type, source_id, amount, method, status, paid_at)
         VALUES ('appointment', $1::uuid, $2, $3, 'pending', NOW())`,
        [apptId, amount, payment_method]
      ).catch(() => {})
    }

    // Also insert into payments table for linked order
    if (order_id) {
      await pool.query(
        `INSERT INTO payments (source_type, source_id, amount, method, status, paid_at)
         VALUES ('order', $1::uuid, $2, $3, 'pending', NOW())`,
        [order_id, amount, payment_method]
      ).catch(() => {})
    }

    return NextResponse.json({ ok: true, id: receiptId })
  } catch (err: any) {
    console.error('[public-transfer-receipt POST]', err.message)
    return NextResponse.json({ error: err.message || 'حدث خطأ في الرفع' }, { status: 500 })
  }
}
