'use client'

import { useEffect, useRef } from 'react'
import Sortable from 'sortablejs'

interface DraggableBodyProps {
  children: React.ReactNode
  onReorder?: (items: { id: string; position: number }[]) => void
}

export default function DraggableBody({ children, onReorder }: DraggableBodyProps) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null)

  useEffect(() => {
    const el = tbodyRef.current
    if (!el || !onReorder) return

    const sortable = Sortable.create(el, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      onEnd: () => {
        const rows = Array.from(el.children) as HTMLTableRowElement[]
        const reordered = rows.map((row, index) => ({
          id: row.getAttribute('data-id') || '',
          position: index + 1,
        }))
        onReorder(reordered)
      },
    })

    return () => sortable.destroy()
  }, [onReorder])

  return <tbody ref={tbodyRef}>{children}</tbody>
}
