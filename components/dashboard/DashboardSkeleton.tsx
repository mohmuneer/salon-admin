'use client'
import { motion } from 'framer-motion'

function Block({ style }: { style?: React.CSSProperties }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
      style={{
        borderRadius: 'var(--radius-lg)',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        ...style,
      }}
    />
  )
}

export default function DashboardSkeleton() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <Block style={{ width: 220, height: 40 }} />
        <Block style={{ width: 100, height: 36 }} />
      </div>

      <div className="dashboard-4col" style={{ marginBottom: 24 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Block key={i} style={{ height: 128 }} />
        ))}
      </div>

      <Block style={{ height: 110, marginBottom: 24 }} />

      <div className="dashboard-2col" style={{ marginBottom: 24 }}>
        <Block style={{ height: 340 }} />
        <Block style={{ height: 340 }} />
      </div>

      <div className="dashboard-3col" style={{ marginBottom: 24 }}>
        <Block style={{ height: 300 }} />
        <Block style={{ height: 300 }} />
        <Block style={{ height: 300 }} />
      </div>

      <div className="dashboard-2col" style={{ marginBottom: 24 }}>
        <Block style={{ height: 360 }} />
        <Block style={{ height: 360 }} />
      </div>
    </div>
  )
}
