'use client'
import { Bell } from 'lucide-react'
import ChartCard from './ChartCard'
import { getNotifIcon, getNotifColor } from './shared'

export default function NotificationCenter({ data, isAr, GOLD }: { data: any[]; isAr: boolean; GOLD: string }) {
  const unread = data.filter((n: any) => !n.read).length
  return (
    <ChartCard
      icon={Bell}
      title={isAr ? 'مركز الإشعارات' : 'Notifications'}
      action={
        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
          {unread} {isAr ? 'جديد' : 'new'}
        </span>
      }
    >
      <div style={{ padding: '4px 0', maxHeight: 340, overflowY: 'auto' }}>
        {data.map((n: any, i: number) => {
          const Icon = getNotifIcon(n.type)
          const color = getNotifColor(n.type, GOLD)
          return (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 22px', cursor: 'pointer', transition: 'background 0.15s',
              background: n.read ? 'transparent' : 'var(--primary-bg)',
              borderBottom: i < data.length - 1 ? '1px solid var(--border-light)' : 'none',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>
                  {isAr ? n.messageAr : n.messageEn}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {isAr ? n.time : n.timeEn}
                </div>
              </div>
              {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, flexShrink: 0, marginTop: 4 }} />}
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}
