'use client'
import { useState, useEffect, use, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SuccessContent({ eventId }) {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const rawData = searchParams.get('data')
  const [status, setStatus] = useState('processing')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId || !rawData) { setStatus('error'); return }
    async function submit() {
      try {
        const formData = JSON.parse(decodeURIComponent(rawData))
        setBusinessName(formData.businessName || '')
        const res = await fetch('/api/vendors/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            stripeSessionId: sessionId,
            paymentStatus: 'paid',
          }),
        })
        const data = await res.json()
        if (data.error && data.error !== 'already_submitted') {
          setError(data.error)
          setStatus('error')
        } else {
          setStatus('success')
        }
      } catch (e) {
        setError(e.message)
        setStatus('error')
      }
    }
    submit()
  }, [sessionId, rawData])

  const S = {
    page: { minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '40px 20px' },
  }

  if (status === 'processing') return (
    <div style={S.page}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #1e293b', borderTop: '4px solid #6366f1', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: 15 }}>Processing your application...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (status === 'error') return (
    <div style={S.page}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>Something went wrong</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 8px' }}>
          Your payment was successful but we had trouble submitting your application.
        </p>
        <p style={{ color: '#475569', fontSize: 13, margin: '0 0 24px' }}>
          Please contact the event organizer with your payment confirmation.
        </p>
        {error && <p style={{ color: '#f87171', fontSize: 12, fontFamily: 'monospace' }}>{error}</p>}
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <img src="/logo.svg" alt="Hobby Handler" style={{ height: 32, width: 'auto', marginBottom: 32 }} />
        <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#065f46,#047857)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>✓</div>
        <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>Application Submitted!</h1>
        <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, margin: '0 0 32px' }}>
          Thank you <strong style={{ color: 'white' }}>{businessName}</strong>! Your booth fee payment was successful and your vendor application has been submitted. The organizer will be in touch shortly.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
          {[
            { icon: '💳', label: 'Payment', value: 'Confirmed' },
            { icon: '📋', label: 'Application', value: 'Submitted' },
            { icon: '⏳', label: 'Review', value: 'Pending' },
            { icon: '📧', label: 'Email', value: 'Confirmation sent' },
          ].map(item => (
            <div key={item.label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 24, margin: '0 0 6px' }}>{item.icon}</p>
              <p style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px' }}>{item.label}</p>
              <p style={{ color: '#34d399', fontSize: 13, fontWeight: 600, margin: 0 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function VendorSuccessPage({ params }) {
  const { eventId } = use(params)
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontFamily: 'sans-serif' }}>Loading...</p>
      </div>
    }>
      <SuccessContent eventId={eventId} />
    </Suspense>
  )
}