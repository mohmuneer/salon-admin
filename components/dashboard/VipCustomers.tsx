'use client'
import Link from 'next/link'
import { Heart, ArrowLeft, ArrowRight } from 'lucide-react'
import ChartCard from './ChartCard'
import { AvatarLetter } from './shared'

export default function VipCustomers({ data, isAr, GOLD }: { data: any[]; isAr: boolean; GOLD: string }) {
  return (
    <ChartCard
      icon={Heart}
      title={isAr ? 'عملاء VIP' : 'VIP Customers'}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.visits} {isAr ? 'زيارة' : 'visits'}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 10,
                  background: c.tier === 'بلاتينيوم' || c.tier === 'Platinum' ? 'rgba(201,165,95,0.15)' : c.tier === 'ذهب' || c.tier === 'Gold' ? 'rgba(245,158,11,0.12)' : 'rgba(156,163,175,0.12)',
                  color: c.tier === 'بلاتينيوم' || c.tier === 'Platinum' ? GOLD : c.tier === 'ذهب' || c.tier === 'Gold' ? '#F59E0B' : '#9CA3AF',
                }}>{isAr ? c.tier : c.tierEn}</span>
              </div>
            </div>
            <div style={{ textAlign: 'end' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{c.spent.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.points} {isAr ? 'نقطة' : 'pts'}</div>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
