'use client'

import { useRef, useCallback, useEffect } from 'react'

interface DataTableProps {
  children: React.ReactNode
  className?: string
  insideCard?: boolean
  maxHeight?: string | number
  disableDragScroll?: boolean
}

const DRAG_THRESHOLD = 5

export default function DataTable({ children, className = '', insideCard = false, maxHeight, disableDragScroll }: DataTableProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const s = useRef({ down: false, startX: 0, startY: 0, scrollX: 0, scrollY: 0, moved: false })

  const onStart = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current
    if (!el) return
    s.current = { down: true, startX: clientX, startY: clientY, scrollX: el.scrollLeft, scrollY: el.scrollTop, moved: false }
    el.classList.add('dragging')
  }, [])

  const onMove = useCallback((clientX: number, clientY: number) => {
    const st = s.current
    if (!st.down) return
    const dx = clientX - st.startX
    const dy = clientY - st.startY
    if (!st.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) st.moved = true
    const el = containerRef.current
    if (el) {
      el.scrollLeft = st.scrollX - dx
      el.scrollTop = st.scrollY - dy
    }
  }, [])

  const onEnd = useCallback(() => {
    const el = containerRef.current
    if (el) el.classList.remove('dragging')
    s.current.down = false
  }, [])

  const handleClickCapture = useCallback((e: MouseEvent) => {
    if (s.current.moved) {
      e.stopPropagation()
      e.preventDefault()
    }
  }, [])

  useEffect(() => {
    if (disableDragScroll) return
    const el = containerRef.current
    if (!el) return

    const mouseDown = (e: MouseEvent) => onStart(e.clientX, e.clientY)
    const mouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const mouseUp = () => onEnd()

    const touchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      onStart(e.touches[0].clientX, e.touches[0].clientY)
    }
    const touchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      onMove(e.touches[0].clientX, e.touches[0].clientY)
    }
    const touchEnd = () => onEnd()

    el.addEventListener('mousedown', mouseDown)
    window.addEventListener('mousemove', mouseMove)
    window.addEventListener('mouseup', mouseUp)
    el.addEventListener('mouseleave', mouseUp)
    el.addEventListener('click', handleClickCapture, true)

    el.addEventListener('touchstart', touchStart, { passive: true })
    el.addEventListener('touchmove', touchMove, { passive: true })
    el.addEventListener('touchend', touchEnd)

    return () => {
      el.removeEventListener('mousedown', mouseDown)
      window.removeEventListener('mousemove', mouseMove)
      window.removeEventListener('mouseup', mouseUp)
      el.removeEventListener('mouseleave', mouseUp)
      el.removeEventListener('click', handleClickCapture, true)
      el.removeEventListener('touchstart', touchStart)
      el.removeEventListener('touchmove', touchMove)
      el.removeEventListener('touchend', touchEnd)
    }
  }, [onStart, onMove, onEnd, handleClickCapture, disableDragScroll])

  return (
    <div
      ref={containerRef}
      className={`table-container${insideCard ? ' inside-card' : ''}${className ? ' ' + className : ''}`}
      style={maxHeight ? { maxHeight } : {}}
    >
      {children}
    </div>
  )
}
