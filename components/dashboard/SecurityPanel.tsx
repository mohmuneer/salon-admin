'use client'
import { Shield, LogIn, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ChartWrapper from '@/components/ChartWrapper'
import ChartCard from './ChartCard'
import { ChartTooltip } from './shared'
import { MOCK_SECURITY } from './constants'

export default function SecurityPanel({ isAr, GOLD }: { isAr: boolean; GOLD: string }) {
  const items = [
    { icon: LogIn, label: isAr ? 'جلسات نشطة' : 'Active Sessions', value: MOCK_SECURITY.activeSessions, color: '#10B981' },
    { icon: Users, label: isAr ? 'إجمالي المستخدمين' : 'Total Users', value: MOCK_SECURITY.totalUsers, color: GOLD },
    { icon: AlertTriangle, label: isAr ? 'محاولات فاشلة اليوم' : "Today's Failed", value: MOCK_SECURITY.failedToday, color: '#EF4444' },
    { icon: CheckCircle, label: isAr ? 'المصادقة الثنائية' : '2FA Enabled', value: isAr ? 'مفعل' : 'Active', color: '#8B5CF6' },
  ]
  return (
    <ChartCard icon={Shield} title={isAr ? 'لوحة الأمان' : 'Security'}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {items.map((item, i) => (
          <div key={i} style={{ padding: '14px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <item.icon size={14} color={item.color} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{item.value}</div>
          </div>
        ))}
      </div>
      <ChartWrapper height={100}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK_SECURITY.loginActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={isAr ? 'date' : 'dateEn'} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="success" stroke="#10B981" strokeWidth={2} dot={false} name={isAr ? 'ناجح' : 'Success'} />
            <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} dot={false} name={isAr ? 'فاشل' : 'Failed'} />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </ChartCard>
  )
}
