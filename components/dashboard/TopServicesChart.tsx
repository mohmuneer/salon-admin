'use client'
import { BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import ChartWrapper from '@/components/ChartWrapper'
import ChartCard from './ChartCard'
import { ChartTooltip } from './shared'

export default function TopServicesChart({ data, isAr, CHART_COLORS }: { data: any[]; isAr: boolean; CHART_COLORS: string[] }) {
  return (
    <ChartCard icon={BarChart3} title={isAr ? 'أكثر الخدمات طلباً' : 'Top Services'} bodyStyle={{ height: 260 }}>
      <ChartWrapper height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey={isAr ? 'name' : 'nameEn'} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={100} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="bookings" radius={[0, 6, 6, 0]} name={isAr ? 'حجوزات' : 'Bookings'}>
              {data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </ChartCard>
  )
}
