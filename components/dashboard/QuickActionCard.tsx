'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { statCardVariants } from './StatCard'

export default function QuickActionCard({ icon: Icon, label, description, href, color }: {
  icon: any; label: string; description: string; href: string; color: string
}) {
  return (
    <motion.div variants={statCardVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link href={href} className="quick-action-card">
        <div className="qa-icon" style={{ background: `${color}15`, color }}>
          <Icon size={20} />
        </div>
        <div className="qa-title">{label}</div>
        <div className="qa-desc">{description}</div>
      </Link>
    </motion.div>
  )
}
