'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import SalonLogo from '@/components/SalonLogo'

interface Props {
  name: string
  name_en: string
  logo_url: string
}

export default function LoginForm({ name, name_en, logo_url }: Props) {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<'ar'|'en'>('ar')

  const labels = {
    ar: {
      subtitle: 'تسجيل الدخول',
      phone: 'رقم الجوال',
      password: 'كلمة المرور',
      login: 'تسجيل الدخول',
      loading: 'جارٍ التحقق...',
      error: 'رقم الجوال أو كلمة المرور غير صحيحة',
      phonePh: '+966500000000',
      passwordPh: '••••••••',
      hint: 'تجريبي — مدير: +966500000004 / admin123 · موظف: +966500000002 / emp123',
    },
    en: {
      subtitle: 'Sign In',
      phone: 'Phone Number',
      password: 'Password',
      login: 'Sign In',
      loading: 'Signing in...',
      error: 'Invalid phone number or password',
      phonePh: '+966500000000',
      passwordPh: '••••••••',
      hint: 'Demo — Admin: +966500000004 / admin123 · Staff: +966500000002 / emp123',
    }
  }

  const tr = labels[lang]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { phone, password, redirect: false })
    setLoading(false)
    if (res?.error) { setError(tr.error) }
    else { router.push('/') }
  }

  return (
    <div>
      {/* Logo + Name */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ border: '2px solid rgba(255,255,255,0.15)', borderRadius: 20, overflow: 'hidden' }}>
            <SalonLogo src={logo_url} size={80} borderRadius={20} />
          </div>
        </div>
        <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>
          {name}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
          {tr.subtitle}
        </p>
      </div>

      <form onSubmit={handleLogin} className="login-form" style={{
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32
      }}>
        {/* Phone */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 8 }}>
            {tr.phone}
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
              placeholder={tr.phonePh}
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

        {/* Password */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 8 }}>
            {tr.password}
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
              placeholder={tr.passwordPh}
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

        {/* Error */}
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

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '13px',
            background: loading ? 'color-mix(in srgb, var(--gold) 50%, transparent)' : 'linear-gradient(135deg, var(--gold), var(--gold-light))',
            border: 'none', borderRadius: 10, color: 'white', fontSize: 15,
            fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s', boxShadow: '0 4px 16px color-mix(in srgb, var(--gold) 30%, transparent)'
          }}
        >
          {loading ? tr.loading : tr.login}
        </button>

        {/* Demo hint */}
        <div style={{
          marginTop: 20, padding: '10px 14px',
          background: 'color-mix(in srgb, var(--gold) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--gold) 20%, transparent)',
          borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)',
          textAlign: 'center'
        }}>
          {tr.hint}
        </div>
      </form>
    </div>
  )
}
