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
  category: '',
  description: '',
  estimated_amount: '',
  actual_amount: '',
  type: 'expense',
}

const categories = [
  'Venue', 'Marketing', 'Staffing', 'Equipment', 'Printing',
  'Security', 'Catering', 'Decorations', 'Technology', 'Other'
]

export default function BudgetPage() {
  const [items, setItems] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [filterEvent, setFilterEvent] = useState('all')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: itemsData } = await supabase
      .from('budget_items')
      .select('*, events(name)')
      .in('event_id', (eventsData || []).map(e => e.id))
      .order('created_at', { ascending: false })

    setEvents(eventsData || [])
    setItems(itemsData || [])
    setLoading(false)
  }

  function openCreate() {
    setForm({ ...emptyForm, event_id: events[0]?.id || '' })
    setEditingId(null)
    setMessage('')
    setShowModal(true)
  }

  function openEdit(item) {
    setForm({
      event_id: item.event_id || '',
      category: item.category || '',
      description: item.description || '',
      estimated_amount: item.estimated_amount || '',
      actual_amount: item.actual_amount || '',
      type: item.type || 'expense',
    })
    setEditingId(item.id)
    setMessage('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.category.trim()) {
      setMessage('Category is required.')
      return
    }
    if (!form.event_id) {
      setMessage('Please select an event.')
      return
    }
    setSaving(true)
    const payload = {
      event_id: form.event_id,
      category: form.category,
      description: form.description,
      estimated_amount: parseFloat(form.estimated_amount) || 0,
      actual_amount: parseFloat(form.actual_amount) || 0,
      type: form.type,
    }
    if (editingId) {
      await supabase.from('budget_items').update(payload).eq('id', editingId)
    } else {
      await supabase.from('budget_items').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    loadData()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this budget item? This cannot be undone.')) return
    await supabase.from('budget_items').delete().eq('id', id)
    loadData()
  }

  const filtered = items
    .filter(i => filterEvent === 'all' || i.event_id === filterEvent)
    .filter(i => filterType === 'all' || i.type === filterType)

  const totalEstimatedExpenses = filtered
    .filter(i => i.type === 'expense')
    .reduce((sum, i) => sum + (i.estimated_amount || 0), 0)

  const totalActualExpenses = filtered
    .filter(i => i.type === 'expense')
    .reduce((sum, i) => sum + (i.actual_amount || 0), 0)

  const totalEstimatedIncome = filtered
    .filter(i => i.type === 'income')
    .reduce((sum, i) => sum + (i.estimated_amount || 0), 0)

  const totalActualIncome = filtered
    .filter(i => i.type === 'income')
    .reduce((sum, i) => sum + (i.actual_amount || 0), 0)

  const estimatedProfit = totalEstimatedIncome - totalEstimatedExpenses
  const actualProfit = totalActualIncome - totalActualExpenses

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Budget</h1>
          <p className="text-slate-400 mt-1 text-sm">Track estimated vs actual income and expenses.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          + Add Item
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Estimated Income</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">${totalEstimatedIncome.toFixed(2)}</p>
          <p className="text-slate-500 text-xs mt-1">Actual: ${totalActualIncome.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Estimated Expenses</p>
          <p className="text-2xl font-bold text-red-400 mt-1">${totalEstimatedExpenses.toFixed(2)}</p>
          <p className="text-slate-500 text-xs mt-1">Actual: ${totalActualExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Estimated Profit</p>
          <p className={`text-2xl font-bold mt-1 ${estimatedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${estimatedProfit.toFixed(2)}
          </p>
          <p className="text-slate-500 text-xs mt-1">Projected net</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Actual Profit</p>
          <p className={`text-2xl font-bold mt-1 ${actualProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${actualProfit.toFixed(2)}
          </p>
          <p className="text-slate-500 text-xs mt-1">Real net so far</p>
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
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          {['all', 'income', 'expense'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${
                filterType === type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Budget items */}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-16 text-center">
          <p className="text-slate-400 text-sm">No budget items yet. Add your first one!</p>
          <button
            onClick={openCreate}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            + Add Item
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7 gap-4 px-6 py-3 border-b border-slate-800 text-xs text-slate-500 font-medium uppercase tracking-wide">
            <div className="col-span-2">Item</div>
            <div>Event</div>
            <div>Type</div>
            <div>Estimated</div>
            <div>Actual</div>
            <div>Actions</div>
          </div>

          {filtered.map((item, i) => {
            const variance = (item.actual_amount || 0) - (item.estimated_amount || 0)
            const overBudget = item.type === 'expense' && variance > 0
            const underBudget = item.type === 'expense' && variance < 0

            return (
              <div
                key={item.id}
                className={`grid grid-cols-7 gap-4 px-6 py-4 items-center ${i !== filtered.length - 1 ? 'border-b border-slate-800' : ''}`}
              >
                <div className="col-span-2 min-w-0">
                  <p className="text-white font-medium text-sm">{item.category}</p>
                  <p className="text-slate-500 text-xs mt-0.5 truncate">{item.description || 'No description'}</p>
                </div>

                <div>
                  <p className="text-slate-300 text-xs truncate">{item.events?.name || 'Unknown'}</p>
                </div>

                <div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    item.type === 'income'
                      ? 'bg-emerald-950 text-emerald-400'
                      : 'bg-red-950 text-red-400'
                  }`}>
                    {item.type}
                  </span>
                </div>

                <div>
                  <p className="text-white text-sm">${(item.estimated_amount || 0).toFixed(2)}</p>
                </div>

                <div>
                  <p className="text-white text-sm">${(item.actual_amount || 0).toFixed(2)}</p>
                  {variance !== 0 && (
                    <p className={`text-xs mt-0.5 ${overBudget ? 'text-red-400' : underBudget ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {overBudget ? '+' : ''}{variance.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(item)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-950 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg">
              {editingId ? 'Edit Budget Item' : 'Add Budget Item'}
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

            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <select
                  className={inputClass}
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </Field>
              <Field label="Category *">
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select a category...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Description">
              <input
                className={inputClass}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Venue rental deposit"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Estimated Amount ($)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.estimated_amount}
                  onChange={e => setForm({ ...form, estimated_amount: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Actual Amount ($)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.actual_amount}
                  onChange={e => setForm({ ...form, actual_amount: e.target.value })}
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
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Item'}
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