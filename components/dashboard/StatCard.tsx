'use client'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { AnimatedCounter } from './shared'

export const statCardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function StatCard({ label, value, icon: Icon, change, up, color, period, suffix = '' }: {
  label: string; value: number; icon: any; change: string; up: boolean; color: string; period: string; suffix?: string
}) {
  return (
    <motion.div
      className="premium-stat"
      variants={statCardVariants}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className="stat-glow" />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="premium-icon" style={{ background: `${color}15`, color }}>
          <Icon size={20} />
        </div>
        <span className={`metric-badge ${up ? 'up' : 'down'}`}>
          {up ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          {change}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', marginBottom: 2 }}>
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.6, marginTop: 2 }}>{period}</div>
    </motion.div>
  )
}
