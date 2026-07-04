import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import crypto from 'crypto'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf']
const MAX_FILE_SIZE = 8 * 1024 * 1024

function sanitizeFilename(original: string): string {
  const ext = path.extname(original).toLowerCase()
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
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'لم يتم إرفاق ملف' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. المسموح: JPG, PNG, WEBP, PDF' }, { status: 400 })
    }
    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: `امتداد غير مدعوم: ${ext}` }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `الملف كبير جداً. الحد الأقصى ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const filename = sanitizeFilename(file.name)

    const finalBuffer = isImage
      ? await sharp(buffer).resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
      : buffer
    const finalFilename = isImage ? filename.replace(ext, '.jpg') : filename
    const contentType = isImage ? 'image/jpeg' : 'application/pdf'

    const blobUrl = await uploadToBlob(finalBuffer, finalFilename, contentType)

    let url: string
    if (blobUrl) {
      url = blobUrl
    } else {
      const adminDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(adminDir, { recursive: true })
      await writeFile(path.join(adminDir, finalFilename), finalBuffer)
      url = `/api/uploads/${finalFilename}`
    }

    return NextResponse.json({ ok: true, url, name: file.name })
  } catch (err: any) {
    console.error('Supplier visit attachment upload error:', err)
    return NextResponse.json({ error: err.message || 'فشل رفع الملف' }, { status: 500 })
  }
}
