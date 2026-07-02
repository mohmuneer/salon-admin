'use client'
import Link from 'next/link'
import { Award, ArrowLeft, ArrowRight } from 'lucide-react'
import ChartCard from './ChartCard'
import { AvatarLetter } from './shared'

export default function StaffPerformanceList({ data, isAr, GOLD }: { data: any[]; isAr: boolean; GOLD: string }) {
  return (
    <ChartCard
      icon={Award}
      title={isAr ? 'أداء الموظفين' : 'Staff Performance'}
      action={
        <Link href="/staff" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
          {isAr ? 'عرض الكل' : 'View All'}
          {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
        </Link>
      }
    >
      <div style={{ padding: '4px 0' }}>
        {data.map((s: any, i: number) => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 22px', borderBottom: i < data.length - 1 ? '1px solid var(--border-light)' : 'none',
          }}>
            <AvatarLetter name={isAr ? s.name : s.nameEn} index={i} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{isAr ? s.name : s.nameEn}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isAr ? s.role : s.roleEn}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 10px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>{s.rating}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isAr ? 'تقييم' : 'Rating'}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 10px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>{s.completionRate}%</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isAr ? 'نسبة الإنجاز' : 'Completion'}</div>
            </div>
            <div style={{ textAlign: 'end' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{s.commission.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isAr ? 'عمولة' : 'Comm.'}</div>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
