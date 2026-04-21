'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function PublicTicketsPage() {
  const params = useParams()
  const eventId = params?.eventId
  const [event, setEvent] = useState(null)
  const [ticketTypes, setTicketTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: ev } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      const { data: types } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('price', { ascending: true })
      setEvent(ev)
      setTicketTypes(types || [])
      if (types && types.length > 0) setSelected(types[0].id)
      setLoading(false)
    }
    load()
  }, [eventId])

  async function handlePurchase() {
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!email.trim()) { setError('Please enter your email.'); return }
    if (!selected) { setError('Please select a ticket type.'); return }
    setPurchasing(true)
    setError('')
    const ticketType = ticketTypes.find(t => t.id === selected)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ticket',
        name,
        email,
        amount: ticketType.price,
        eventName: event.name,
        ticketTypeName: ticketType.name,
        eventId,
        ticketTypeId: selected,
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

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64748b' }}>Loading...</p>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64748b' }}>Event not found.</p>
    </div>
  )

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div style={{ minHeight: '100vh', background: '#020617', fontFamily: 'sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <a href="/" style={{ display: 'inline-block', marginBottom: 20 }}>
            <img src="/logo.svg" alt="Hobby Handler" style={{ height: 36, width: 'auto' }} />
          </a>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>{event.name}</h1>
          {event.venue_location && (
            <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 4px' }}>📍 {event.venue_location}</p>
          )}
          {event.start_date && (
            <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>
              📅 {new Date(event.start_date).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: 28 }}>
          {ticketTypes.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '24px 0' }}>No tickets available for this event yet.</p>
          ) : (
            <>
              <h2 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Select Ticket Type</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {ticketTypes.map(type => (
                  <div
                    key={type.id}
                    onClick={() => setSelected(type.id)}
                    style={{
                      border: selected === type.id ? '2px solid #6366f1' : '1px solid #1e293b',
                      borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
                      background: selected === type.id ? '#1e1b4b' : '#020617',
                      transition: 'all 0.15s',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ color: 'white', fontWeight: 600, fontSize: 15, margin: 0 }}>{type.name}</p>
                      {type.description && <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>{type.description}</p>}
                      <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0' }}>
                        {type.quantity_total - type.quantity_sold} remaining
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: 'white', fontWeight: 800, fontSize: 20, margin: 0 }}>
                        {type.price === 0 ? 'Free' : `$${Number(type.price).toFixed(2)}`}
                      </p>
                      {type.price > 0 && <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>CAD</p>}
                    </div>
                  </div>
                ))}
              </div>

              <h2 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Your Information</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ color: '#64748b', fontSize: 13, display: 'block', marginBottom: 6 }}>Full Name *</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Smith"
                    style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', color: 'white', borderRadius: 8, padding: '10px 14px', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ color: '#64748b', fontSize: 13, display: 'block', marginBottom: 6 }}>Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jane@email.com"
                    style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', color: 'white', borderRadius: 8, padding: '10px 14px', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>

              {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</p>}

              <button
                onClick={handlePurchase}
                disabled={purchasing}
                style={{ width: '100%', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 10, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: purchasing ? 0.7 : 1 }}
              >
                {purchasing ? 'Redirecting to checkout...' : 'Get Ticket'}
              </button>

              <p style={{ color: '#334155', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
                Secured by Stripe. You will receive a confirmation email with your QR code.
              </p>
            </>
          )}
        </div>

        {/* Share / embed box */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 20, marginTop: 20 }}>
          <p style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Share This Page</p>
          <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 6px' }}>Direct link:</p>
          <div style={{ background: '#020617', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#6366f1', wordBreak: 'break-all', marginBottom: 12 }}>
            {pageUrl}
          </div>
          <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 6px' }}>Embed on your website:</p>
          <div style={{ background: '#020617', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#6366f1', wordBreak: 'break-all' }}>
            {`<iframe src="${pageUrl}" width="100%" height="700" frameborder="0"></iframe>`}
          </div>
        </div>

      </div>
    </div>
  )
}