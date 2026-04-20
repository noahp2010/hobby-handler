'use client'
import { useState, useEffect } from 'react'
import { Gift } from 'lucide-react'
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
  prize_name: '',
  description: '',
  status: 'active',
}

export default function GiveawaysPage() {
  const [giveaways, setGiveaways] = useState([])
  const [events, setEvents] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showWinner, setShowWinner] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState(null)
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

    const { data: giveawaysData } = await supabase
      .from('giveaways')
      .select('*, events(name), tickets(attendee_name, attendee_email)')
      .in('event_id', (eventsData || []).map(e => e.id))
      .order('created_at', { ascending: false })

    const { data: ticketsData } = await supabase
      .from('tickets')
      .select('*')
      .in('event_id', (eventsData || []).map(e => e.id))

    setEvents(eventsData || [])
    setGiveaways(giveawaysData || [])
    setTickets(ticketsData || [])
    setLoading(false)
  }

  function openCreate() {
    setForm({ ...emptyForm, event_id: events[0]?.id || '' })
    setEditingId(null)
    setMessage('')
    setShowModal(true)
  }

  function openEdit(giveaway) {
    setForm({
      event_id: giveaway.event_id || '',
      prize_name: giveaway.prize_name || '',
      description: giveaway.description || '',
      status: giveaway.status || 'active',
    })
    setEditingId(giveaway.id)
    setMessage('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.prize_name.trim()) {
      setMessage('Prize name is required.')
      return
    }
    if (!form.event_id) {
      setMessage('Please select an event.')
      return
    }
    setSaving(true)
    const payload = {
      event_id: form.event_id,
      prize_name: form.prize_name,
      description: form.description,
      status: form.status,
    }
    if (editingId) {
      await supabase.from('giveaways').update(payload).eq('id', editingId)
    } else {
      await supabase.from('giveaways').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    loadData()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this giveaway? This cannot be undone.')) return
    await supabase.from('giveaways').delete().eq('id', id)
    loadData()
  }

  async function pickWinner(giveaway) {
    const eligible = tickets.filter(t => t.event_id === giveaway.event_id)
    if (eligible.length === 0) {
      alert('No tickets found for this event. Issue tickets first!')
      return
    }
    setShowWinner(giveaway)
    setWinner(null)
    setSpinning(true)

    let count = 0
    const interval = setInterval(() => {
      const random = eligible[Math.floor(Math.random() * eligible.length)]
      setWinner(random)
      count++
      if (count > 20) {
        clearInterval(interval)
        const finalWinner = eligible[Math.floor(Math.random() * eligible.length)]
        setWinner(finalWinner)
        setSpinning(false)
        supabase.from('giveaways')
          .update({ winner_ticket_id: finalWinner.id, status: 'completed' })
          .eq('id', giveaway.id)
          .then(() => loadData())
      }
    }, 80)
  }

  const filtered = filterEvent === 'all'
    ? giveaways
    : giveaways.filter(g => g.event_id === filterEvent)

  const activeCount = filtered.filter(g => g.status === 'active').length
  const completedCount = filtered.filter(g => g.status === 'completed').length

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Giveaways</h1>
          <p className="text-slate-400 mt-1 text-sm">Run prize draws and pick winners from your attendees.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          + New Giveaway
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Total Giveaways</p>
          <p className="text-2xl font-bold text-white mt-1">{filtered.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Active</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Completed</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{completedCount}</p>
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

      {/* Giveaways list */}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-16 text-center">
          <p className="text-slate-400 text-sm">No giveaways yet. Create your first one!</p>
          <button
            onClick={openCreate}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            + New Giveaway
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(giveaway => (
            <div key={giveaway.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-white font-semibold text-lg inline-flex items-center gap-2">
                      <Gift size={18} />
                      {giveaway.prize_name}
                    </p>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      giveaway.status === 'completed'
                        ? 'bg-indigo-950 text-indigo-400'
                        : giveaway.status === 'cancelled'
                        ? 'bg-red-950 text-red-400'
                        : 'bg-emerald-950 text-emerald-400'
                    }`}>
                      {giveaway.status}
                    </span>
                  </div>

                  {giveaway.description && (
                    <p className="text-slate-400 text-sm mt-1">{giveaway.description}</p>
                  )}

                  <p className="text-slate-500 text-xs mt-2">
                    Event: {giveaway.events?.name || 'Unknown'}
                  </p>

                  {giveaway.status === 'completed' && giveaway.tickets && (
                    <div className="mt-3 bg-indigo-950 border border-indigo-800 rounded-xl px-4 py-3 inline-block">
                      <p className="text-indigo-300 text-xs font-medium">Winner</p>
                      <p className="text-white font-semibold mt-0.5">{giveaway.tickets.attendee_name}</p>
                      {giveaway.tickets.attendee_email && (
                        <p className="text-indigo-400 text-xs">{giveaway.tickets.attendee_email}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {giveaway.status === 'active' && (
                    <button
                      onClick={() => pickWinner(giveaway)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      Pick Winner
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(giveaway)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(giveaway.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-950 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Winner Picker Modal */}
      {showWinner && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-10 text-center max-w-sm w-full">
            <p className="text-slate-400 text-sm mb-2">Drawing winner for</p>
            <p className="text-white font-bold text-xl mb-8 inline-flex items-center gap-2">
              <Gift size={20} />
              {showWinner.prize_name}
            </p>

            <div className="bg-slate-800 rounded-2xl p-6 mb-8 min-h-[100px] flex flex-col items-center justify-center">
              {winner ? (
                <>
                  <p className={`text-2xl font-bold transition-all ${spinning ? 'text-slate-400 blur-sm' : 'text-white'}`}>
                    {winner.attendee_name}
                  </p>
                  {!spinning && winner.attendee_email && (
                    <p className="text-indigo-400 text-sm mt-1">{winner.attendee_email}</p>
                  )}
                  {!spinning && (
                    <p className="text-emerald-400 text-xs mt-1 font-mono">{winner.qr_code}</p>
                  )}
                </>
              ) : (
                <p className="text-slate-500 text-sm">Drawing...</p>
              )}
            </div>

            {!spinning && winner && (
              <div className="space-y-3">
                <div className="bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3">
                  <p className="text-emerald-400 text-sm font-medium">Winner selected!</p>
                  <p className="text-emerald-300 text-xs mt-0.5">Result has been saved automatically.</p>
                </div>
                <button
                  onClick={() => { setShowWinner(null); setWinner(null) }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-3 text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            )}

            {spinning && (
              <p className="text-slate-400 text-sm animate-pulse">Picking a winner...</p>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg">
              {editingId ? 'Edit Giveaway' : 'New Giveaway'}
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

            <Field label="Prize Name *">
              <input
                className={inputClass}
                value={form.prize_name}
                onChange={e => setForm({ ...form, prize_name: e.target.value })}
                placeholder="e.g. Rare Holographic Charizard"
              />
            </Field>

            <Field label="Description">
              <textarea
                className={inputClass + ' resize-none h-24'}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the prize or rules..."
              />
            </Field>

            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>

            {message && <p className="text-red-400 text-sm">{message}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 text-sm transition-colors"
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Giveaway'}
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