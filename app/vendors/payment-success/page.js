'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SuccessContent() {
  const searchParams = useSearchParams()
  const vendorId = searchParams.get('vendor_id')
  const [status, setStatus] = useState('processing')

  useEffect(() => {
    if (!vendorId) { setStatus('error'); return }
    fetch('/api/vendors/confirm-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorApplicationId: vendorId }),
    })
      .then(r => r.json())
      .then(data => setStatus(data.success ? 'success' : 'error'))
      .catch(() => setStatus('error'))
  }, [vendorId])

  const S = { page: { minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '40px 20px' } }

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <img src="/logo.svg" alt="Hobby Handler" style={{ height: 30, width: 'auto', marginBottom: 32 }} />
        {status === 'processing' && (
          <>
            <div style={{ width: 48, height: 48, border: '4px solid #1e293b', borderTop: '4px solid #6366f1', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#64748b', fontSize: 15 }}>Confirming your payment...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#065f46,#047857)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>✓</div>
            <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>Payment Confirmed!</h1>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, margin: '0 0 24px' }}>
              Your booth fee payment was successful. The event organizer has been notified and your application is now confirmed. See you at the event!
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>Something went wrong</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>Your payment was processed but we had trouble updating your record. Please contact the event organizer with your payment confirmation.</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function VendorPaymentSuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#64748b', fontFamily: 'sans-serif' }}>Loading...</p></div>}>
      <SuccessContent />
    </Suspense>
  )
}