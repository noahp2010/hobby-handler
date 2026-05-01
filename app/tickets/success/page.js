'use client'
import { useState, useEffect, Suspense } from 'react'
import Logo from '../../components/logo'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function TicketCard({ ticket, eventName, eventDate, eventVenue }) {
  const [downloading, setDownloading] = useState(false)
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  function printTicket() {
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>Ticket — ${ticket.qr_code}</title>
    <style>
      body{margin:0;padding:40px;font-family:-apple-system,sans-serif;background:white;}
      .ticket{max-width:400px;margin:0 auto;border:3px solid #6366f1;border-radius:20px;overflow:hidden;}
      .top{background:linear-gradient(135deg,#1e1b4b,#312e81);padding:24px;text-align:center;color:white;}
      .top h1{margin:0 0 6px;font-size:20px;font-weight:800;}
      .top p{margin:0;opacity:0.8;font-size:13px;}
      .mid{padding:24px;text-align:center;border-bottom:2px dashed #e2e8f0;}
      .mid img{display:block;margin:0 auto 12px;}
      .code{font-family:monospace;font-size:14px;font-weight:700;letter-spacing:2px;color:#6366f1;}
      .bot{padding:20px 24px;}
      .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;}
      .row:last-child{border:none;}
      .row span:first-child{color:#64748b;font-size:13px;}
      .row span:last-child{color:#1e293b;font-size:13px;font-weight:600;}
      @media print{body{padding:0;}button{display:none;}}
    </style></head><body>
    <div class="ticket">
      <div class="top"><h1>${eventName}</h1><p>${eventDate || ''}</p></div>
      <div class="mid">
        <img src="${appUrl}/api/qrcode?code=${encodeURIComponent(ticket.qr_code)}" width="180" height="180" />
        <p class="code">${ticket.qr_code}</p>
      </div>
      <div class="bot">
        <div class="row"><span>Name</span><span>${ticket.attendee_name}</span></div>
        <div class="row"><span>Ticket Type</span><span>${ticket.ticket_type_name}</span></div>
        ${eventVenue ? `<div class="row"><span>Venue</span><span>${eventVenue}</span></div>` : ''}
        <div class="row"><span>Status</span><span style="color:#059669">✓ Confirmed</span></div>
      </div>
    </div>
    <br/><button onclick="window.print()" style="margin:16px auto;display:block;background:#4f46e5;color:white;border:none;padding:12px 28px;border-radius:8px;cursor:pointer;font-size:15px;font-weight:700;">Print Ticket</button>
    </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: '#818cf8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Confirmed Ticket</p>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>{eventName}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: '#c7d2fe', fontSize: 13, margin: 0 }}>{ticket.ticket_type_name}</p>
          <p style={{ color: '#6366f1', fontSize: 11, fontFamily: 'monospace', margin: '4px 0 0' }}>{ticket.qr_code}</p>
        </div>
      </div>

      <div style={{ padding: '28px 24px', textAlign: 'center', borderBottom: '2px dashed #1e293b' }}>
        <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>Scan at the door</p>
        <div style={{ display: 'inline-block', background: 'white', padding: 16, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <img
            src={`/api/qrcode?code=${encodeURIComponent(ticket.qr_code)}`}
            alt="QR Code"
            width={220} height={220}
            style={{ display: 'block' }}
          />
        </div>
        <p style={{ color: '#334155', fontSize: 12, fontFamily: 'monospace', marginTop: 12, letterSpacing: 2 }}>{ticket.qr_code}</p>
      </div>

      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Name', value: ticket.attendee_name },
            { label: 'Ticket', value: ticket.ticket_type_name },
            eventDate && { label: 'Date', value: eventDate },
            eventVenue && { label: 'Venue', value: eventVenue },
            { label: 'Paid', value: ticket.price === 0 ? 'Free' : '$' + ticket.price.toFixed(2) + ' CAD' },
            { label: 'Status', value: '✓ Confirmed', green: true },
          ].filter(Boolean).map(row => (
            <div key={row.label} style={{ background: '#020617', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 3px' }}>{row.label}</p>
              <p style={{ color: row.green ? '#34d399' : 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{row.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={`/api/qrcode?code=${encodeURIComponent(ticket.qr_code)}`}
            download={`ticket-${ticket.qr_code}.png`}
            style={{ flex: 1, display: 'block', textAlign: 'center', background: '#4f46e5', color: 'white', textDecoration: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700 }}
          >
            📱 Save QR Code
          </a>
          <button
            onClick={printTicket}
            style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            🖨️ Print Ticket
          </button>
        </div>
      </div>
    </div>
  )
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const isFree = searchParams.get('free') === '1'
  const sessionId = searchParams.get('session_id')
  const eventId = searchParams.get('eventId')
  const ticketTypeId = searchParams.get('ticketTypeId')
  const ticketTypeName = searchParams.get('ticketTypeName') || 'General'
  const name = searchParams.get('name') || ''
  const email = searchParams.get('email') || ''
  const price = parseFloat(searchParams.get('price') || '0')
  const qty = parseInt(searchParams.get('qty') || '1')
  const orderId = searchParams.get('orderId') || ''
  const freeIds = searchParams.get('ids') || ''

  const [tickets, setTickets] = useState([])
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [emailSent, setEmailSent] = useState(false)
  const [ran, setRan] = useState(false)

  useEffect(() => {
    if (ran || !eventId) return
    setRan(true)

    async function run() {
      try {
        const evRes = await fetch(`/api/events/${eventId}/ticket-types`)
        const evData = await evRes.json()
        setEvent(evData.event)

        let created = []

        if (isFree && freeIds) {
          const ids = freeIds.split(',')
          const { data } = await supabase.from('tickets').select('*').in('id', ids)
          created = data || []
        } else if (sessionId) {
          const { data: existing } = await supabase
            .from('tickets').select('*').eq('stripe_session_id', sessionId)
          if (existing && existing.length > 0) {
            created = existing
          } else {
            const res = await fetch('/api/tickets/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventId, ticketTypeId, ticketTypeName,
                attendeeName: name, attendeeEmail: email,
                price, quantity: qty,
                stripeSessionId: sessionId,
                orderId, source: 'online',
              }),
            })
            const data = await res.json()
            created = data.tickets || []
          }
        }

        setTickets(created)

        if (email && created.length > 0 && evData.event) {
          const emailRes = await fetch('/api/email/ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tickets: created,
              eventName: evData.event.name,
              eventDate: evData.event.start_date ? new Date(evData.event.start_date).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '',
              eventVenue: evData.event.venue_location || '',
            }),
          })
          if ((await emailRes.json()).success) setEmailSent(true)
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    run()
  }, [eventId, ran])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #1e293b', borderTop: '4px solid #6366f1', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: 15 }}>Generating your tickets...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  const eventDate = event?.start_date ? new Date(event.start_date).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''

  return (
    <div style={{ minHeight: '100vh', background: '#020617', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="/"><Logo size="xl" showFull /></a>
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#065f46,#047857)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>✓</div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>
            {tickets.length > 1 ? `${tickets.length} Tickets Confirmed!` : 'Ticket Confirmed!'}
          </h1>
          <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>
            {emailSent ? `Confirmation sent to ${email}` : 'Save or screenshot your QR code below.'}
          </p>
        </div>

        {tickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            eventName={event?.name || 'Event'}
            eventDate={eventDate}
            eventVenue={event?.venue_location || ''}
          />
        ))}

        {tickets.length === 0 && !loading && (
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 32, textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: 15 }}>Something went wrong generating your tickets. Please contact the organizer.</p>
          </div>
        )}

        <p style={{ color: '#334155', fontSize: 13, textAlign: 'center', marginTop: 16 }}>
          Show your QR code at the door for entry.
        </p>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontFamily: 'sans-serif' }}>Loading...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}