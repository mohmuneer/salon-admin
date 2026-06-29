'use client'
import { useState, useEffect } from 'react'

interface PriceInputProps {
  value: number | string
  onChange: (value: number) => void
  currencySymbol?: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export default function PriceInput({
  value,
  onChange,
  currencySymbol,
  label,
  placeholder,
  required,
  disabled,
  className,
}: PriceInputProps) {
  const [display, setDisplay] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (value === 0 || value === '' || value === null || value === undefined) {
      setDisplay('')
    } else {
      setDisplay(String(value))
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value

    if (raw === '') {
      setDisplay('')
      if (required) {
        setError('field_required')
      } else {
        setError('')
        onChange(0)
      }
      return
    }

    const cleaned = raw.replace(/[^0-9.]/g, '')

    const parts = cleaned.split('.')
    if (parts.length > 2) return
    if (parts[1] && parts[1].length > 2) return

    const num = parseFloat(cleaned)
    if (isNaN(num)) {
      setError('invalid_number')
      setDisplay(cleaned)
      return
    }
    if (num < 0) {
      setError('negative_not_allowed')
      return
    }

    setError('')
    setDisplay(cleaned)
    onChange(num)
  }

  const handleBlur = () => {
    if (display === '' || display === '0') {
      if (required) {
        setError('field_required')
      }
      return
    }
    const num = parseFloat(display)
    if (!isNaN(num)) {
      setDisplay(num.toFixed(2))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault()
    }
  }

  return (
    <div>
      {label && (
        <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 6 }}>
          {label}
          {required && <span style={{ color: '#EF4444', marginInlineStart: 2 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          className={className || 'input-field'}
          type="text"
          inputMode="decimal"
          value={display}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || '0.00'}
          disabled={disabled}
          style={{
            ...(currencySymbol ? { paddingInlineEnd: 50 } : {}),
            ...(error ? { borderColor: '#EF4444' } : {}),
          }}
        />
        {currencySymbol && (
          <span style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            insetInlineEnd: 12,
            fontSize: 13,
            color: '#9CA3AF',
            fontWeight: 600,
            pointerEvents: 'none',
          }}>
            {currencySymbol}
          </span>
        )}
      </div>
      {error === 'field_required' && (
        <span style={{ fontSize: 12, color: '#EF4444', marginTop: 4, display: 'block' }}>
          {required ? 'هذا الحقل مطلوب' : 'This field is required'}
        </span>
      )}
      {error === 'invalid_number' && (
        <span style={{ fontSize: 12, color: '#EF4444', marginTop: 4, display: 'block' }}>
          يرجى إدخال رقم صحيح
        </span>
      )}
      {error === 'negative_not_allowed' && (
        <span style={{ fontSize: 12, color: '#EF4444', marginTop: 4, display: 'block' }}>
          لا يُسمح بالقيم السالبة
        </span>
      )}
    </div>
  )
}
