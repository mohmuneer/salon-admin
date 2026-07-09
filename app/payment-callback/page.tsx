'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

const C = {
  navy: '#0a1628', navyCard: '#13203a',
  gold: '#d4a437', goldLight: '#e8c25e',
  text: '#eaf1ff', textMuted: '#9fb2d4', textDim: '#6a7d9e',
  border: 'rgba(255,255,255,0.06)',
  success: '#22c55e', error: '#ef4444',
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={null}>
      <PaymentCallbackContent />
    </Suspense>
  )
}

function PaymentCallbackContent() {
  const params = useSearchParams()
  const [state, setState] = useState<'checking' | 'success' | 'failed'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const orderId = params.get('orderId')
    const appointmentIds = params.get('appointmentIds')
    const paymentId = params.get('id') || params.get('paymentId')
    const moyasarStatus = params.get('status')

    if (!paymentId || (!orderId && !appointmentIds)) {
      setState('failed')
      setMessage('بيانات الدفع غير مكتملة')
      return
    }
    if (moyasarStatus && moyasarStatus !== 'paid') {
      setState('failed')
      setMessage(params.get('message') || 'لم تكتمل عملية الدفع')
      return
    }

    const qs = new URLSearchParams({ paymentId })
    if (orderId) qs.set('orderId', orderId)
    if (appointmentIds) qs.set('appointmentIds', appointmentIds)

    fetch(`/api/public-payment-callback?${qs}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) { setState('success') }
        else { setState('failed'); setMessage(d.error || 'تعذر تأكيد الدفع') }
      })
      .catch(() => { setState('failed'); setMessage('تعذر الاتصال بالخادم') })
  }, [params])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.navy, padding: 20 }}>
      <div style={{ maxWidth: 420, width: '100%', background: C.navyCard, borderRadius: 20, border: `1px solid ${C.border}`, padding: 36, textAlign: 'center' }}>
        {state === 'checking' && (
          <>
            <Loader2 size={48} color={C.gold} style={{ margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
            <h1 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>جارٍ التحقق من الدفع...</h1>
            <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>يرجى الانتظار قليلاً</p>
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircle2 size={48} color={C.success} style={{ margin: '0 auto 20px' }} />
            <h1 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>تم الدفع بنجاح ✓</h1>
            <p style={{ color: C.textMuted, fontSize: 13, margin: '0 0 20px' }}>تم تأكيد طلبك، شكراً لثقتك بنا</p>
            <a href="/public" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 10, background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, color: C.navy, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              العودة للمتجر
            </a>
          </>
        )}
        {state === 'failed' && (
          <>
            <XCircle size={48} color={C.error} style={{ margin: '0 auto 20px' }} />
            <h1 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>تعذّر إتمام الدفع</h1>
            <p style={{ color: C.textMuted, fontSize: 13, margin: '0 0 20px' }}>{message}</p>
            <a href="/public" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: `1px solid ${C.border}`, color: C.textMuted, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
              العودة للمتجر
            </a>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
