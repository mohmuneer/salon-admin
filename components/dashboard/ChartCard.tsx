'use client'
import { ReactNode } from 'react'
import { SectionTitle } from './shared'

export default function ChartCard({ icon, title, action, children, bodyStyle }: {
  icon: any; title: string; action?: ReactNode; children: ReactNode; bodyStyle?: React.CSSProperties
}) {
  return (
    <div className="card">
      <div className="card-header">
        <SectionTitle icon={icon} label={title} />
        {action}
      </div>
      <div className="card-body" style={bodyStyle}>
        {children}
      </div>
    </div>
  )
}
