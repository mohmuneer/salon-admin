'use client'

import { useRef, useCallback, useEffect } from 'react'

interface DataTableProps {
  children: React.ReactNode
  className?: string
  insideCard?: boolean
  maxHeight?: string | number
}

export default function DataTable({ children, className = '', insideCard = false, maxHeight }: DataTableProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef({ isDown: false, startX: 0, startY: 0, scrollX: 0, scrollY: 0, moved: false })

  const onStart = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current
    if (!el) return
    stateRef.current = {
      isDown: true,
      startX: clientX,
      startY: clientY,
      scrollX: el.scrollLeft,
      scrollY: el.scrollTop,
      moved: false,
    }
    el.classList.add('dragging')
    el.style.cursor = 'grabbing'
  }, [])

  const onMove = useCallback((clientX: number, clientY: number) => {
    const s = stateRef.current
    if (!s.isDown) return
    const dx = clientX - s.startX
    const dy = clientY - s.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) s.moved = true
    const el = containerRef.current
    if (el) {
      el.scrollLeft = s.scrollX - dx
      el.scrollTop = s.scrollY - dy
    }
  }, [])

  const onEnd = useCallback(() => {
    const el = containerRef.current
    if (el) el.classList.remove('dragging')
    stateRef.current.isDown = false
    el!.style.cursor = ''
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleMouseDown = (e: MouseEvent) => { e.preventDefault(); onStart(e.clientX, e.clientY) }
    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const handleMouseUp = () => onEnd()
    const handleMouseLeave = () => { if (stateRef.current.isDown) onEnd() }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      onStart(e.touches[0].clientX, e.touches[0].clientY)
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      onMove(e.touches[0].clientX, e.touches[0].clientY)
    }
    const handleTouchEnd = () => onEnd()

    el.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    el.addEventListener('mouseleave', handleMouseLeave)

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd)

    return () => {
      el.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      el.removeEventListener('mouseleave', handleMouseLeave)
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onStart, onMove, onEnd])

  return (
    <div
      ref={containerRef}
      className={`table-container${insideCard ? ' inside-card' : ''}${className ? ' ' + className : ''}`}
      style={maxHeight ? { maxHeight } : {}}
    >
      <table className="data-table">
        {children}
      </table>
    </div>
  )
}
