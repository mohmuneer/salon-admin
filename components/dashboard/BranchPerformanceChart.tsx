'use client'
import { Target } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import ChartWrapper from '@/components/ChartWrapper'
import ChartCard from './ChartCard'
import { ChartTooltip } from './shared'
import { MOCK_BRANCHES } from './constants'

export default function BranchPerformanceChart({ isAr, GOLD }: { isAr: boolean; GOLD: string }) {
  return (
    <ChartCard icon={Target} title={isAr ? 'أداء الفروع' : 'Branch Performance'} bodyStyle={{ height: 300 }}>
      <ChartWrapper height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={MOCK_BRANCHES}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey={isAr ? 'name' : 'nameEn'} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
            <PolarRadiusAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} />
            <Radar name={isAr ? 'الإيرادات' : 'Revenue'} dataKey="revenue" stroke={GOLD} fill={GOLD} fillOpacity={0.15} strokeWidth={2} />
            <Radar name={isAr ? 'العملاء' : 'Customers'} dataKey="customers" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </ChartCard>
  )
}
