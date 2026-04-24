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
  company_name: '',
  contact_name: '',
  email: '',
  tier: 'bronze',
  amount: '',
  status: 'pending',
}

const tierColors = {
  bronze:   { bg: 'bg-slate-800',  text: 'text-slate-300'  },
  silver:   { bg: 'bg-slate-700',  text: 'text-slate-200'  },
  gold:     { bg: 'bg-indigo-950', text: 'text-indigo-300' },
  platinum: { bg: 'bg-indigo-900', text: 'text-indigo-200' },
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [filterEvent, setFilterEvent] = useState('all')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: sponsorsData } = await supabase
      .from('sponsors')
      .select('*, events(name)')
      .in('event_id', (eventsData || []).map(e => e.id))
      .order('created_at', { ascending: false })

    setEvents(eventsData || [])
    setSponsors(sponsorsData || [])
    setLoading(false)
  }

  function openCreate() {
    setForm({ ...emptyForm, event_id: events[0]?.id || '' })
    setEditingId(null)
    setMessage('')
    setShowModal(true)
  }

  function openEdit(sponsor) {
    setForm({
      event_id: sponsor.event_id || '',
      company_name: sponsor.company_name || '',
      contact_name: sponsor.contact_name || '',
      email: sponsor.email || '',
      tier: sponsor.tier || 'bronze',
      amount: sponsor.amount || '',
      status: sponsor.status || 'pending',
    })
    setEditingId(sponsor.id)
    setMessage('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.company_name.trim()) {
      setMessage('Company name is required.')
      return
    }
    if (!form.event_id) {
      setMessage('Please select an event.')
      return
    }
    setSaving(true)
    const payload = {
      event_id: form.event_id,
      company_name: form.company_name,
      contact_name: form.contact_name,
      email: form.email,
      tier: form.tier,
      amount: parseFloat(form.amount) || 0,
      status: form.status,
    }
    if (editingId) {
      await supabase.from('sponsors').update(payload).eq('id', editingId)
    } else {
      await supabase.from('sponsors').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    loadData()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this sponsor? This cannot be undone.')) return
    await supabase.from('sponsors').delete().eq('id', id)
    loadData()
  }

  const filtered = filterEvent === 'all'
    ? sponsors
    : sponsors.filter(s => s.event_id === filterEvent)

  const totalValue = filtered.reduce((sum, s) => sum + (s.amount || 0), 0)
  const confirmedValue = filtered
    .filter(s => s.status === 'confirmed')
    .reduce((sum, s) => sum + (s.amount || 0), 0)

  const tierCounts = { platinum: 0, gold: 0, silver: 0, bronze: 0 }
  filtered.forEach(s => { if (tierCounts[s.tier] !== undefined) tierCounts[s.tier]++ })

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sponsors</h1>
          <p className="text-slate-400 mt-1 text-sm">Track sponsorship tiers and deals.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          + Add Sponsor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Total Sponsors</p>
          <p className="text-2xl font-bold text-white mt-1">{filtered.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Total Value</p>
          <p className="text-2xl font-bold text-indigo-300 mt-1">${totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Confirmed Value</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">${confirmedValue.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Tier Breakdown</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {Object.entries(tierCounts).map(([tier, count]) => (
              <span key={tier} className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColors[tier].bg} ${tierColors[tier].text}`}>
                {count} {tier}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <p className="text-slate-400 text-sm">Filter by event:</p>
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
      </div>

      {/* Sponsors list */}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-16 text-center">
          <p className="text-slate-400 text-sm">No sponsors yet. Add your first one!</p>
          <button
            onClick={openCreate}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            + Add Sponsor
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-6 gap-4 px-6 py-3 border-b border-slate-800 text-xs text-slate-500 font-medium uppercase tracking-wide">
            <div className="col-span-2">Company</div>
            <div>Event</div>
            <div>Tier</div>
            <div>Amount</div>
            <div>Actions</div>
          </div>

          {filtered.map((sponsor, i) => (
            <div
              key={sponsor.id}
              className={`grid grid-cols-6 gap-4 px-6 py-4 items-center ${i !== filtered.length - 1 ? 'border-b border-slate-800' : ''}`}
            >
              <div className="col-span-2 min-w-0">
                <p className="text-white font-medium text-sm truncate">{sponsor.company_name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{sponsor.contact_name || 'No contact'}</p>
                {sponsor.email && <p className="text-slate-600 text-xs">{sponsor.email}</p>}
              </div>

              <div>
                <p className="text-slate-300 text-xs truncate">{sponsor.events?.name || 'Unknown'}</p>
              </div>

              <div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tierColors[sponsor.tier]?.bg} ${tierColors[sponsor.tier]?.text}`}>
                  {sponsor.tier}
                </span>
              </div>

              <div>
                <p className="text-white text-sm font-medium">${(sponsor.amount || 0).toFixed(2)}</p>
                <span className={`text-xs font-medium ${
                  sponsor.status === 'confirmed' ? 'text-emerald-400' :
                  sponsor.status === 'declined' ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {sponsor.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(sponsor)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(sponsor.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-950 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg">
              {editingId ? 'Edit Sponsor' : 'Add Sponsor'}
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

            <Field label="Company Name *">
              <input
                className={inputClass}
                value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value })}
                placeholder="e.g. Acme Collectibles Inc."
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Name">
                <input
                  className={inputClass}
                  value={form.contact_name}
                  onChange={e => setForm({ ...form, contact_name: e.target.value })}
                  placeholder="Jane Smith"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@company.com"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Sponsorship Tier">
                <select
                  className={inputClass}
                  value={form.tier}
                  onChange={e => setForm({ ...form, tier: e.target.value })}
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </Field>
              <Field label="Sponsorship Amount ($)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
            </div>

            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
              </select>
            </Field>

            {message && <p className="text-red-400 text-sm">{message}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 text-sm transition-colors"
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Sponsor'}
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
    </div>
  )
}