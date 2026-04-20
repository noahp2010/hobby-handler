'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import QRCode from 'qrcode'

const inputClass = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Modal({ children }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

const emptyForm = {
  event_id: '',
  attendee_name: '',
  attendee_email: '',
  ticket_type: 'general',
  price: '',
}

function generateTicketCode() {
  return 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showQR, setShowQR] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [filterEvent, setFilterEvent] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: ticketsData } = await supabase
      .from('tickets')
      .select('*, events(name)')
      .in('event_id', (eventsData || []).map(e => e.id))
      .order('created_at', { ascending: false })

    setEvents(eventsData || [])
    setTickets(ticketsData || [])
    setLoading(false)
  }

  function openCreate() {
    setForm({ ...emptyForm, event_id: events[0]?.id || '' })
    setEditingId(null)
    setMessage('')
    setShowModal(true)
  }

  function openEdit(ticket) {
    setForm({
      event_id: ticket.event_id || '',
      attendee_name: ticket.attendee_name || '',
      attendee_email: ticket.attendee_email || '',
      ticket_type: ticket.ticket_type || 'general',
      price: ticket.price || '',
    })
    setEditingId(ticket.id)
    setMessage('')
    setShowModal(true)
  }

  async function openQR(ticket) {
    setShowQR(ticket)
    const url = await QRCode.toDataURL(ticket.qr_code, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
    setQrDataUrl(url)
  }

  async function handleSave() {
    if (!form.attendee_name.trim()) {
      setMessage('Attendee name is required.')
      return
    }
    if (!form.event_id) {
      setMessage('Please select an event.')
      return
    }
    setSaving(true)
    const payload = {
      event_id: form.event_id,
      attendee_name: form.attendee_name,
      attendee_email: form.attendee_email,
      ticket_type: form.ticket_type,
      price: parseFloat(form.price) || 0,
      qr_code: editingId ? undefined : generateTicketCode(),
    }
    if (!editingId) {
      await supabase.from('tickets').insert(payload)
    } else {
      const { qr_code, ...updatePayload } = payload
      await supabase.from('tickets').update(updatePayload).eq('id', editingId)
    }
    setSaving(false)
    setShowModal(false)
    loadData()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this ticket? This cannot be undone.')) return
    await supabase.from('tickets').delete().eq('id', id)
    loadData()
  }

  async function toggleScanned(ticket) {
    const scanned = !ticket.scanned
    await supabase.from('tickets').update({
      scanned,
      scanned_at: scanned ? new Date().toISOString() : null
    }).eq('id', ticket.id)
    loadData()
  }

  const filtered = tickets
    .filter(t => filterEvent === 'all' || t.event_id === filterEvent)
    .filter(t =>
      t.attendee_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.attendee_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.qr_code || '').toLowerCase().includes(search.toLowerCase())
    )

  const totalRevenue = filtered.reduce((sum, t) => sum + (t.price || 0), 0)
  const scannedCount = filtered.filter(t => t.scanned).length

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          <p className="text-slate-400 mt-1 text-sm">Issue and manage attendee tickets.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          + Issue Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Total Tickets</p>
          <p className="text-2xl font-bold text-white mt-1">{filtered.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Scanned at Door</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{scannedCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Ticket Revenue</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          value={filterEvent}
          onChange={e => setFilterEvent(e.target.value)}
        >
          <option value="all">All Events</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>{event.name}</option>
          ))}
        </select>
        <input
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 w-64"
          placeholder="Search by name, email or ticket code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tickets list */}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-16 text-center">
          <p className="text-slate-400 text-sm">No tickets yet. Issue your first one!</p>
          <button
            onClick={openCreate}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            + Issue Ticket
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-6 gap-4 px-6 py-3 border-b border-slate-800 text-xs text-slate-500 font-medium uppercase tracking-wide">
            <div className="col-span-2">Attendee</div>
            <div>Event</div>
            <div>Type</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {filtered.map((ticket, i) => (
            <div
              key={ticket.id}
              className={`grid grid-cols-6 gap-4 px-6 py-4 items-center ${i !== filtered.length - 1 ? 'border-b border-slate-800' : ''}`}
            >
              <div className="col-span-2 min-w-0">
                <p className="text-white font-medium text-sm truncate">{ticket.attendee_name}</p>
                <p className="text-slate-500 text-xs">{ticket.attendee_email || 'No email'}</p>
                <p className="text-slate-600 text-xs font-mono">{ticket.qr_code}</p>
              </div>

              <div>
                <p className="text-slate-300 text-xs truncate">{ticket.events?.name || 'Unknown'}</p>
              </div>

              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  ticket.ticket_type === 'vip'
                    ? 'bg-amber-950 text-amber-400'
                    : ticket.ticket_type === 'early_bird'
                    ? 'bg-purple-950 text-purple-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {ticket.ticket_type}
                </span>
              </div>

              <div>
                <button
                  onClick={() => toggleScanned(ticket)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    ticket.scanned
                      ? 'bg-emerald-950 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {ticket.scanned ? 'Scanned' : 'Not scanned'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openQR(ticket)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-900 text-indigo-300 hover:bg-indigo-800 transition-colors"
                >
                  QR
                </button>
                <button
                  onClick={() => openEdit(ticket)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(ticket.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-950 transition-colors"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue Ticket Modal */}
      {showModal && (
        <Modal>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg">
              {editingId ? 'Edit Ticket' : 'Issue Ticket'}
            </h2>
            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">X</button>
          </div>

          <div className="space-y-4">
            <Field label="Event *">
              <select
                className={inputClass}
                value={form.event_id}
                onChange={e => setForm({ ...form, event_id: e.target.value })}
              >
                <option value="">Select an event...</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Attendee Name *">
              <input
                className={inputClass}
                value={form.attendee_name}
                onChange={e => setForm({ ...form, attendee_name: e.target.value })}
                placeholder="Jane Smith"
              />
            </Field>

            <Field label="Attendee Email">
              <input
                type="email"
                className={inputClass}
                value={form.attendee_email}
                onChange={e => setForm({ ...form, attendee_email: e.target.value })}
                placeholder="jane@email.com"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Ticket Type">
                <select
                  className={inputClass}
                  value={form.ticket_type}
                  onChange={e => setForm({ ...form, ticket_type: e.target.value })}
                >
                  <option value="general">General</option>
                  <option value="vip">VIP</option>
                  <option value="early_bird">Early Bird</option>
                  <option value="vendor">Vendor</option>
                  <option value="staff">Staff</option>
                </select>
              </Field>
              <Field label="Price ($)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
            </div>

            {message && <p className="text-red-400 text-sm">{message}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 text-sm transition-colors"
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Issue Ticket'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-3 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center max-w-sm w-full">
            <h2 className="text-white font-semibold text-lg mb-1">{showQR.attendee_name}</h2>
            <p className="text-slate-400 text-sm mb-6">{showQR.events?.name}</p>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-xl mb-4" style={{ width: 220, height: 220 }} />
            )}
            <p className="text-slate-500 text-xs font-mono mb-6">{showQR.qr_code}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = qrDataUrl
                  link.download = 'ticket-' + showQR.qr_code + '.png'
                  link.click()
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                Download QR
              </button>
  
              <button
                onClick={() => { setShowQR(null); setQrDataUrl('') }}
                className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}