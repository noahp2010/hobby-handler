'use client'
import { useState, useEffect, use } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, MapPin, Store } from 'lucide-react'

const S = {
  page: { minHeight: '100vh', background: '#020617', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  wrap: { maxWidth: 680, margin: '0 auto', padding: '40px 20px' },
  card: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 28, marginBottom: 20 },
  label: { color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', background: '#020617', border: '1px solid #1e293b', color: 'white', borderRadius: 8, padding: '10px 14px', fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  req: { color: '#f87171', marginLeft: 2 },
}

export default function VendorRegistrationPage({ params }) {
  const { eventId } = use(params)
  const [event, setEvent] = useState(null)
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [responses, setResponses] = useState({})

  useEffect(() => {
    if (!eventId) return
    fetch('/api/vendors/event/' + eventId)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setEvent(data.event)
        setFields(data.fields || [])
        const init = {}
        ;(data.fields || []).forEach(f => {
          init[f.id] = f.field_type === 'checkbox' ? false : ''
        })
        setResponses(init)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [eventId])

  async function handleSubmit() {
    setError('')
    if (!businessName.trim()) { setError('Business name is required.'); return }
    if (!email.trim()) { setError('Email address is required.'); return }
    for (const field of fields) {
      if (field.required && !responses[field.id]) {
        setError('"' + field.label + '" is required.')
        return
      }
    }
    setSubmitting(true)
    const res = await fetch('/api/vendors/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        businessName,
        contactName,
        email,
        phone,
        formResponses: responses,
        boothFee: 0,
      }),
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
      setSubmitting(false)
    } else {
      setSubmitted(true)
    }
  }

  function setResponse(id, value) {
    setResponses(prev => ({ ...prev, [id]: value }))
  }

  function renderField(field) {
    const value = responses[field.id]
    const focusStyle = { borderColor: '#6366f1' }
    const blurStyle = { borderColor: '#1e293b' }

    switch (field.field_type) {
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={e => setResponse(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={4}
            style={{ ...S.input, resize: 'vertical', minHeight: 100 }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = '#1e293b'}
          />
        )
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={e => setResponse(field.id, e.target.value)}
            style={S.input}
          >
            <option value="">Select an option...</option>
            {(field.options || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'radio':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(field.options || []).map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => setResponse(field.id, opt)}
                  style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                />
                <span style={{ color: '#cbd5e1', fontSize: 14 }}>{opt}</span>
              </label>
            ))}
          </div>
        )
      case 'checkbox':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={value || false}
              onChange={e => setResponse(field.id, e.target.checked)}
              style={{ accentColor: '#6366f1', width: 18, height: 18, cursor: 'pointer' }}
            />
            <span style={{ color: '#94a3b8', fontSize: 14 }}>{field.placeholder || 'Yes'}</span>
          </label>
        )
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={e => setResponse(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            style={S.input}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = '#1e293b'}
          />
        )
      default:
        return (
          <input
            type={field.field_type === 'email' ? 'email' : 'text'}
            value={value || ''}
            onChange={e => setResponse(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            style={S.input}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = '#1e293b'}
          />
        )
    }
  }

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '4px solid #1e293b', borderTop: '4px solid #6366f1', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b' }}>Loading registration form...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Store size={56} color="#818cf8" strokeWidth={1.8} />
        </div>
        <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Registration not found</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>This vendor registration form does not exist or is no longer active.</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 480, width: '100%', padding: 40, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #065f46, #047857)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle2 size={36} color="#d1fae5" strokeWidth={2.4} />
        </div>
        <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>Application Submitted!</h1>
        <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, margin: '0 0 24px' }}>
          Thank you for applying to <strong style={{ color: 'white' }}>{event?.name}</strong>. The organizer will review your application and be in touch shortly.
        </p>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Confirmation noted for <strong style={{ color: '#94a3b8' }}>{email}</strong>
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div style={S.page}>

      {/* Nav */}
      <nav style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/logo.svg" alt="Hobby Handler" style={{ height: 32, width: 'auto' }} />
      </nav>

      <div style={S.wrap}>

        {/* Event header */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', border: '1px solid #3730a3', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
          <p style={{ color: '#818cf8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>
            Vendor Registration
          </p>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: '0 0 14px', lineHeight: 1.2 }}>
            {event?.name}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {event?.start_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarDays size={15} color="#c7d2fe" strokeWidth={2.2} />
                <span style={{ color: '#c7d2fe', fontSize: 14 }}>
                  {new Date(event.start_date).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
            {event?.venue_location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={15} color="#c7d2fe" strokeWidth={2.2} />
                <span style={{ color: '#c7d2fe', fontSize: 14 }}>{event.venue_location}</span>
              </div>
            )}
          </div>
          {event?.description && (
            <p style={{ color: '#a5b4fc', fontSize: 14, margin: '14px 0 0', lineHeight: 1.6 }}>
              {event.description}
            </p>
          )}
        </div>

        {/* Business info */}
        <div style={S.card}>
          <h2 style={{ color: 'white', fontSize: 17, fontWeight: 700, margin: '0 0 20px' }}>
            Business Information
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={S.label}>
                Business Name <span style={S.req}>*</span>
              </label>
              <input
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g. Vintage Cards Co."
                style={S.input}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#1e293b'}
              />
            </div>

            <div>
              <label style={S.label}>Contact Name</label>
              <input
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="Your full name"
                style={S.input}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#1e293b'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={S.label}>
                  Email Address <span style={S.req}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  style={S.input}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#1e293b'}
                />
              </div>
              <div>
                <label style={S.label}>Phone Number</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(416) 555-0100"
                  style={S.input}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#1e293b'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Custom fields */}
        {fields.length > 0 && (
          <div style={S.card}>
            <h2 style={{ color: 'white', fontSize: 17, fontWeight: 700, margin: '0 0 20px' }}>
              Additional Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {fields.map(field => (
                <div key={field.id}>
                  <label style={S.label}>
                    {field.label}
                    {field.required && <span style={S.req}> *</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="#fca5a5" strokeWidth={2.2} />
              <p style={{ color: '#fca5a5', fontSize: 14, margin: 0 }}>{error}</p>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%',
            background: submitting ? '#312e81' : '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '16px',
            fontSize: 16,
            fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {submitting ? 'Submitting your application...' : 'Submit Vendor Application'}
        </button>

        <p style={{ color: '#334155', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
          By submitting you agree to be contacted by the event organizer regarding your application.
        </p>
      </div>
    </div>
  )
}