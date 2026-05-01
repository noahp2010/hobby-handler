'use client'
import { useState, useEffect, use } from 'react'
import Logo from '../../../components/logo'

export default function BuyTicketsPage({ params }) {
  const { eventId } = use(params)
  const [event, setEvent] = useState(null)
  const [ticketTypes, setTicketTypes] = useState([])
  const [organizerUserId, setOrganizerUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [quantities, setQuantities] = useState({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState('')
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    if (!eventId) return
    const p = new URLSearchParams(window.location.search)
    if (p.get('cancelled')) setCancelled(true)
    fetch('/api/events/' + eventId + '/ticket-types')
      .then(r => r.ok ? r.json() : Promise.reject('not found'))
      .then(data => {
        setEvent(data.event)
        setTicketTypes(data.ticketTypes || [])
        setOrganizerUserId(data.organizerUserId)
        const init = {}
        ;(data.ticketTypes || []).forEach(t => { init[t.id] = 0 })
        setQuantities(init)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [eventId])

  const orderItems = ticketTypes.filter(t => (quantities[t.id] || 0) > 0)
  const subtotal = orderItems.reduce((s, t) => s + t.price * (quantities[t.id] || 0), 0)
  const discount = promoResult?.valid
    ? promoResult.discount_type === 'percent'
      ? subtotal * (promoResult.discount_value / 100)
      : Math.min(subtotal, promoResult.discount_value)
    : 0
  const total = Math.max(0, subtotal - discount)
  const totalQty = orderItems.reduce((s, t) => s + (quantities[t.id] || 0), 0)

  function updateQty(id, val) {
    const type = ticketTypes.find(t => t.id === id)
    const remaining = (type?.quantity_total || 100) - (type?.quantity_sold || 0)
    setQuantities(prev => ({ ...prev, [id]: Math.min(Math.max(0, val), Math.min(remaining, 10)) }))
  }

  async function applyPromo() {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoResult(null)
    const res = await fetch('/api/promo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: promoCode.trim().toUpperCase(), eventId }),
    })
    const data = await res.json()
    setPromoResult(data)
    setPromoLoading(false)
  }

  async function handleCheckout() {
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email.'); return }
    if (totalQty === 0) { setError('Please select at least one ticket.'); return }
    setPurchasing(true)
    setError('')

    const firstItem = orderItems[0]
    const ticketTypeName = orderItems.map(i => quantities[i.id] + 'x ' + i.name).join(', ')

    // Free tickets - skip Stripe
    if (total === 0) {
      try {
        const res = await fetch('/api/tickets/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId, ticketTypeId: firstItem.id, ticketTypeName,
            attendeeName: name, attendeeEmail: email, attendeePhone: phone,
            price: 0, quantity: totalQty, source: 'online',
          }),
        })
        const data = await res.json()
        if (data.tickets) {
          await fetch('/api/email/ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tickets: data.tickets,
              eventName: event.name,
              eventDate: event.start_date ? new Date(event.start_date).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '',
              eventVenue: event.venue_location || '',
            }),
          })
          window.location.href = '/tickets/success?free=1&eventId=' + eventId + '&ids=' + data.tickets.map(t => t.id).join(',') + '&name=' + encodeURIComponent(name) + '&email=' + encodeURIComponent(email) + '&qty=' + totalQty
        } else {
          setError(data.error || 'Something went wrong.')
          setPurchasing(false)
        }
      } catch (e) { setError(e.message); setPurchasing(false) }
      return
    }

    // Paid tickets - use Stripe
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ticket',
        eventId,
        ticketTypeId: firstItem.id,
        ticketTypeName,
        attendeeName: name,
        attendeeEmail: email,
        price: total / totalQty,
        quantity: totalQty,
        organizerUserId,
        promoCode: promoResult?.valid ? promoCode : null,
        discount,
      }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setError(data.error || 'Something went wrong.')
      setPurchasing(false)
    }
  }

  const S = {
    page: { minHeight: '100vh', background: '#020617', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
    card: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24, marginBottom: 16 },
    inp:  { width: '100%', background: '#020617', border: '1px solid #1e293b', color: 'white', borderRadius: 8, padding: '10px 14px', fontSize: 14, boxSizing: 'border-box', outline: 'none' },
    lbl:  { color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6, fontWeight: 500 },
  }

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '4px solid #1e293b', borderTop: '4px solid #6366f1', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b' }}>Loading tickets...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 48, marginBottom: 12 }}>🎟️</p>
        <p style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Event not found</p>
        <p style={{ color: '#64748b', fontSize: 14 }}>This ticket page doesn't exist or has been removed.</p>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <nav style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 24px', textAlign: 'center' }}>
        <Logo size="xl" showFull />
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>

        {/* LEFT */}
        <div style={{ flex: '1 1 520px', minWidth: 0 }}>

          {cancelled && (
            <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
              <p style={{ color: '#fca5a5', fontWeight: 600, fontSize: 14, margin: '0 0 2px' }}>Payment cancelled</p>
              <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>Your payment was not completed. You can try again below.</p>
            </div>
          )}

          {/* Event header */}
          <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', border: '1px solid #3730a3', borderRadius: 16, padding: '24px 28px', marginBottom: 16 }}>
            <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>{event?.name}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              {event?.start_date && <span style={{ color: '#c7d2fe', fontSize: 14 }}>📅 {new Date(event.start_date).toLocaleDateString('en-CA', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</span>}
              {event?.venue_location && <span style={{ color: '#c7d2fe', fontSize: 14 }}>📍 {event.venue_location}</span>}
            </div>
          </div>

          {/* Ticket types */}
          <div style={S.card}>
            <h2 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Select Tickets</h2>
            {ticketTypes.length === 0 ? (
              <p style={{ color: '#475569', textAlign: 'center', padding: '24px 0' }}>No tickets available for this event yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ticketTypes.map(type => {
                  const remaining = (type.quantity_total || 100) - (type.quantity_sold || 0)
                  const soldOut = remaining <= 0
                  const qty = quantities[type.id] || 0
                  return (
                    <div key={type.id} style={{ border: qty > 0 ? '2px solid #6366f1' : '1px solid #1e293b', borderRadius: 12, padding: '16px 18px', background: qty > 0 ? '#1e1b4b' : '#020617', opacity: soldOut ? 0.5 : 1, transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: type.color || '#4f46e5', flexShrink: 0 }} />
                            <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>{type.name}</p>
                            {soldOut && <span style={{ background: '#450a0a', color: '#fca5a5', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>SOLD OUT</span>}
                            {!soldOut && remaining <= 20 && <span style={{ background: '#451a03', color: '#fed7aa', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>Only {remaining} left!</span>}
                          </div>
                          {type.description && <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 8px' }}>{type.description}</p>}
                          {type.quantity_total > 0 && (
                            <div style={{ background: '#1e293b', borderRadius: 4, height: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, ((type.quantity_sold || 0) / type.quantity_total) * 100)}%`, background: remaining <= 20 ? '#f97316' : (type.color || '#6366f1'), height: '100%', transition: 'width 0.3s' }} />
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 16, flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ color: 'white', fontWeight: 800, fontSize: 20, margin: 0 }}>{type.price === 0 ? 'Free' : '$' + Number(type.price).toFixed(2)}</p>
                            {type.price > 0 && <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>CAD</p>}
                          </div>
                          {!soldOut && (
                            <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, overflow: 'hidden' }}>
                              <button onClick={() => updateQty(type.id, qty - 1)} style={{ background: 'none', border: 'none', color: qty === 0 ? '#334155' : '#94a3b8', fontSize: 22, width: 38, height: 38, cursor: qty === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                              <span style={{ color: 'white', fontWeight: 700, fontSize: 15, minWidth: 28, textAlign: 'center' }}>{qty}</span>
                              <button onClick={() => updateQty(type.id, qty + 1)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Attendee info */}
          {totalQty > 0 && (
            <div style={S.card}>
              <h2 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Your Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={S.lbl}>Full Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" style={S.inp} onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#1e293b'} />
                </div>
                <div>
                  <label style={S.lbl}>Email Address *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" style={S.inp} onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#1e293b'} />
                  <p style={{ color: '#334155', fontSize: 12, margin: '5px 0 0' }}>Your QR code ticket will be sent here.</p>
                </div>
                <div>
                  <label style={S.lbl}>Phone (optional)</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(416) 555-0100" style={S.inp} onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#1e293b'} />
                </div>
              </div>
            </div>
          )}

          {/* Promo code */}
          {totalQty > 0 && subtotal > 0 && (
            <div style={S.card}>
              <h2 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Promo Code</h2>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={promoCode}
                  onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null) }}
                  placeholder="Enter promo code"
                  style={{ ...S.inp, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }}
                  onFocus={e => e.target.style.borderColor='#6366f1'}
                  onBlur={e => e.target.style.borderColor='#1e293b'}
                />
                <button
                  onClick={applyPromo}
                  disabled={promoLoading || !promoCode.trim()}
                  style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', opacity: promoLoading || !promoCode.trim() ? 0.6 : 1 }}
                >
                  {promoLoading ? '...' : 'Apply'}
                </button>
              </div>
              {promoResult && (
                <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: promoResult.valid ? '#052e16' : '#450a0a', border: '1px solid ' + (promoResult.valid ? '#166534' : '#7f1d1d') }}>
                  <p style={{ color: promoResult.valid ? '#4ade80' : '#f87171', fontSize: 13, fontWeight: 600, margin: 0 }}>
                    {promoResult.valid
                      ? '✓ ' + promoCode + ' applied — ' + (promoResult.discount_type === 'percent' ? promoResult.discount_value + '% off' : '$' + promoResult.discount_value + ' off')
                      : '✗ ' + promoResult.error}
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ color: '#fca5a5', fontSize: 14, margin: 0 }}>⚠️ {error}</p>
            </div>
          )}

          {/* Checkout button */}
          <button
            onClick={handleCheckout}
            disabled={totalQty === 0 || purchasing}
            style={{ width: '100%', background: totalQty === 0 ? '#1e293b' : purchasing ? '#312e81' : '#4f46e5', color: totalQty === 0 ? '#475569' : 'white', border: 'none', borderRadius: 12, padding: '15px', fontSize: 16, fontWeight: 700, cursor: totalQty === 0 || purchasing ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            {purchasing ? 'Processing...' : totalQty === 0 ? 'Select tickets above' : total === 0 ? 'Get Free Tickets' : 'Checkout — $' + total.toFixed(2) + ' CAD'}
          </button>
          {totalQty > 0 && total > 0 && (
            <p style={{ color: '#334155', fontSize: 12, textAlign: 'center', marginTop: 10 }}>🔒 Secured by Stripe</p>
          )}
        </div>

        {/* RIGHT — Order summary */}
        <div style={{ flex: '0 0 280px', minWidth: 260 }}>
          <div style={{ position: 'sticky', top: 20 }}>
            <div style={S.card}>
              <h2 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Order Summary</h2>
              {orderItems.length === 0 ? (
                <p style={{ color: '#334155', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No tickets selected yet.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                    {orderItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{item.name}</p>
                          <p style={{ color: '#475569', fontSize: 12, margin: '2px 0 0' }}>× {quantities[item.id]}</p>
                        </div>
                        <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>
                          {item.price === 0 ? 'Free' : '$' + (item.price * quantities[item.id]).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: 12 }}>
                    {subtotal !== total && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ color: '#64748b', fontSize: 13 }}>Subtotal</span>
                          <span style={{ color: '#94a3b8', fontSize: 13 }}>${subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ color: '#4ade80', fontSize: 13 }}>Promo discount</span>
                          <span style={{ color: '#4ade80', fontSize: 13 }}>−${discount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', background: '#020617', borderRadius: 8, padding: '12px 14px' }}>
                      <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Total</span>
                      <span style={{ color: '#818cf8', fontWeight: 800, fontSize: 18 }}>{total === 0 ? 'Free' : '$' + total.toFixed(2) + ' CAD'}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={totalQty === 0 || purchasing}
                    style={{ width: '100%', background: purchasing ? '#312e81' : '#4f46e5', color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: purchasing ? 'not-allowed' : 'pointer', marginTop: 14 }}
                  >
                    {purchasing ? 'Processing...' : total === 0 ? 'Get Free Tickets' : 'Pay $' + total.toFixed(2) + ' CAD'}
                  </button>
                </>
              )}
            </div>

            {/* Share / embed */}
            <div style={S.card}>
              <p style={{ color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Share Event</p>
              <div style={{ background: '#020617', borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: '#6366f1', wordBreak: 'break-all', marginBottom: 10 }}>
                {typeof window !== 'undefined' ? window.location.href : ''}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '')} style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: 7, padding: '7px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Copy Link</button>
                <button onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.href : ''
                  navigator.clipboard.writeText('<iframe src="' + url + '" width="100%" height="800" frameborder="0" style="border:none;border-radius:12px;"></iframe>')
                }} style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: 7, padding: '7px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Copy Embed</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}