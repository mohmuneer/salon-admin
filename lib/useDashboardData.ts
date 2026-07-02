'use client'
import { useQuery } from '@tanstack/react-query'

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then(r => r.json()),
    staleTime: 60_000,
  })
}
