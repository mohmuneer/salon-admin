import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import path from 'path'
import crypto from 'crypto'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE      = 5 * 1024 * 1024 // 5 MB

function sanitizeFilename(original: string): string {
  const ext = path.extname(original).toLowerCase() || '.jpg'
  const hash = crypto.randomBytes(8).toString('hex')
  return `${Date.now()}-${hash}${ext}`
}

async function uploadToBlob(buffer: Buffer, filename: string, contentType: string): Promise<string | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return null
  try {
    const { put } = await import('@vercel/blob')
    const blob = await put(`uploads/${filename}`, buffer, { access: 'public', contentType, token })
    return blob.url
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file           = formData.get('file')            as File | null
    const customer_name  = (formData.get('customer_name')  as string) || ''
    const customer_phone = (formData.get('customer_phone') as string) || ''
    const claimedAmount  = parseFloat((formData.get('amount') as string) || '0')
    const order_id       = (formData.get('order_id')       as string) || null
    const apptIdsRaw     = (formData.get('appointment_ids') as string) || '[]'
    const payment_method = (formData.get('payment_method') as string) || 'bank_transfer'

    let appointment_ids: string[] = []
    try { appointment_ids = JSON.parse(apptIdsRaw) } catch {}
    appointment_ids = appointment_ids.filter(id => typeof id === 'string' && id)

    if (!file) {
      return NextResponse.json({ error: 'يرجى إرفاق صورة سند الحوالة' }, { status: 400 })
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مسموح به. يُقبل JPG, PNG, WEBP أو GIF فقط' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز 5MB' }, { status: 400 })
    }

    /* ── Validate order/appointments actually exist, and compute the
       REAL expected amount server-side. The customer's claimed `amount`
       is stored for reference only - it is never trusted as the source
       of truth, so admins can spot a mismatch before verifying. ── */
    let expectedAmount = 0

    if (order_id) {
      const order = await pool.query('SELECT total FROM orders WHERE id::text = $1', [order_id])
      if (order.rows.length === 0) {
        return NextResponse.json({ error: 'رقم الطلب غير صحيح' }, { status: 400 })
      }
      expectedAmount += Number(order.rows[0].total) || 0

      const existingPending = await pool.query(
        `SELECT id FROM payment_receipts WHERE order_id = $1 AND status = 'pending'`, [order_id]
      )
      if (existingPending.rows.length > 0) {
        return NextResponse.json({ error: 'يوجد سند حوالة قيد المراجعة بالفعل لهذا الطلب' }, { status: 409 })
      }
    }

    if (appointment_ids.length > 0) {
      const appts = await pool.query(
        'SELECT id, total FROM appointments WHERE id::text = ANY($1::text[])', [appointment_ids]
      )
      if (appts.rows.length !== appointment_ids.length) {
        return NextResponse.json({ error: 'بعض المواعيد غير صحيحة' }, { status: 400 })
      }
      expectedAmount += appts.rows.reduce((s, r) => s + (Number(r.total) || 0), 0)
    }

    if (!order_id && appointment_ids.length === 0) {
      return NextResponse.json({ error: 'لا يوجد طلب أو موعد مرتبط بهذا السند' }, { status: 400 })
    }

    /* ── Store the receipt image via Blob/local file storage,
       never as base64 text in the database. ── */
    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = sanitizeFilename(file.name).replace(path.extname(file.name), '.jpg')
    const compressed = await sharp(buffer)
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer()

    const blobUrl = await uploadToBlob(compressed, filename, 'image/jpeg')
    let receipt_url: string
    if (blobUrl) {
      receipt_url = blobUrl
    } else {
      // Vercel: writable only at /tmp; local dev: public/uploads
      const isVercel = !!process.env.VERCEL
      const uploadDir = isVercel
        ? path.join('/tmp', 'uploads')
        : path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadDir, { recursive: true })
      await writeFile(path.join(uploadDir, filename), compressed)
      receipt_url = isVercel
        ? `/api/uploads/${filename}`
        : `/api/uploads/${filename}`
    }

    const receiptResult = await pool.query(
      `INSERT INTO payment_receipts
         (order_id, appointment_ids, customer_name, customer_phone, receipt_url, amount, expected_amount, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [order_id, appointment_ids, customer_name, customer_phone, receipt_url, claimedAmount, expectedAmount, payment_method]
    )

    const receiptId = receiptResult.rows[0].id

    // Also insert into payments table for linked appointments
    for (const apptId of appointment_ids) {
      await pool.query(
        `INSERT INTO payments (source_type, source_id, amount, method, status, paid_at)
         VALUES ('appointment', $1::uuid, $2, $3, 'pending', NOW())`,
        [apptId, claimedAmount, payment_method]
      ).catch(() => {})
    }

    // Also insert into payments table for linked order
    if (order_id) {
      await pool.query(
        `INSERT INTO payments (source_type, source_id, amount, method, status, paid_at)
         VALUES ('order', $1::uuid, $2, $3, 'pending', NOW())`,
        [order_id, claimedAmount, payment_method]
      ).catch(() => {})
    }

    return NextResponse.json({ ok: true, id: receiptId })
  } catch (err: any) {
    console.error('[public-transfer-receipt POST]', err.message)
    return NextResponse.json({ error: err.message || 'حدث خطأ في الرفع' }, { status: 500 })
  }
}
