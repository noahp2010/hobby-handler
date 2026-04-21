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

function Modal({ children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className={`bg-slate-900 border border-slate-700 rounded-2xl ${wide ? 'w-full max-w-3xl' : 'w-full max-w-2xl'} max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function generateTicketCode() {
  return 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

const emptyTypeForm = { name: '', description: '', price: '', quantity_total: 100, sale_start: '', sale_end: '', is_active: true }
const emptyTicketForm = { event_id: '', attendee_name: '', attendee_email: '', ticket_type: 'general', price: '' }

export default function TicketsPage() {
  const [tickets, setTickets] = useState([])
  const [events, setEvents] = useState([])
  const [ticketTypes, setTicketTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('tickets')
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [showQR, setShowQR] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [ticketForm, setTicketForm] = useState(emptyTicketForm)
  const [typeForm, setTypeForm] = useState(emptyTypeForm)
  const [editingTicketId, setEditingTicketId] = useState(null)
  const [editingTypeId, setEditingTypeId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filterEvent, setFilterEvent] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedEventForTypes, setSelectedEventForTypes] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: eventsData } = await supabase.from('events').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    const eventIds = (eventsData || []).map(e => e.id)
    const { data: ticketsData } = await supabase.from('tickets').select('*, events(name)').in('event_id', eventIds).order('created_at', { ascending: false })
    const { data: typesData } = await supabase.from('ticket_types').select('*, events(name)').in('event_id', eventIds).order('created_at', { ascending: false })
    setEvents(eventsData || [])
    setTickets(ticketsData || [])
    setTicketTypes(typesData || [])
    if (eventsData && eventsData.length > 0) setSelectedEventForTypes(eventsData[0].id)
    setLoading(false)
  }

  async function openQR(ticket) {
    setShowQR(ticket)
    const url = await QRCode.toDataURL(ticket.qr_code, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
    setQrDataUrl(url)
  }

  async function saveTicket() {
    if (!ticketForm.attendee_name.trim()) return
    setSaving(true)
    const payload = {
      event_id: ticketForm.event_id,
      attendee_name: ticketForm.attendee_name,
      attendee_email: ticketForm.attendee_email,
      ticket_type: ticketForm.ticket_type,
      price: parseFloat(ticketForm.price) || 0,
      qr_code: editingTicketId ? undefined : generateTicketCode(),
    }
    if (editingTicketId) {
      const { qr_code, ...update } = payload
      await supabase.from('tickets').update(update).eq('id', editingTicketId)
    } else {
      await supabase.from('tickets').insert(payload)
    }
    setSaving(false)
    setShowTicketModal(false)
    loadData()
  }

  async function saveTicketType() {
    if (!typeForm.name.trim() || !selectedEventForTypes) return
    setSaving(true)
    const payload = {
      event_id: selectedEventForTypes,
      name: typeForm.name,
      description: typeForm.description,
      price: parseFloat(typeForm.price) || 0,
      quantity_total: parseInt(typeForm.quantity_total) || 100,
      sale_start: typeForm.sale_start || null,
      sale_end: typeForm.sale_end || null,
      is_active: typeForm.is_active,
    }
    if (editingTypeId) {
      await supabase.from('ticket_types').update(payload).eq('id', editingTypeId)
    } else {
      await supabase.from('ticket_types').insert(payload)
    }
    setSaving(false)
    setShowTypeModal(false)
    loadData()
  }

  async function deleteTicket(id) {
    if (!confirm('Delete this ticket?')) return
    await supabase.from('tickets').delete().eq('id', id)
    loadData()
  }

  async function deleteTicketType(id) {
    if (!confirm('Delete this ticket type?')) return
    await supabase.from('ticket_types').delete().eq('id', id)
    loadData()
  }

  async function toggleScanned(ticket) {
    await supabase.from('tickets').update({ scanned: !ticket.scanned, scanned_at: !ticket.scanned ? new Date().toISOString() : null }).eq('id', ticket.id)
    loadData()
  }

  const filteredTickets = tickets
    .filter(t => filterEvent === 'all' || t.event_id === filterEvent)
    .filter(t => t.attendee_name.toLowerCase().includes(search.toLowerCase()) || (t.attendee_email || '').toLowerCase().includes(search.toLowerCase()))

  const filteredTypes = ticketTypes.filter(t => filterEvent === 'all' || t.event_id === filterEvent)
  const totalRevenue = filteredTickets.reduce((sum, t) => sum + (t.price || 0), 0)
  const scannedCount = filteredTickets.filter(t => t.scanned).length

  const publicLink = selectedEventForTypes ? `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${selectedEventForTypes}/tickets` : ''

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage ticket types, issue tickets, and track attendance.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setTypeForm(emptyTypeForm); setEditingTypeId(null); setShowTypeModal(true) }} className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors border border-slate-700">
            + Ticket Type
          </button>
          <button onClick={() => { setTicketForm({ ...emptyTicketForm, event_id: events[0]?.id || '' }); setEditingTicketId(null); setShowTicketModal(true) }} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
            + Issue Ticket
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Total Tickets</p>
          <p className="text-2xl font-bold text-white mt-1">{filteredTickets.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Checked In</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{scannedCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Ticket Revenue</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Public purchase link */}
      <div className="bg-indigo-950 border border-indigo-800 rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-indigo-300 font-semibold text-sm">Public Ticket Purchase Page</p>
            <p className="text-indigo-400 text-xs mt-1">Share this link or embed it on your website so attendees can buy tickets directly.</p>
          </div>
          <select
            className="bg-indigo-900 border border-indigo-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
            value={selectedEventForTypes}
            onChange={e => setSelectedEventForTypes(e.target.value)}
          >
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
        {selectedEventForTypes && (
          <div className="mt-4 space-y-3">
            <div className="bg-indigo-900 rounded-lg px-4 py-2.5 font-mono text-xs text-indigo-300 break-all">
              {publicLink}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigator.clipboard.writeText(publicLink)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={() => window.open(publicLink, '_blank')}
                className="bg-indigo-800 hover:bg-indigo-700 text-indigo-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Preview Page
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(`<iframe src="${publicLink}" width="100%" height="700" frameborder="0"></iframe>`)}
                className="bg-indigo-800 hover:bg-indigo-700 text-indigo-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Copy Embed Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {['tickets', 'types'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${tab === t ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            {t === 'tickets' ? 'Issued Tickets' : 'Ticket Types'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none" value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
          <option value="all">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        {tab === 'tickets' && (
          <input
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none w-64"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        )}
      </div>

      {/* Tickets list */}
      {tab === 'tickets' && (
        loading ? <p className="text-slate-400 text-sm">Loading...</p> :
        filteredTickets.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-16 text-center">
            <p className="text-slate-400 text-sm">No tickets yet.</p>
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
            {filteredTickets.map((ticket, i) => (
              <div key={ticket.id} className={`grid grid-cols-6 gap-4 px-6 py-4 items-center ${i !== filteredTickets.length - 1 ? 'border-b border-slate-800' : ''}`}>
                <div className="col-span-2 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{ticket.attendee_name}</p>
                  <p className="text-slate-500 text-xs">{ticket.attendee_email || 'No email'}</p>
                  <p className="text-slate-600 text-xs font-mono">{ticket.qr_code}</p>
                </div>
                <div><p className="text-slate-300 text-xs truncate">{ticket.events?.name}</p></div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ticket.ticket_type === 'vip' ? 'bg-amber-950 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                    {ticket.ticket_type}
                  </span>
                </div>
                <div>
                  <button onClick={() => toggleScanned(ticket)} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${ticket.scanned ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {ticket.scanned ? 'Checked in' : 'Not checked in'}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openQR(ticket)} className="text-xs px-2 py-1.5 rounded-lg bg-indigo-900 text-indigo-300 hover:bg-indigo-800 transition-colors">QR</button>
                  <button onClick={() => deleteTicket(ticket.id)} className="text-xs px-2 py-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-950 transition-colors">Del</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Ticket types list */}
      {tab === 'types' && (
        filteredTypes.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-16 text-center">
            <p className="text-slate-400 text-sm">No ticket types yet. Create one to start selling tickets!</p>
            <button onClick={() => { setTypeForm(emptyTypeForm); setEditingTypeId(null); setShowTypeModal(true) }} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              + Create Ticket Type
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTypes.map(type => (
              <div key={type.id} className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-white font-semibold">{type.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${type.is_active ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                      {type.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {type.description && <p className="text-slate-500 text-sm mt-1">{type.description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>Price: <span className="text-white font-medium">${type.price === 0 ? 'Free' : type.price}</span></span>
                    <span>Sold: <span className="text-white font-medium">{type.quantity_sold}/{type.quantity_total}</span></span>
                    <span>Event: <span className="text-slate-300">{type.events?.name}</span></span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setTypeForm({ name: type.name, description: type.description || '', price: type.price, quantity_total: type.quantity_total, sale_start: type.sale_start ? type.sale_start.slice(0, 16) : '', sale_end: type.sale_end ? type.sale_end.slice(0, 16) : '', is_active: type.is_active }); setEditingTypeId(type.id); setSelectedEventForTypes(type.event_id); setShowTypeModal(true) }} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">Edit</button>
                  <button onClick={() => deleteTicketType(type.id)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-950 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center max-w-sm w-full">
            <h2 className="text-white font-semibold text-lg mb-1">{showQR.attendee_name}</h2>
            <p className="text-slate-400 text-sm mb-6">{showQR.events?.name}</p>
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-xl mb-4" style={{ width: 220, height: 220 }} />}
            <p className="text-slate-500 text-xs font-mono mb-6">{showQR.qr_code}</p>
            <div className="flex gap-3">
              <button onClick={() => { const l = document.createElement('a'); l.href = qrDataUrl; l.download = 'ticket-' + showQR.qr_code + '.png'; l.click() }} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">Download QR</button>
              <button onClick={() => { setShowQR(null); setQrDataUrl('') }} className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-sm transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Ticket Modal */}
      {showTicketModal && (
        <Modal>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg">{editingTicketId ? 'Edit Ticket' : 'Issue Ticket'}</h2>
            <button onClick={() => setShowTicketModal(false)} className="text-slate-400 hover:text-white text-xl">X</button>
          </div>
          <div className="space-y-4">
            <Field label="Event *">
              <select className={inputClass} value={ticketForm.event_id} onChange={e => setTicketForm({ ...ticketForm, event_id: e.target.value })}>
                <option value="">Select event...</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </Field>
            <Field label="Attendee Name *">
              <input className={inputClass} value={ticketForm.attendee_name} onChange={e => setTicketForm({ ...ticketForm, attendee_name: e.target.value })} placeholder="Jane Smith" />
            </Field>
            <Field label="Attendee Email">
              <input type="email" className={inputClass} value={ticketForm.attendee_email} onChange={e => setTicketForm({ ...ticketForm, attendee_email: e.target.value })} placeholder="jane@email.com" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ticket Type">
                <select className={inputClass} value={ticketForm.ticket_type} onChange={e => setTicketForm({ ...ticketForm, ticket_type: e.target.value })}>
                  <option value="general">General</option>
                  <option value="vip">VIP</option>
                  <option value="early_bird">Early Bird</option>
                  <option value="vendor">Vendor</option>
                  <option value="staff">Staff</option>
                </select>
              </Field>
              <Field label="Price ($)">
                <input type="number" className={inputClass} value={ticketForm.price} onChange={e => setTicketForm({ ...ticketForm, price: e.target.value })} placeholder="0.00" />
              </Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveTicket} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 text-sm transition-colors">
                {saving ? 'Saving...' : editingTicketId ? 'Save Changes' : 'Issue Ticket'}
              </button>
              <button onClick={() => setShowTicketModal(false)} className="px-5 py-3 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Ticket Type Modal */}
      {showTypeModal && (
        <Modal>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg">{editingTypeId ? 'Edit Ticket Type' : 'Create Ticket Type'}</h2>
            <button onClick={() => setShowTypeModal(false)} className="text-slate-400 hover:text-white text-xl">X</button>
          </div>
          <div className="space-y-4">
            <Field label="Event *">
              <select className={inputClass} value={selectedEventForTypes} onChange={e => setSelectedEventForTypes(e.target.value)}>
                <option value="">Select event...</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </Field>
            <Field label="Ticket Name *">
              <input className={inputClass} value={typeForm.name} onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} placeholder="e.g. General Admission, VIP, Early Bird" />
            </Field>
            <Field label="Description">
              <textarea className={inputClass + ' resize-none h-20'} value={typeForm.description} onChange={e => setTypeForm({ ...typeForm, description: e.target.value })} placeholder="What's included with this ticket?" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (CAD)">
                <input type="number" className={inputClass} value={typeForm.price} onChange={e => setTypeForm({ ...typeForm, price: e.target.value })} placeholder="0.00" />
              </Field>
              <Field label="Total Quantity">
                <input type="number" className={inputClass} value={typeForm.quantity_total} onChange={e => setTypeForm({ ...typeForm, quantity_total: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Sale Start">
                <input type="datetime-local" className={inputClass} value={typeForm.sale_start} onChange={e => setTypeForm({ ...typeForm, sale_start: e.target.value })} />
              </Field>
              <Field label="Sale End">
                <input type="datetime-local" className={inputClass} value={typeForm.sale_end} onChange={e => setTypeForm({ ...typeForm, sale_end: e.target.value })} />
              </Field>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={typeForm.is_active} onChange={e => setTypeForm({ ...typeForm, is_active: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="is_active" className="text-sm text-slate-400">Active (visible on public purchase page)</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveTicketType} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 text-sm transition-colors">
                {saving ? 'Saving...' : editingTypeId ? 'Save Changes' : 'Create Ticket Type'}
              </button>
              <button onClick={() => setShowTypeModal(false)} className="px-5 py-3 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}