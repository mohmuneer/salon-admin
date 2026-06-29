'use client'
import { useSyncExternalStore, ReactNode } from 'react'

function noopSubscribe() { return () => {} }

export default function ChartWrapper({ children, height = 280 }: { children: ReactNode; height?: number }) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  if (!mounted) return <div style={{ height, width: '100%', position: 'relative' }} />
  return <div style={{ height, width: '100%', position: 'relative' }}>{children}</div>
}
