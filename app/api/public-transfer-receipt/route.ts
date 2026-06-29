import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import sharp from 'sharp'
import pool from '@/lib/db'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXT  = ['.jpg', '.jpeg', '.png', '.webp']
const MAX_SIZE     = 5 * 1024 * 1024 // 5MB

// Magic bytes for real image validation (prevents file masquerading)
const MAGIC: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
]

function checkMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  for (const sig of MAGIC) {
    if (sig.mime !== declaredMime && declaredMime !== 'image/webp') continue
    const offset = sig.offset ?? 0
    const match  = sig.bytes.every((b, i) => buffer[offset + i] === b)
    if (match) return true
  }
  // WebP also has 'WEBP' at bytes 8-11
  if (declaredMime === 'image/webp') {
    return (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    )
  }
  return false
}

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
    const file            = formData.get('file')             as File | null
    const customer_name   = (formData.get('customer_name')   as string) || ''
    const customer_phone  = (formData.get('customer_phone')  as string) || ''
    const amount          = parseFloat((formData.get('amount') as string) || '0')
    const order_id        = (formData.get('order_id')        as string) || null
    const apptIdsRaw      = (formData.get('appointment_ids') as string) || '[]'
    const payment_method  = (formData.get('payment_method')  as string) || 'bank_transfer'

    let appointment_ids: string[] = []
    try { appointment_ids = JSON.parse(apptIdsRaw) } catch {}

    if (!file) return NextResponse.json({ error: 'لم يتم إرفاق الملف' }, { status: 400 })

    // ── 1. MIME type check ──
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مسموح به. يُقبل JPG أو PNG أو WEBP فقط' }, { status: 400 })
    }

    // ── 2. Extension check ──
    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json({ error: 'امتداد الملف غير مسموح به' }, { status: 400 })
    }

    // ── 3. Size check ──
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز 5MB' }, { status: 400 })
    }

    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ── 4. Magic bytes check (real file content verification) ──
    if (!checkMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: 'الملف تالف أو محتواه لا يتطابق مع امتداده' }, { status: 400 })
    }

    // ── 5. Re-encode with sharp (strips metadata, embedded scripts, EXIF) ──
    let safeBuffer: Buffer
    try {
      safeBuffer = await sharp(buffer)
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer()
    } catch {
      return NextResponse.json({ error: 'فشل معالجة الصورة. تأكد من أن الملف صورة صالحة' }, { status: 400 })
    }

    // ── 6. Save file ──
    const hash     = crypto.randomBytes(12).toString('hex')
    const filename = `receipt-${Date.now()}-${hash}.jpg`
    const dir      = path.join(process.cwd(), 'public', 'uploads', 'receipts')
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, filename), safeBuffer)

    const receipt_url = `/api/uploads/receipts/${filename}`

    // ── 7. Store in DB ──
    await ensureTable()
    const result = await pool.query(
      `INSERT INTO payment_receipts (order_id, appointment_ids, customer_name, customer_phone, receipt_url, amount, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [order_id, appointment_ids, customer_name, customer_phone, receipt_url, amount, payment_method]
    )

    return NextResponse.json({ ok: true, id: result.rows[0].id, receipt_url })
  } catch (err: any) {
    console.error('[public-transfer-receipt POST]', err.message)
    return NextResponse.json({ error: err.message || 'حدث خطأ في الرفع' }, { status: 500 })
  }
}
