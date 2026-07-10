'use client'

interface DataTableProps {
  children: React.ReactNode
  className?: string
  insideCard?: boolean
  maxHeight?: string | number
}

export default function DataTable({ children, className = '', insideCard = false, maxHeight }: DataTableProps) {
  return (
    <div
      className={`table-container${insideCard ? ' inside-card' : ''}${className ? ' ' + className : ''}`}
      style={maxHeight ? { maxHeight } : {}}
    >
      <table className="data-table">
        {children}
      </table>
    </div>
  )
}
