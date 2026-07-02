'use client'
import Link from 'next/link'
import { Calendar, ArrowLeft, ArrowRight } from 'lucide-react'
import ChartCard from './ChartCard'
import { AvatarLetter, StatusPill, StatusPillEn } from './shared'
import { STATUS_COLORS } from './constants'

export default function BookingsList({ data, isAr }: { data: any[]; isAr: boolean }) {
  return (
    <ChartCard
      icon={Calendar}
      title={isAr ? 'مواعيد اليوم' : "Today's Schedule"}
      action={
        <Link href="/appointments" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
          {isAr ? 'عرض الكل' : 'View All'}
          {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
        </Link>
      }
    >
      <div style={{ padding: '4px 0' }}>
        {data.map((a: any, i: number) => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 22px', transition: 'background 0.15s',
            borderBottom: i < data.length - 1 ? '1px solid var(--border-light)' : 'none',
          }}>
            <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{a.time}</div>
            </div>
            <div style={{ width: 3, height: 32, borderRadius: 2, background: STATUS_COLORS[a.status] || 'var(--border)', flexShrink: 0 }} />
            <AvatarLetter name={isAr ? a.customer : a.customerEn} index={i} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isAr ? a.customer : a.customerEn}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {isAr ? a.service : a.serviceEn} · {isAr ? a.staff : a.staffEn}
              </div>
            </div>
            {isAr ? <StatusPill status={a.status} /> : <StatusPillEn status={a.status} />}
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
