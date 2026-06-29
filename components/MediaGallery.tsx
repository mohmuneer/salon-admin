'use client'
import { useState, useRef, useCallback } from 'react'
import { Upload, X, Star, GripVertical, ImageIcon, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

export interface GalleryImage {
  id?: string | number
  url: string
  thumbnail_url?: string
  is_primary?: boolean
  sort_order?: number
  image_type?: string
}

interface Props {
  images: GalleryImage[]
  onChange: (images: GalleryImage[]) => void
  maxFiles?: number
  multiple?: boolean
  showPrimary?: boolean
  showType?: boolean
  imageTypes?: { value: string; label: string; labelAr: string }[]
  lang?: 'ar' | 'en'
  label?: string
  description?: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024

export default function MediaGallery({
  images, onChange, maxFiles = 20, multiple = true, showPrimary = true,
  showType = false, imageTypes = [], lang = 'en', label, description,
}: Props) {
  const isAr = lang === 'ar'
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadFiles = useCallback(async (files: FileList) => {
    setError(null)
    const fileArray = Array.from(files).slice(0, maxFiles - images.length)

    for (const file of fileArray) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(isAr ? 'نوع الملف غير مدعوم. المسموح: JPG, PNG, WEBP' : 'Unsupported file type. Allowed: JPG, PNG, WEBP')
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(isAr ? `الملف كبير جداً. الحد الأقصى: ${MAX_FILE_SIZE / 1024 / 1024}MB` : `File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
        continue
      }

      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.url) {
          onChange([...images, {
            url: data.url,
            thumbnail_url: data.thumbnail_url || data.url,
            is_primary: images.length === 0 && showPrimary,
            sort_order: images.length,
            image_type: 'gallery',
          }])
        } else {
          setError(data.error || 'Upload failed')
        }
      } catch {
        setError(isAr ? 'فشل رفع الصورة' : 'Upload failed')
      }
      setUploading(false)
    }
  }, [images, maxFiles, onChange, showPrimary, isAr])

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index).map((img, i) => ({
      ...img,
      sort_order: i,
      is_primary: img.is_primary || (i === 0 && showPrimary && !images.some((_, j) => j !== index && images[j].is_primary)),
    }))
    onChange(updated)
  }

  const setPrimary = (index: number) => {
    onChange(images.map((img, i) => ({ ...img, is_primary: i === index })))
  }

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return
    const updated = [...images]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    onChange(updated.map((img, i) => ({ ...img, sort_order: i })))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  return (
    <div>
      {label && <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6, fontWeight: 600 }}>{label}</label>}
      {description && <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 8px 0' }}>{description}</p>}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#FEF2F2', borderRadius: 10, marginBottom: 10, fontSize: 13, color: '#DC2626' }}>
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><X size={14} /></button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileRef.current?.click()}
        style={{
          border: '2px dashed #D1D5DB', borderRadius: 12, padding: '24px 16px',
          textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
          background: uploading ? '#F9FAFB' : 'transparent',
          marginBottom: 12,
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={multiple}
          onChange={e => { if (e.target.files) uploadFiles(e.target.files) }}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <div style={{ color: '#6B7280', fontSize: 14 }}>
            <Upload size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
            {isAr ? 'جاري الرفع...' : 'Uploading...'}
          </div>
        ) : (
          <div style={{ color: '#9CA3AF', fontSize: 14 }}>
            <ImageIcon size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
            {isAr ? 'اسحب وأفلت الصور هنا أو انقر للاختيار' : 'Drag & drop images here or click to browse'}
            <div style={{ fontSize: 11, marginTop: 4 }}>{isAr ? 'JPG, PNG, WEBP - حد أقصى 5MB' : 'JPG, PNG, WEBP - Max 5MB'}</div>
          </div>
        )}
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
          {images.map((img, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={e => { e.preventDefault(); if (dragIndex !== null && dragIndex !== index) moveImage(dragIndex, index) }}
              onDragEnd={() => setDragIndex(null)}
              style={{
                position: 'relative', borderRadius: 10, overflow: 'hidden',
                border: img.is_primary ? '2px solid var(--primary-500)' : '2px solid #E8E4DC',
                aspectRatio: '1', background: '#F9FAFB',
                cursor: 'grab', transition: 'all 0.2s',
                opacity: dragIndex === index ? 0.5 : 1,
              }}
            >
              <img
                src={img.thumbnail_url || img.url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onClick={() => setPreviewIndex(index)}
              />

              {/* Primary badge */}
              {img.is_primary && showPrimary && (
                <div style={{ position: 'absolute', top: 2, left: 2, background: 'var(--primary-500)', color: '#fff', borderRadius: 6, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>
                  {isAr ? 'رئيسي' : 'MAIN'}
                </div>
              )}

              {/* Image type badge */}
              {showType && img.image_type && img.image_type !== 'gallery' && (
                <div style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 9 }}>
                  {imageTypes.find(t => t.value === img.image_type)?.[isAr ? 'labelAr' : 'label'] || img.image_type}
                </div>
              )}

              {/* Actions overlay */}
              <div style={{ position: 'absolute', top: 2, right: 2, display: 'flex', gap: 2 }}>
                {showPrimary && !img.is_primary && (
                  <button
                    onClick={e => { e.stopPropagation(); setPrimary(index) }}
                    title={isAr ? 'تعيين كصورة رئيسية' : 'Set as main'}
                    style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 6, padding: 3, cursor: 'pointer', color: '#fff', display: 'flex' }}
                  >
                    <Star size={11} />
                  </button>
                )}
                <button
                  onClick={e => { e.stopPropagation(); removeImage(index) }}
                  title={isAr ? 'حذف' : 'Delete'}
                  style={{ background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: 6, padding: 3, cursor: 'pointer', color: '#fff', display: 'flex' }}
                >
                  <X size={11} />
                </button>
              </div>

              {/* Drag handle */}
              <div style={{ position: 'absolute', bottom: 2, right: 2, color: 'rgba(255,255,255,0.6)', display: 'flex' }}>
                <GripVertical size={11} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewIndex !== null && (
        <div
          onClick={() => setPreviewIndex(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.9)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            padding: 20, cursor: 'pointer',
          }}
        >
          <button
            onClick={() => setPreviewIndex(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 12, padding: 10, cursor: 'pointer', color: '#fff' }}
          >
            <X size={24} />
          </button>

          {previewIndex > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setPreviewIndex(previewIndex - 1) }}
              style={{ position: 'absolute', left: 20, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 12, padding: 10, cursor: 'pointer', color: '#fff' }}
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <img
            src={images[previewIndex].url}
            alt=""
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
            onClick={e => e.stopPropagation()}
          />

          {previewIndex < images.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setPreviewIndex(previewIndex + 1) }}
              style={{ position: 'absolute', right: 70, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 12, padding: 10, cursor: 'pointer', color: '#fff' }}
            >
              <ChevronRight size={24} />
            </button>
          )}

          <div style={{ position: 'absolute', bottom: 20, color: '#fff', fontSize: 14, opacity: 0.7 }}>
            {previewIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  )
}
