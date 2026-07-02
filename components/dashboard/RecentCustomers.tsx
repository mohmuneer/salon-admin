'use client'
import Link from 'next/link'
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react'
import ChartCard from './ChartCard'
import { AvatarLetter } from './shared'

export default function RecentCustomers({ data, isAr }: { data: any[]; isAr: boolean }) {
  return (
    <ChartCard
      icon={Clock}
      title={isAr ? 'عملاء حديثون' : 'Recent Customers'}
      action={
        <Link href="/customers" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
          {isAr ? 'عرض الكل' : 'View All'}
          {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
        </Link>
      }
    >
      <div style={{ padding: '4px 0' }}>
        {data.map((c: any, i: number) => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 22px', borderBottom: i < data.length - 1 ? '1px solid var(--border-light)' : 'none',
          }}>
            <AvatarLetter name={isAr ? c.name : c.nameEn} index={i} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{isAr ? c.name : c.nameEn}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {isAr ? 'آخر زيارة' : 'Last visit'}: {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>
            <div style={{ textAlign: 'end' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{c.visits}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isAr ? 'زيارة' : 'visits'}</div>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
