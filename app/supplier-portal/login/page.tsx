'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Lock, Eye, EyeOff, AlertCircle, Truck, Loader2 } from 'lucide-react'
import { useSupplierAuth } from '@/components/SupplierAuthContext'
import SalonLogo from '@/components/SalonLogo'

export default function SupplierLoginPage() {
  const router = useRouter()
  const { supplier, login } = useSupplierAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (supplier) router.replace('/supplier-portal')
  }, [supplier, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!phone || !password) return
    setLoading(true)
    try {
      const res = await fetch('/api/supplier-auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'حدث خطأ'); return }
      login(data.supplier)
      router.replace('/supplier-portal')
    } catch {
      setError('تعذر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
      padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ border: '2px solid rgba(255,255,255,0.15)', borderRadius: 20, overflow: 'hidden' }}>
              <SalonLogo src="/logo.png" size={80} borderRadius={20} />
            </div>
          </div>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>
            بوابة الموردين
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
            تسجيل الدخول إلى حساب المورد
          </p>
        </div>

        <form onSubmit={handleLogin} style={{
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32
        }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 8 }}>
              رقم الجوال
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                insetInlineStart: 14, color: 'var(--gold)', pointerEvents: 'none'
              }} />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                required
                style={{
                  width: '100%', padding: '12px 42px',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10, color: 'white', fontSize: 15, outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 8 }}>
              كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                insetInlineStart: 14, color: 'var(--gold)', pointerEvents: 'none'
              }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '12px 42px',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10, color: 'white', fontSize: 15, outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  insetInlineEnd: 14, background: 'none', border: 'none',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 14px', color: '#FCA5A5', fontSize: 13
            }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? 'color-mix(in srgb, var(--gold) 50%, transparent)' : 'linear-gradient(135deg, var(--gold), var(--gold-light))',
              border: 'none', borderRadius: 10, color: 'white', fontSize: 15,
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s', boxShadow: '0 4px 16px color-mix(in srgb, var(--gold) 30%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Truck size={16} />}
            {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 24 }}>
          © 2025 Glamour Salon Management — بوابة الموردين
        </p>
      </div>
    </div>
  )
}
