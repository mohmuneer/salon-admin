'use client'
import { Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ChartWrapper from '@/components/ChartWrapper'
import ChartCard from './ChartCard'
import { ChartTooltip } from './shared'

export default function CustomerGrowthChart({ data, isAr, GOLD }: { data: any[]; isAr: boolean; GOLD: string }) {
  return (
    <ChartCard icon={Activity} title={isAr ? 'نمو العملاء' : 'Customer Growth'} bodyStyle={{ height: 260 }}>
      <ChartWrapper height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={isAr ? 'month' : 'monthEn'} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="new" stroke={GOLD} strokeWidth={2} dot={{ fill: GOLD, strokeWidth: 0, r: 3 }} name={isAr ? 'جدد' : 'New'} />
            <Line type="monotone" dataKey="returning" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', strokeWidth: 0, r: 3 }} name={isAr ? 'عادون' : 'Returning'} />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </ChartCard>
  )
}
