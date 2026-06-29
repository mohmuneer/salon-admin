import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import crypto from 'crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024

function sanitizeFilename(original: string): string {
  const ext = path.extname(original).toLowerCase()
  const hash = crypto.randomBytes(8).toString('hex')
  return `${Date.now()}-${hash}${ext}`
}

// Upload to Vercel Blob if token exists, otherwise save locally
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
    const mode = (formData.get('mode') as string) || 'single'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}. Allowed: JPG, PNG, WEBP` }, { status: 400 })
    }

    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: `Unsupported extension: ${ext}` }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 })
    }

    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = sanitizeFilename(file.name)

    const compressed = await sharp(buffer)
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()

    const thumbFilename = `thumb-${filename}`
    const thumbnail = await sharp(buffer)
      .resize(150, 150, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 60 })
      .toBuffer()

    // Try Vercel Blob first (production), fallback to local (development)
    const blobUrl      = await uploadToBlob(compressed, filename, 'image/jpeg')
    const blobThumbUrl = blobUrl ? await uploadToBlob(thumbnail, thumbFilename, 'image/jpeg') : null

    let url: string
    let thumbnail_url: string

    if (blobUrl) {
      // Production: Vercel Blob
      url = blobUrl
      thumbnail_url = blobThumbUrl || blobUrl
    } else {
      // Development: local filesystem
      const adminDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(adminDir, { recursive: true })
      await writeFile(path.join(adminDir, filename), compressed)
      await writeFile(path.join(adminDir, thumbFilename), thumbnail)

      // Sync to customer app locally
      try {
        const customerDir = path.join(process.cwd(), '..', 'glamour-customer', 'public', 'uploads')
        await mkdir(customerDir, { recursive: true })
        await writeFile(path.join(customerDir, filename), compressed)
        await writeFile(path.join(customerDir, thumbFilename), thumbnail)
      } catch {}

      url           = `/api/uploads/${filename}`
      thumbnail_url = `/api/uploads/${thumbFilename}`
    }

    const result: any = { url, thumbnail_url, filename }

    if (mode === 'product_gallery') {
      const squareBuffer = await sharp(buffer)
        .resize(400, 400, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 75 })
        .toBuffer()

      const landscapeBuffer = await sharp(buffer)
        .resize(800, 450, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 75 })
        .toBuffer()

      const squareFilename    = `square-${filename}`
      const landscapeFilename = `landscape-${filename}`

      if (blobUrl) {
        result.square_url    = await uploadToBlob(squareBuffer,    squareFilename,    'image/jpeg') || url
        result.landscape_url = await uploadToBlob(landscapeBuffer, landscapeFilename, 'image/jpeg') || url
      } else {
        const adminDir = path.join(process.cwd(), 'public', 'uploads')
        await writeFile(path.join(adminDir, squareFilename), squareBuffer)
        await writeFile(path.join(adminDir, landscapeFilename), landscapeBuffer)
        result.square_url    = `/api/uploads/${squareFilename}`
        result.landscape_url = `/api/uploads/${landscapeFilename}`
      }
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
