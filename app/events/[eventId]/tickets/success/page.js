'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import QRCode from 'qrcode'

function SuccessContent({ eventId }) {
  const searchParams = useSearchParams()
  const name = searchParams.get('name') || ''
  const email = searchParams.get('email') || ''
  const ticketType = searchParams.get('ticketType') || 'General'
  const amount = searchParams.get('amount') || '0'
  const sessionId = searchParams.get('session_id') || ''

  const [ticket, setTicket] = useState(null)
  const [qrUrl, setQrUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    async function createTicket() {
      const code = 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase()

      const { data: ev } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      const { data: newTicket } = await supabase
        .from('tickets')
        .insert({
          event_id: eventId,
          attendee_name: name,
          attendee_email: email,
          ticket_type: ticketType,
          price: parseFloat(amount),
          qr_code: code,
          payment_status: 'paid',
          stripe_session_id: sessionId,
        })
        .select()
        .single()

      if (newTicket) {
        setTicket({ ...newTicket, event: ev })
        const url = await QRCode.toDataURL(code, { width: 250, margin: 2 })
        setQrUrl(url)

        if (email) {
          await fetch('/api/email/ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attendeeName: name,
              attendeeEmail: email,
              eventName: ev?.name || 'Event',
              eventDate: ev?.start_date ? new Date(ev.start_date).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '',
              eventVenue: ev?.venue_location || '',
              ticketType,
              ticketCode: code,
              price: parseFloat(amount).toFixed(2),
            }),
          })
          setEmailSent(true)
        }
      }
      setLoading(false)
    }
    createTicket()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64748b' }}>Setting up your ticket...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#020617', fontFamily: 'sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>

        <div style={{ marginBottom: 24 }}>
          <img src="/logo.svg" alt="Hobby Handler" style={{ height: 36, width: 'auto' }} />
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: 36, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, background: '#064e3b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ fontSize: 28 }}>✓</span>
          </div>

          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>You're going!</h1>
          <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 28px' }}>
            {emailSent ? `A confirmation email with your QR code has been sent to ${email}` : 'Your ticket has been confirmed.'}
          </p>

          {qrUrl && (
            <div style={{ background: '#020617', borderRadius: 16, padding: 24, marginBottom: 20, display: 'inline-block' }}>
              <img src={qrUrl} alt="QR Code" width={200} height={200} style={{ display: 'block' }} />
              <p style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace', margin: '12px 0 0' }}>{ticket?.qr_code}</p>
            </div>
          )}

          <div style={{ background: '#020617', borderRadius: 12, padding: '16px 20px', textAlign: 'left', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
              <span style={{ color: '#64748b', fontSize: 14 }}>Name</span>
              <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
              <span style={{ color: '#64748b', fontSize: 14 }}>Ticket Type</span>
              <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{ticketType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
              <span style={{ color: '#64748b', fontSize: 14 }}>Event</span>
              <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{ticket?.event?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: '#64748b', fontSize: 14 }}>Amount Paid</span>
              <span style={{ color: '#34d399', fontSize: 14, fontWeight: 600 }}>${parseFloat(amount).toFixed(2)} CAD</span>
            </div>
          </div>

          <button
            onClick={() => {
              const link = document.createElement('a')
              link.href = qrUrl
              link.download = 'ticket-' + ticket?.qr_code + '.png'
              link.click()
            }}
            style={{ width: '100%', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}
          >
            Download QR Code
          </button>
        </div>

        <p style={{ color: '#334155', fontSize: 13 }}>Show your QR code at the door for entry.</p>
      </div>
    </div>
  )
}

export default function SuccessPage({ params }) {
  const { eventId } = params
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#64748b' }}>Loading...</p></div>}>
      <SuccessContent eventId={eventId} />
    </Suspense>
  )
}