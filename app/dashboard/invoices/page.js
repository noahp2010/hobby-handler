'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const inputClass = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function InvoicesPage() {
  const [events, setEvents] = useState([])
  const [vendors, setVendors] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedVendor, setSelectedVendor] = useState('')
  const [orgProfile, setOrgProfile] = useState({})
  const [invoiceNote, setInvoiceNote] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [preview, setPreview] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }
    setOrgProfile(user.user_metadata || {})
    const { data: ev } = await supabase
      .from('events').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setEvents(ev || [])
    if (ev && ev.length > 0) {
      setSelectedEvent(ev[0].id)
      loadVendors(ev[0].id)
    }
  }

  async function loadVendors(eventId) {
    const { data } = await supabase
      .from('vendors').select('*').eq('event_id', eventId)
    setVendors(data || [])
    setSelectedVendor(data?.[0]?.id || '')
  }

  const event = events.find(e => e.id === selectedEvent)
  const vendor = vendors.find(v => v.id === selectedVendor)
  const invoiceNumber = 'INV-' + Date.now().toString().slice(-6)

  function printInvoice() {
    window.print()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-slate-400 mt-1 text-sm">Generate and print invoices for vendors.</p>
        </div>
        {preview && (
          <button
            onClick={printInvoice}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Print / Save PDF
          </button>
        )}
      </div>

      {/* Invoice builder */}
      {!preview ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold">Build Invoice</h2>

          <Field label="Select Event">
            <select
              className={inputClass}
              value={selectedEvent}
              onChange={e => { setSelectedEvent(e.target.value); loadVendors(e.target.value) }}
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Select Vendor">
            <select
              className={inputClass}
              value={selectedVendor}
              onChange={e => setSelectedVendor(e.target.value)}
            >
              {vendors.length === 0
                ? <option>No vendors for this event</option>
                : vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.business_name}</option>
                ))
              }
            </select>
          </Field>

          <Field label="Due Date">
            <input
              type="date"
              className={inputClass}
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </Field>

          <Field label="Notes (optional)">
            <textarea
              className={inputClass + ' resize-none h-24'}
              value={invoiceNote}
              onChange={e => setInvoiceNote(e.target.value)}
              placeholder="e.g. Payment due upon receipt. Thank you for participating!"
            />
          </Field>

          <button
            onClick={() => setPreview(true)}
            disabled={!vendor}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Preview Invoice
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setPreview(false)}
            className="text-slate-400 hover:text-white text-sm mb-4 transition-colors"
          >
            ← Back to builder
          </button>

          {/* Invoice preview */}
          <div id="invoice" className="bg-white rounded-2xl p-10 text-slate-900" style={{ fontFamily: 'sans-serif' }}>

            {/* Invoice header */}
            <div className="flex justify-between items-start mb-10">
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1f3a67', margin: 0 }}>INVOICE</h1>
                <p style={{ color: '#89a3c8', marginTop: 4, fontSize: 14 }}>{invoiceNumber}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 700, fontSize: 18, color: '#1f3a67', margin: 0 }}>
                  {orgProfile.org_name || 'Your Organization'}
                </p>
                {orgProfile.org_address && <p style={{ color: '#89a3c8', fontSize: 13, marginTop: 2 }}>{orgProfile.org_address}</p>}
                {orgProfile.org_phone && <p style={{ color: '#89a3c8', fontSize: 13 }}>{orgProfile.org_phone}</p>}
                {orgProfile.org_website && <p style={{ color: '#4b86d4', fontSize: 13 }}>{orgProfile.org_website}</p>}
              </div>
            </div>

            {/* Bill to / event info */}
            <div className="flex gap-10 mb-10">
              <div style={{ flex: 1 }}>
                <p style={{ color: '#b8cbe4', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Bill To</p>
                <p style={{ fontWeight: 700, fontSize: 16, color: '#1f3a67', margin: 0 }}>{vendor?.business_name}</p>
                {vendor?.contact_name && <p style={{ color: '#89a3c8', fontSize: 13, marginTop: 2 }}>{vendor.contact_name}</p>}
                {vendor?.email && <p style={{ color: '#89a3c8', fontSize: 13 }}>{vendor.email}</p>}
                {vendor?.phone && <p style={{ color: '#89a3c8', fontSize: 13 }}>{vendor.phone}</p>}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#b8cbe4', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Event Details</p>
                <p style={{ fontWeight: 700, fontSize: 16, color: '#1f3a67', margin: 0 }}>{event?.name}</p>
                {event?.venue_location && <p style={{ color: '#89a3c8', fontSize: 13, marginTop: 2 }}>{event.venue_location}</p>}
                {event?.start_date && <p style={{ color: '#89a3c8', fontSize: 13 }}>{new Date(event.start_date).toLocaleDateString()}</p>}
              </div>
              <div>
                <p style={{ color: '#b8cbe4', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Invoice Info</p>
                <p style={{ fontSize: 13, color: '#89a3c8', margin: 0 }}>Date: {new Date().toLocaleDateString()}</p>
                {dueDate && <p style={{ fontSize: 13, color: '#89a3c8', marginTop: 2 }}>Due: {new Date(dueDate).toLocaleDateString()}</p>}
                <p style={{ fontSize: 13, color: '#89a3c8', marginTop: 2 }}>
                  Status: <span style={{ color: vendor?.payment_status === 'paid' ? '#059669' : '#dc2626', fontWeight: 700 }}>
                    {(vendor?.payment_status || 'unpaid').toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            {/* Line items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#89a3c8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#89a3c8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Booth</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#89a3c8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#1f3a67' }}>
                    Vendor Booth Fee — {event?.name}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#89a3c8' }}>
                    {vendor?.booth_number || 'TBD'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#1f3a67', textAlign: 'right', fontWeight: 600 }}>
                    ${(vendor?.payment_amount || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
              <div style={{ minWidth: 240 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#1f3a67' }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#1f3a67' }}>${(vendor?.payment_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoiceNote && (
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#b8cbe4', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Notes</p>
                <p style={{ fontSize: 13, color: '#89a3c8', margin: 0 }}>{invoiceNote}</p>
              </div>
            )}

            <p style={{ fontSize: 12, color: '#b8cbe4', textAlign: 'center', marginTop: 32 }}>
              Thank you for being part of {event?.name}!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}