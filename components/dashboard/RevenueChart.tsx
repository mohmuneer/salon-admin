'use client'
import { TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ChartWrapper from '@/components/ChartWrapper'
import ChartCard from './ChartCard'
import { ChartTooltip } from './shared'

export default function RevenueChart({ data, isAr, GOLD }: { data: any[]; isAr: boolean; GOLD: string }) {
  return (
    <ChartCard
      icon={TrendingUp}
      title={isAr ? 'اتجاه الإيرادات' : 'Revenue Trend'}
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          {[isAr ? 'شهري' : 'Monthly', isAr ? 'سنوي' : 'Yearly'].map((l, i) => (
            <button key={l} className={`btn btn-chip ${i === 0 ? 'active' : ''}`}>{l}</button>
          ))}
        </div>
      }
    >
      <ChartWrapper height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={isAr ? 'month' : 'monthEn'} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={3} fill="url(#revGrad)" name={isAr ? 'الإيرادات' : 'Revenue'} />
            <Area type="monotone" dataKey="target" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="6 4" fill="none" name={isAr ? 'الهدف' : 'Target'} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </ChartCard>
  )
}
