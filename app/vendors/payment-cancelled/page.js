export default function PaymentCancelledPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <img src="/logo.svg" alt="Hobby Handler" style={{ height: 28, width: 'auto', marginBottom: 28 }} />
        <div style={{ fontSize: 52, marginBottom: 16 }}>↩️</div>
        <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>Payment Cancelled</h1>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
          Your payment was not completed. Your application is still on file. Please use the payment link to try again, or contact the event organizer.
        </p>
      </div>
    </div>
  )
}