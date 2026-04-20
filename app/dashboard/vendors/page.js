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
  business_name: '',
  contact_name: '',
  email: '',
  phone: '',
  booth_number: '',
  payment_amount: '',
  payment_status: 'unpaid',
  status: 'pending',
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState([])
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

    const { data: vendorsData } = await supabase
      .from('vendors')
      .select('*, events(name)')
      .in('event_id', (eventsData || []).map(e => e.id))
      .order('created_at', { ascending: false })

    setEvents(eventsData || [])
    setVendors(vendorsData || [])
    setLoading(false)
  }

  function openCreate() {
    setForm({ ...emptyForm, event_id: events[0]?.id || '' })
    setEditingId(null)
    setMessage('')
    setShowModal(true)
  }

  function openEdit(vendor) {
    setForm({
      event_id: vendor.event_id || '',
      business_name: vendor.business_name || '',
      contact_name: vendor.contact_name || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      booth_number: vendor.booth_number || '',
      payment_amount: vendor.payment_amount || '',
      payment_status: vendor.payment_status || 'unpaid',
      status: vendor.status || 'pending',
    })
    setEditingId(vendor.id)
    setMessage('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.business_name.trim()) {
      setMessage('Business name is required.')
      return
    }
    if (!form.event_id) {
      setMessage('Please select an event.')
      return
    }
    setSaving(true)
    const payload = {
      event_id: form.event_id,
      business_name: form.business_name,
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone,
      booth_number: form.booth_number,
      payment_amount: parseFloat(form.payment_amount) || 0,
      payment_status: form.payment_status,
      status: form.status,
    }
    if (editingId) {
      await supabase.from('vendors').update(payload).eq('id', editingId)
    } else {
      await supabase.from('vendors').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    loadData()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this vendor? This cannot be undone.')) return
    await supabase.from('vendors').delete().eq('id', id)
    loadData()
  }

  async function togglePayment(vendor) {
    const newStatus = vendor.payment_status === 'paid' ? 'unpaid' : 'paid'
    await supabase.from('vendors').update({ payment_status: newStatus }).eq('id', vendor.id)
    loadData()
  }

  const filtered = filterEvent === 'all'
    ? vendors
    : vendors.filter(v => v.event_id === filterEvent)

  const totalRevenue = filtered.reduce((sum, v) => sum + (v.payment_status === 'paid' ? (v.payment_amount || 0) : 0), 0)
  const paidCount = filtered.filter(v => v.payment_status === 'paid').length

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendors</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage vendors and booth assignments.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          + Add Vendor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Total Vendors</p>
          <p className="text-2xl font-bold text-white mt-1">{filtered.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Paid</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{paidCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Revenue Collected</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filter by event */}
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

      {/* Vendors list */}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-16 text-center">
          <p className="text-slate-400 text-sm">No vendors yet. Add your first one!</p>
          <button
            onClick={openCreate}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            + Add Vendor
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-6 gap-4 px-6 py-3 border-b border-slate-800 text-xs text-slate-500 font-medium uppercase tracking-wide">
            <div className="col-span-2">Business</div>
            <div>Event</div>
            <div>Booth</div>
            <div>Payment</div>
            <div>Actions</div>
          </div>

          {/* Table rows */}
          {filtered.map((vendor, i) => (
            <div
              key={vendor.id}
              className={`grid grid-cols-6 gap-4 px-6 py-4 items-center ${i !== filtered.length - 1 ? 'border-b border-slate-800' : ''}`}
            >
              <div className="col-span-2 min-w-0">
                <p className="text-white font-medium text-sm truncate">{vendor.business_name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{vendor.contact_name || 'No contact'}</p>
                {vendor.email && <p className="text-slate-600 text-xs">{vendor.email}</p>}
              </div>

              <div className="min-w-0">
                <p className="text-slate-300 text-xs truncate">{vendor.events?.name || 'Unknown'}</p>
              </div>

              <div>
                <span className="text-slate-300 text-sm">{vendor.booth_number || '--'}</span>
              </div>

              <div>
                <button
                  onClick={() => togglePayment(vendor)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    vendor.payment_status === 'paid'
                      ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900'
                      : 'bg-red-950 text-red-400 hover:bg-red-900'
                  }`}
                >
                  {vendor.payment_status === 'paid' ? `Paid $${vendor.payment_amount}` : `Unpaid $${vendor.payment_amount}`}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(vendor)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(vendor.id)}
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
              {editingId ? 'Edit Vendor' : 'Add Vendor'}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-slate-400 hover:text-white text-xl"
            >
              X
            </button>
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

            <Field label="Business Name *">
              <input
                className={inputClass}
                value={form.business_name}
                onChange={e => setForm({ ...form, business_name: e.target.value })}
                placeholder="e.g. Vintage Cards Co."
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Name">
                <input
                  className={inputClass}
                  value={form.contact_name}
                  onChange={e => setForm({ ...form, contact_name: e.target.value })}
                  placeholder="John Smith"
                />
              </Field>
              <Field label="Booth Number">
                <input
                  className={inputClass}
                  value={form.booth_number}
                  onChange={e => setForm({ ...form, booth_number: e.target.value })}
                  placeholder="e.g. A12"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="vendor@email.com"
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputClass}
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="(416) 555-0123"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Booth Fee ($)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.payment_amount}
                  onChange={e => setForm({ ...form, payment_amount: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Payment Status">
                <select
                  className={inputClass}
                  value={form.payment_status}
                  onChange={e => setForm({ ...form, payment_status: e.target.value })}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </Field>
            </div>

            <Field label="Application Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Vendor'}
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