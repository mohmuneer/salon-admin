'use client'
import { useEffect, useRef, useState } from 'react'
import { Calendar, Clock, UserCheck, Activity, Bell } from 'lucide-react'
import { AVATAR_COLORS } from './constants'

export function AnimatedCounter({ value, suffix = '', duration = 1200 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const startTime = useRef(0)
  const frame = useRef(0)
  useEffect(() => {
    startTime.current = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) frame.current = requestAnimationFrame(animate)
    }
    frame.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame.current)
  }, [value, duration])
  return <>{display.toLocaleString()}{suffix}</>
}

export function AvatarLetter({ name, index = 0, size = 32 }: { name: string; index?: number; size?: number }) {
  const letter = (name || '?').charAt(0).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: AVATAR_COLORS[index % AVATAR_COLORS.length],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
    }}>{letter}</div>
  )
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`status-pill ${status}`}>
      <span className="dot" />
      {status === 'completed' ? 'مكتمل' : status === 'confirmed' ? 'مؤكد' : status === 'pending' ? 'معلق' : status === 'cancelled' ? 'ملغى' : status === 'in_progress' ? 'جارٍ' : 'لم يحضر'}
    </span>
  )
}

export function StatusPillEn({ status }: { status: string }) {
  const labels: Record<string, string> = { completed: 'Completed', confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled', in_progress: 'In Progress', no_show: 'No Show' }
  return (
    <span className={`status-pill ${status}`}>
      <span className="dot" />
      {labels[status] || status}
    </span>
  )
}

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color || 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  )
}

export function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="section-title">
      <span className="accent" />
      <Icon size={16} style={{ color: 'var(--primary)' }} />
      {label}
    </div>
  )
}

export const notifIcons: Record<string, any> = { booking: Calendar, reminder: Clock, staff: UserCheck, system: Activity }
export function getNotifIcon(type: string) { return notifIcons[type] || Bell }
export function getNotifColor(type: string, GOLD: string) {
  const map: Record<string, string> = { booking: GOLD, reminder: '#F59E0B', staff: '#10B981', system: '#8B5CF6' }
  return map[type] || 'var(--text-muted)'
}
