'use client'
import { useState, useRef, useEffect } from 'react'
import { Columns, Check } from 'lucide-react'
import { ReportColumn } from '@/lib/report-config'

export default function ReportColumnToggle({
  columns,
  visible,
  onChange,
  lang,
}: {
  columns: ReportColumn[]
  visible: string[]
  onChange: (keys: string[]) => void
  lang: 'ar' | 'en'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (key: string) => {
    const next = visible.includes(key)
      ? visible.filter(k => k !== key)
      : [...visible, key]
    if (next.length > 0) onChange(next)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', border: '1px solid #D1D5DB',
          borderRadius: 8, background: '#fff', cursor: 'pointer',
          fontSize: 13, color: '#374151', fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        <Columns size={16} />
        {lang === 'ar' ? 'إظهار/إخفاء الأعمدة' : 'Show/Hide Columns'}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 4,
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 50,
            minWidth: 220, padding: 8,
          }}
        >
          {columns.filter(c => c.key !== 'id').map(col => {
            const isVisible = visible.includes(col.key)
            return (
              <label
                key={col.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                  fontSize: 13, color: '#374151',
                  background: isVisible ? '#FEF3E2' : 'transparent',
                }}
              >
                <div
                  style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: isVisible ? 'none' : '2px solid #D1D5DB',
                    background: isVisible ? 'var(--gold)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isVisible && <Check size={12} color="white" strokeWidth={3} />}
                </div>
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggle(col.key)}
                  style={{ display: 'none' }}
                />
                {lang === 'ar' ? col.labelAr : col.labelEn}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
