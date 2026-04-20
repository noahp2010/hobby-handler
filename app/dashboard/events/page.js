'use client'
import { useState, useEffect } from 'react'
import { Calendar, MapPin, Tag } from 'lucide-react'
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
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  venue_location: '',
  event_location: '',
  tags: '',
  status: 'draft',
}

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setEvents(data || [])
    setLoading(false)
  }

  function openCreate() {
    setForm(emptyForm)
    setEditingId(null)
    setMessage('')
    setShowModal(true)
  }

  function openEdit(event) {
    setForm({
      name: event.name || '',
      description: event.description || '',
      start_date: event.start_date ? event.start_date.slice(0, 16) : '',
      end_date: event.end_date ? event.end_date.slice(0, 16) : '',
      venue_location: event.venue_location || '',
      event_location: event.event_location || '',
      tags: event.tags ? event.tags.join(', ') : '',
      status: event.status || 'draft',
    })
    setEditingId(event.id)
    setMessage('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setMessage('Event name is required.')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      name: form.name,
      description: form.description,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      venue_location: form.venue_location,
      event_location: form.event_location,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      status: form.status,
      user_id: user.id,
    }
    if (editingId) {
      await supabase.from('events').update(payload).eq('id', editingId)
    } else {
      await supabase.from('events').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    loadEvents()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return
    await supabase.from('events').delete().eq('id', id)
    loadEvents()
  }

  async function togglePublish(event) {
    const newStatus = event.status === 'Published' ? 'Draft' : 'Published'
    await supabase.from('events').update({ status: newStatus }).eq('id', event.id)
    loadEvents()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-slate-400 mt-1 text-sm">Create and manage your collectible events.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          + New Event
        </button>
      </div>

      {/* Events list */}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : events.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-16 text-center">
          <p className="text-slate-400 text-sm">No events yet. Create your first one!</p>
          <button
            onClick={openCreate}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            + New Event
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-white font-semibold">{event.name}</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    event.status === 'Published'
                      ? 'bg-emerald-950 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {event.status}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-1 truncate">{event.description || 'No description'}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                  {event.venue_location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} />
                      {event.venue_location}
                    </span>
                  )}
                  {event.start_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={13} />
                      {new Date(event.start_date).toLocaleDateString()}
                    </span>
                  )}
                  {event.tags?.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Tag size={13} />
                      {event.tags.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => togglePublish(event)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    event.status === 'Published'
                      ? 'bg-slate-800 text-slate-400 hover:text-white'
                      : 'bg-emerald-900 text-emerald-400 hover:bg-emerald-800'
                  }`}
                >
                  {event.status === 'Published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => openEdit(event)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
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
              {editingId ? 'Edit Event' : 'New Event'}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-slate-400 hover:text-white text-xl"
            >
              X
            </button>
          </div>

          <div className="space-y-4">
            <Field label="Event Name *">
              <input
                className={inputClass}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Collectibles Expo 2025"
              />
            </Field>

            <Field label="Description">
              <textarea
                className={inputClass + ' resize-none h-24'}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Tell attendees about your event..."
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Date and Time">
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })}
                />
              </Field>
              <Field label="End Date and Time">
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Venue Location">
              <input
                className={inputClass}
                value={form.venue_location}
                onChange={e => setForm({ ...form, venue_location: e.target.value })}
                placeholder="e.g. Metro Toronto Convention Centre"
              />
            </Field>

            <Field label="Event Location (City, Province)">
              <input
                className={inputClass}
                value={form.event_location}
                onChange={e => setForm({ ...form, event_location: e.target.value })}
                placeholder="e.g. Toronto, Ontario"
              />
            </Field>

            <Field label="Tags (comma separated)">
              <input
                className={inputClass}
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g. Comic Con, Trading Cards, Collectibles"
              />
            </Field>

            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </Field>

            {message && (
              <p className="text-red-400 text-sm">{message}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 text-sm transition-colors"
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Event'}
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