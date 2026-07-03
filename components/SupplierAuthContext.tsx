'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export type Supplier = { id: string; name_ar: string; name_en?: string; phone: string; email?: string }

interface SupplierAuthValue {
  supplier: Supplier | null
  loading: boolean
  login: (s: Supplier) => void
  logout: () => void
}

const STORAGE_KEY = 'glamour-supplier'

const SupplierAuthContext = createContext<SupplierAuthValue>({
  supplier: null,
  loading: true,
  login: () => {},
  logout: () => {},
})

export function useSupplierAuth() {
  return useContext(SupplierAuthContext)
}

export function SupplierAuthProvider({ children }: { children: ReactNode }) {
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSupplier(JSON.parse(raw))
    } catch {}
    setLoading(false)
  }, [])

  const login = useCallback((s: Supplier) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    setSupplier(s)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSupplier(null)
  }, [])

  return (
    <SupplierAuthContext.Provider value={{ supplier, loading, login, logout }}>
      {children}
    </SupplierAuthContext.Provider>
  )
}
