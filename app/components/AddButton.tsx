'use client'
import { useRef, useCallback } from 'react'
import { Plus } from 'lucide-react'

interface AddButtonProps {
  onClick: () => void
  label?: string
  adding?: boolean
  disabled?: boolean
  tooltip?: string
}

export default function AddButton({ onClick, label, adding, disabled, tooltip }: AddButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    const size = Math.max(rect.width, rect.height)
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`
    btn.appendChild(ripple)
    ripple.addEventListener('animationend', () => ripple.remove())
    onClick()
  }, [onClick])

  return (
    <button
      ref={btnRef}
      className={`btn-add${adding ? ' adding' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      title={tooltip}
    >
      <span className="add-glow" />
      <span className="add-icon"><Plus size={20} strokeWidth={2.5} /></span>
      {label && <span>{label}</span>}
      {tooltip && <span className="add-tooltip">{tooltip}</span>}
    </button>
  )
}
