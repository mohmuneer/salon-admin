'use client'
import { useEffect, useState } from 'react'

export function useThemeColors() {
  const [colors, setColors] = useState({
    GOLD: '#C9A55F',
    GOLD_LIGHT: '#DEBF7A',
    CHART_COLORS: ['#C9A55F', '#DEBF7A', '#A8884E', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6'],
  })
  useEffect(() => {
    const resolve = () => {
      const cs = getComputedStyle(document.documentElement)
      const p = cs.getPropertyValue('--primary-500').trim() || '#C9A55F'
      const pl = cs.getPropertyValue('--primary-300').trim() || '#DEBF7A'
      const pd = cs.getPropertyValue('--primary-700').trim() || '#A8884E'
      setColors({ GOLD: p, GOLD_LIGHT: pl, CHART_COLORS: [p, pl, pd, '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6'] })
    }
    resolve()
    const obs = new MutationObserver(resolve)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-mode', 'style'] })
    return () => obs.disconnect()
  }, [])
  return colors
}
