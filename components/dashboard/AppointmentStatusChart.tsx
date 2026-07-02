'use client'
import { PieChart } from 'lucide-react'
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import ChartWrapper from '@/components/ChartWrapper'
import ChartCard from './ChartCard'
import { ChartTooltip } from './shared'

export default function AppointmentStatusChart({ data, isAr }: { data: any[]; isAr: boolean }) {
  const total = data.reduce((a: number, b: any) => a + b.value, 0)
  return (
    <ChartCard icon={PieChart} title={isAr ? 'حالة المواعيد' : 'Appointment Status'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: 280, width: '100%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ flex: '0 0 180px', height: '100%' }}>
          <ChartWrapper height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {data.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </RePieChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map((s: any) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{isAr ? s.name : s.nameEn}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.value}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 40, textAlign: 'end' }}>
                {total ? Math.round((s.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  )
}
