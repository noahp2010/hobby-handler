'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const inputClass = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

function Modal({ children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className={`bg-slate-900 border border-slate-700 rounded-2xl ${wide ? 'w-full max-w-4xl' : 'w-full max-w-2xl'} max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

const FIELD_TYPES = [
  { value: 'text',     label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'email',    label: 'Email' },
  { value: 'number',   label: 'Number' },
  { value: 'select',   label: 'Dropdown' },
  { value: 'radio',    label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkbox' },
]

const STATUS_COLORS = {
  pending:  { bg: 'bg-indigo-950',  text: 'text-indigo-300' },
  approved: { bg: 'bg-emerald-950', text: 'text-emerald-400' },
  rejected: { bg: 'bg-red-950',     text: 'text-red-400'    },
  waitlist: { bg: 'bg-blue-950',    text: 'text-blue-400'   },
}

const PAYMENT_COLORS = {
  paid:     { bg: 'bg-emerald-950', text: 'text-emerald-400' },
  unpaid:   { bg: 'bg-red-950',     text: 'text-red-400'    },
  refunded: { bg: 'bg-slate-800',   text: 'text-slate-400'  },
}

const emptyVendorForm = {
  event_id: '', business_name: '', contact_name: '', email: '',
  phone: '', booth_number: '', payment_amount: '',
  payment_status: 'unpaid', application_status: 'pending', notes: '',
}

const emptyFieldForm = {
  label: '', field_type: 'text', placeholder: '',
  options: '', required: false, sort_order: 0,
}

export default function VendorsPage() {
  const [tab, setTab] = useState('applications')
  const [events, setEvents] = useState([])
  const [applications, setApplications] = useState([])
  const [formFields, setFormFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterEvent, setFilterEvent] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('')
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(null)
  const [vendorForm, setVendorForm] = useState(emptyVendorForm)
  const [fieldForm, setFieldForm] = useState(emptyFieldForm)
  const [editingVendorId, setEditingVendorId] = useState(null)
  const [editingFieldId, setEditingFieldId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [copyMsg, setCopyMsg] = useState('')
  const [emailTemplate, setEmailTemplate] = useState({
    subject: 'Your vendor application has been received!',
    greeting: 'Hi {{business_name}},',
    body: 'Thank you for applying to {{event_name}}. We have received your vendor application and will review it shortly.\n\nWe will be in touch with you soon regarding the status of your application and next steps.',
    closing: 'We look forward to seeing you at the event!',
    signature: 'The Event Team',
    sendOnSubmit: true,
  })
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailPreview, setEmailPreview] = useState(false)
  const [sendTestLoading, setSendTestLoading] = useState(false)
  const [testEmailAddress, setTestEmailAddress] = useState('')
  const [organizerLogo, setOrganizerLogo] = useState(null)
  const [organizerColor, setOrganizerColor] = useState('#4f46e5')
  const [organizerName, setOrganizerName] = useState('')
  const [organizerSenderName, setOrganizerSenderName] = useState('')

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (selectedEvent) loadFormFields(selectedEvent) }, [selectedEvent])
  useEffect(() => {
    if (!selectedEvent) return
    fetch('/api/email/template?eventId=' + selectedEvent)
      .then(r => r.json())
      .then(data => {
        if (data.template) {
          setEmailTemplate({
            subject: data.template.subject,
            greeting: data.template.greeting,
            body: data.template.body,
            closing: data.template.closing,
            signature: data.template.signature,
            sendOnSubmit: data.template.send_on_submit,
          })
        }
      })
  }, [selectedEvent])
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const res = await fetch('/api/organizer/settings?userId=' + data.user.id)
      const result = await res.json()
      if (result.settings) {
        setOrganizerLogo(result.settings.logo_url)
        setOrganizerColor(result.settings.brand_color || '#4f46e5')
        setOrganizerName(result.settings.company_name || '')
        setOrganizerSenderName(result.settings.sender_name || result.settings.company_name || '')
      }
    })
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: eventsData } = await supabase
      .from('events').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
    const eventIds = (eventsData || []).map(e => e.id)
    const { data: appsData } = await supabase
      .from('vendor_applications').select('*, events(name)')
      .in('event_id', eventIds.length > 0 ? eventIds : ['none'])
      .order('created_at', { ascending: false })
    setEvents(eventsData || [])
    setApplications(appsData || [])
    if (eventsData && eventsData.length > 0) {
      setSelectedEvent(eventsData[0].id)
    }
    setLoading(false)
  }

  async function loadFormFields(eventId) {
    const { data } = await supabase
      .from('vendor_form_fields').select('*')
      .eq('event_id', eventId).order('sort_order', { ascending: true })
    setFormFields(data || [])
  }

  async function saveVendor() {
    if (!vendorForm.business_name.trim()) return
    setSaving(true)
    const eventId = vendorForm.event_id || selectedEvent || events[0]?.id
    const payload = {
      event_id: eventId,
      business_name: vendorForm.business_name,
      contact_name: vendorForm.contact_name,
      email: vendorForm.email,
      phone: vendorForm.phone,
      booth_number: vendorForm.booth_number,
      payment_amount: parseFloat(vendorForm.payment_amount) || 0,
      payment_status: vendorForm.payment_status,
      application_status: vendorForm.application_status,
      notes: vendorForm.notes,
      form_responses: {},
    }
    if (editingVendorId) {
      await supabase.from('vendor_applications').update(payload).eq('id', editingVendorId)
    } else {
      await supabase.from('vendor_applications').insert(payload)
    }
    setSaving(false)
    setShowVendorModal(false)
    loadData()
  }

  async function saveField() {
    if (!fieldForm.label.trim() || !selectedEvent) return
    setSaving(true)
    const payload = {
      event_id: selectedEvent,
      label: fieldForm.label,
      field_type: fieldForm.field_type,
      placeholder: fieldForm.placeholder,
      options: ['select', 'radio'].includes(fieldForm.field_type)
        ? fieldForm.options.split('\n').map(o => o.trim()).filter(Boolean)
        : [],
      required: fieldForm.required,
      sort_order: fieldForm.sort_order,
    }
    if (editingFieldId) {
      await supabase.from('vendor_form_fields').update(payload).eq('id', editingFieldId)
    } else {
      await supabase.from('vendor_form_fields').insert(payload)
    }
    setSaving(false)
    setShowFieldModal(false)
    loadFormFields(selectedEvent)
  }

  async function deleteVendor(id) {
    if (!confirm('Delete this vendor application?')) return
    await supabase.from('vendor_applications').delete().eq('id', id)
    loadData()
  }

  async function deleteField(id) {
    if (!confirm('Delete this field?')) return
    await supabase.from('vendor_form_fields').delete().eq('id', id)
    loadFormFields(selectedEvent)
  }

  async function updateStatus(id, status) {
    await supabase.from('vendor_applications').update({ application_status: status }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, application_status: status } : a))
    if (showDetailModal?.id === id) setShowDetailModal(prev => ({ ...prev, application_status: status }))
  }

  async function updatePayment(id, status) {
    await supabase.from('vendor_applications').update({ payment_status: status }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, payment_status: status } : a))
    if (showDetailModal?.id === id) setShowDetailModal(prev => ({ ...prev, payment_status: status }))
  }

  function copyLink(eventId) {
    const url = window.location.origin + '/vendors/' + eventId
    navigator.clipboard.writeText(url)
    setCopyMsg(eventId)
    setTimeout(() => setCopyMsg(''), 2000)
  }

  function copyEmbed(eventId) {
    const url = window.location.origin + '/vendors/' + eventId
    navigator.clipboard.writeText('<iframe src="' + url + '" width="100%" height="900" frameborder="0" style="border:none;border-radius:12px;"></iframe>')
    setCopyMsg(eventId + '_embed')
    setTimeout(() => setCopyMsg(''), 2000)
  }

  const filteredApps = applications
    .filter(a => filterEvent === 'all' || a.event_id === filterEvent)
    .filter(a => filterStatus === 'all' || a.application_status === filterStatus)
    .filter(a =>
      a.business_name.toLowerCase().includes(search.toLowerCase()) ||
      (a.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.contact_name || '').toLowerCase().includes(search.toLowerCase())
    )

  const stats = {
    total: filteredApps.length,
    pending: filteredApps.filter(a => a.application_status === 'pending').length,
    approved: filteredApps.filter(a => a.application_status === 'approved').length,
    revenue: filteredApps.filter(a => a.payment_status === 'paid').reduce((s, a) => s + (a.payment_amount || 0), 0),
  }

  async function saveEmailTemplate() {
    if (!selectedEvent) return
    setEmailSaving(true)
    try {
      const res = await fetch('/api/email/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent,
          subject: emailTemplate.subject,
          greeting: emailTemplate.greeting,
          body: emailTemplate.body,
          closing: emailTemplate.closing,
          signature: emailTemplate.signature,
          sendOnSubmit: emailTemplate.sendOnSubmit,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert('Failed to save template: ' + (data.error || 'Unknown error'))
        return
      }
      setEmailSaved(true)
      setTimeout(() => setEmailSaved(false), 3000)
    } finally {
      setEmailSaving(false)
    }
  }

  async function sendTestEmail() {
    if (!testEmailAddress.trim()) return
    setSendTestLoading(true)
    const event = events.find(e => e.id === selectedEvent)
    try {
      const res = await fetch('/api/email/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmailAddress,
          subject: emailTemplate.subject,
          greeting: emailTemplate.greeting,
          body: emailTemplate.body,
          closing: emailTemplate.closing,
          signature: emailTemplate.signature,
          logoUrl: organizerLogo,
          brandColor: organizerColor,
          companyName: organizerName,
          fromName: organizerSenderName || organizerName || 'Hobby Handler',
          businessName: 'Test Business',
          eventName: event?.name || 'Your Event',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert('Failed to send test email: ' + (data.error || 'Unknown error'))
        return
      }
      alert('Test email sent to ' + testEmailAddress)
    } finally {
      setSendTestLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendors</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage vendor applications, custom form fields, and registrations.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('builder')}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            Form Builder
          </button>
          <button
            onClick={() => { setVendorForm(emptyVendorForm); setEditingVendorId(null); setShowVendorModal(true) }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            + Add Vendor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',    value: stats.total,                    color: 'text-white' },
          { label: 'Pending',  value: stats.pending,                  color: 'text-indigo-300' },
          { label: 'Approved', value: stats.approved,                 color: 'text-emerald-400' },
          { label: 'Revenue',  value: '$' + stats.revenue.toFixed(2), color: 'text-indigo-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {[
          { key: 'applications', label: 'Applications' },
          { key: 'registration', label: 'Registration Links' },
          { key: 'builder',      label: 'Form Builder' },
          { key: 'email',        label: 'Email Templates' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${tab === t.key ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* APPLICATIONS TAB */}
      {tab === 'applications' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <select
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              value={filterEvent}
              onChange={e => setFilterEvent(e.target.value)}
            >
              <option value="all">All Events</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
            <select
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="waitlist">Waitlist</option>
            </select>
            <input
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none w-64"
              placeholder="Search vendors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-slate-400 text-sm">Loading...</p>
          ) : filteredApps.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-16 text-center">
              <p className="text-slate-400 text-sm mb-4">No vendor applications yet.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setTab('registration')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                >
                  Share Registration Link
                </button>
                <button
                  onClick={() => { setVendorForm(emptyVendorForm); setEditingVendorId(null); setShowVendorModal(true) }}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                >
                  Add Manually
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="grid gap-4 px-6 py-3 border-b border-slate-800 text-xs text-slate-500 font-medium uppercase tracking-wide" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr auto' }}>
                <div>Business</div>
                <div>Event</div>
                <div>Status</div>
                <div>Payment</div>
                <div>Booth</div>
                <div>Actions</div>
              </div>
              {filteredApps.map((app, i) => (
                <div
                  key={app.id}
                  className={`grid gap-4 px-6 py-4 items-center ${i !== filteredApps.length - 1 ? 'border-b border-slate-800' : ''}`}
                  style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr auto' }}
                >
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{app.business_name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{app.contact_name || app.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-300 text-xs truncate">{app.events?.name}</p>
                  </div>
                  <div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[app.application_status]?.bg} ${STATUS_COLORS[app.application_status]?.text}`}>
                      {app.application_status}
                    </span>
                  </div>
                  <div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PAYMENT_COLORS[app.payment_status]?.bg} ${PAYMENT_COLORS[app.payment_status]?.text}`}>
                      {app.payment_status === 'paid' ? 'Paid $' + app.payment_amount : app.payment_status}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm">{app.booth_number || '--'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setShowDetailModal(app)} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">View</button>
                    <button
                      onClick={() => {
                        setVendorForm({
                          event_id: app.event_id,
                          business_name: app.business_name,
                          contact_name: app.contact_name || '',
                          email: app.email || '',
                          phone: app.phone || '',
                          booth_number: app.booth_number || '',
                          payment_amount: app.payment_amount || '',
                          payment_status: app.payment_status,
                          application_status: app.application_status,
                          notes: app.notes || '',
                        })
                        setEditingVendorId(app.id)
                        setShowVendorModal(true)
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button onClick={() => deleteVendor(app.id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-950 transition-colors">Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REGISTRATION LINKS TAB */}
      {tab === 'registration' && (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Share these links with vendors so they can apply to your events. You can also embed the form directly on your website.</p>
          {events.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-16 text-center">
              <p className="text-slate-400 text-sm">Create an event first to get a registration link.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(ev => {
                const url = (typeof window !== 'undefined' ? window.location.origin : '') + '/vendors/' + ev.id
                return (
                  <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
                      <div>
                        <p className="text-white font-semibold">{ev.name}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {ev.start_date ? new Date(ev.start_date).toLocaleDateString() : 'No date set'} · {ev.venue_location || 'No location'}
                        </p>
                      </div>
                      <button
                        onClick={() => window.open(url, '_blank')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        Preview Form
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-slate-500 text-xs mb-2 font-semibold uppercase tracking-wide">Registration Link</p>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 bg-slate-950 rounded-lg px-4 py-2.5 font-mono text-xs text-indigo-400 truncate border border-slate-800">
                            {url}
                          </div>
                          <button
                            onClick={() => copyLink(ev.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            {copyMsg === ev.id ? 'Copied!' : 'Copy Link'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-slate-500 text-xs mb-2 font-semibold uppercase tracking-wide">Website Embed Code</p>
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 bg-slate-950 rounded-lg px-4 py-2.5 font-mono text-xs text-indigo-400 border border-slate-800 break-all">
                            {'<iframe src="' + url + '" width="100%" height="900" frameborder="0" style="border:none;border-radius:12px;"></iframe>'}
                          </div>
                          <button
                            onClick={() => copyEmbed(ev.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            {copyMsg === ev.id + '_embed' ? 'Copied!' : 'Copy Embed'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* FORM BUILDER TAB */}
      {tab === 'builder' && (
        <div className="space-y-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <p className="text-slate-400 text-sm mb-1">Building form for:</p>
              <select
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                value={selectedEvent}
                onChange={e => setSelectedEvent(e.target.value)}
              >
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
            <button
              onClick={() => { setFieldForm(emptyFieldForm); setEditingFieldId(null); setShowFieldModal(true) }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Add Field
            </button>
          </div>

          <div className="bg-indigo-950 border border-indigo-800 rounded-xl px-5 py-4">
            <p className="text-indigo-300 text-sm font-medium">These fields appear on your public vendor registration form.</p>
            <p className="text-indigo-400 text-xs mt-1">Business Name, Contact Name, Email, and Phone are always included by default.</p>
          </div>

          {formFields.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-16 text-center">
              <p className="text-slate-400 text-sm mb-4">No custom fields yet. Add fields to collect more info from vendors.</p>
              <button
                onClick={() => { setFieldForm(emptyFieldForm); setEditingFieldId(null); setShowFieldModal(true) }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                + Add First Field
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {formFields.map((field, i) => (
                <div key={field.id} className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 text-sm font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm">{field.label}</p>
                      {field.required && (
                        <span className="text-xs bg-red-950 text-red-400 px-2 py-0.5 rounded-full">Required</span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                      {field.placeholder && ' · "' + field.placeholder + '"'}
                    </p>
                    {field.options?.length > 0 && (
                      <p className="text-slate-600 text-xs mt-0.5">Options: {field.options.join(', ')}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFieldForm({
                          label: field.label,
                          field_type: field.field_type,
                          placeholder: field.placeholder || '',
                          options: (field.options || []).join('\n'),
                          required: field.required,
                          sort_order: field.sort_order,
                        })
                        setEditingFieldId(field.id)
                        setShowFieldModal(true)
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteField(field.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-950 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EMAIL TEMPLATE TAB */}
      {tab === 'email' && (
        <div className="space-y-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <p className="text-slate-400 text-sm mb-1">Template for:</p>
              <select
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                value={selectedEvent}
                onChange={e => setSelectedEvent(e.target.value)}
              >
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 mb-0.5">
              <input
                type="checkbox"
                id="sendOnSubmit"
                checked={emailTemplate.sendOnSubmit}
                onChange={e => setEmailTemplate({ ...emailTemplate, sendOnSubmit: e.target.checked })}
                className="w-4 h-4 accent-indigo-500"
              />
              <label htmlFor="sendOnSubmit" className="text-sm text-slate-400">
                Auto-send when vendor submits form
              </label>
            </div>
          </div>

          <div className="bg-indigo-950 border border-indigo-800 rounded-xl px-5 py-4">
            <p className="text-indigo-300 text-sm font-medium">You can use these placeholders in your email:</p>
            <div className="flex gap-4 mt-2 flex-wrap">
              {['{{business_name}}', '{{event_name}}'].map(p => (
                <code key={p} className="bg-indigo-900 text-indigo-300 text-xs px-2 py-1 rounded font-mono">{p}</code>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email Subject</label>
              <input
                className={inputClass}
                value={emailTemplate.subject}
                onChange={e => setEmailTemplate({ ...emailTemplate, subject: e.target.value })}
                placeholder="Your vendor application has been received!"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Greeting</label>
              <input
                className={inputClass}
                value={emailTemplate.greeting}
                onChange={e => setEmailTemplate({ ...emailTemplate, greeting: e.target.value })}
                placeholder="Hi {{business_name}},"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Email Body</label>
              <textarea
                className={inputClass + ' resize-none h-40'}
                value={emailTemplate.body}
                onChange={e => setEmailTemplate({ ...emailTemplate, body: e.target.value })}
                placeholder="Write your email body here..."
              />
              <p className="text-slate-600 text-xs mt-1">Use line breaks to separate paragraphs.</p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Closing Line</label>
              <input
                className={inputClass}
                value={emailTemplate.closing}
                onChange={e => setEmailTemplate({ ...emailTemplate, closing: e.target.value })}
                placeholder="We look forward to seeing you at the event!"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Signature</label>
              <input
                className={inputClass}
                value={emailTemplate.signature}
                onChange={e => setEmailTemplate({ ...emailTemplate, signature: e.target.value })}
                placeholder="The Event Team"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setEmailPreview(!emailPreview)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <span className="text-white font-medium text-sm">Email Preview</span>
              <span className="text-slate-400 text-sm">{emailPreview ? 'Hide' : 'Show'}</span>
            </button>
            {emailPreview && (
              <div className="border-t border-slate-800 p-6">
                <div className="bg-white rounded-xl overflow-hidden max-w-lg mx-auto">
                  <div style={{ background: organizerColor, padding: '24px 32px', textAlign: 'center' }}>
                    {organizerLogo ? (
                      <img src={organizerLogo} alt="Logo" style={{ maxHeight: 48, maxWidth: 160, width: 'auto', display: 'block', margin: '0 auto 10px' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                        <span style={{ color: 'white', fontWeight: 800, fontSize: 13 }}>{(organizerName || 'HH').substring(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    {organizerName && <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, margin: '0 0 6px', fontWeight: 600 }}>{organizerName}</p>}
                    <p style={{ color: 'white', fontWeight: 800, fontSize: 18, margin: 0 }}>Vendor Application Received</p>
                  </div>
                  <div style={{ padding: '28px 32px', fontFamily: 'sans-serif' }}>
                    <p style={{ color: '#1e293b', fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>
                      {emailTemplate.greeting.replace('{{business_name}}', 'Vintage Cards Co.').replace('{{event_name}}', events.find(e => e.id === selectedEvent)?.name || 'Your Event')}
                    </p>
                    <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.7, margin: '0 0 20px', whiteSpace: 'pre-line' }}>
                      {emailTemplate.body.replace(/{{business_name}}/g, 'Vintage Cards Co.').replace(/{{event_name}}/g, events.find(e => e.id === selectedEvent)?.name || 'Your Event')}
                    </p>
                    <div style={{ background: '#f8fafc', borderLeft: '4px solid #6366f1', borderRadius: 4, padding: '14px 18px', marginBottom: 20 }}>
                      <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>You will receive a follow-up email once your application has been reviewed.</p>
                    </div>
                    <p style={{ color: '#475569', fontSize: 14, margin: '0 0 16px' }}>{emailTemplate.closing}</p>
                    <p style={{ color: '#1e293b', fontSize: 14, fontWeight: 600, margin: 0 }}>{emailTemplate.signature}</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px 32px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>Powered by Hobby Handler</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test email */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-white font-medium text-sm mb-3">Send a Test Email</p>
            <div className="flex gap-3">
              <input
                type="email"
                className={inputClass}
                value={testEmailAddress}
                onChange={e => setTestEmailAddress(e.target.value)}
                placeholder="your@email.com"
              />
              <button
                onClick={sendTestEmail}
                disabled={sendTestLoading || !testEmailAddress}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
              >
                {sendTestLoading ? 'Sending...' : 'Send Test'}
              </button>
            </div>
            <p className="text-slate-600 text-xs mt-2">This sends a preview with sample data so you can see exactly what vendors will receive.</p>
          </div>

          {/* Save */}
          <div className="flex items-center gap-4">
            <button
              onClick={saveEmailTemplate}
              disabled={emailSaving}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              {emailSaving ? 'Saving...' : 'Save Template'}
            </button>
            {emailSaved && (
              <p className="text-emerald-400 text-sm">Template saved!</p>
            )}
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && (
        <Modal wide>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg">{showDetailModal.business_name}</h2>
            <button onClick={() => setShowDetailModal(null)} className="text-slate-400 hover:text-white text-xl">X</button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Contact Info</h3>
                {[
                  { label: 'Business', value: showDetailModal.business_name },
                  { label: 'Contact',  value: showDetailModal.contact_name },
                  { label: 'Email',    value: showDetailModal.email },
                  { label: 'Phone',    value: showDetailModal.phone },
                ].map(row => row.value ? (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-slate-500 text-sm">{row.label}</span>
                    <span className="text-white text-sm font-medium">{row.value}</span>
                  </div>
                ) : null)}
              </div>

              {showDetailModal.form_responses && Object.keys(showDetailModal.form_responses).length > 0 && (
                <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Form Responses</h3>
                  {formFields.map(field => {
                    const val = showDetailModal.form_responses[field.id]
                    if (!val && val !== false) return null
                    return (
                      <div key={field.id}>
                        <p className="text-slate-500 text-xs">{field.label}</p>
                        <p className="text-white text-sm mt-0.5">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val}</p>
                      </div>
                    )
                  })}
                </div>
              )}

              {showDetailModal.notes && (
                <div className="bg-slate-800 rounded-xl p-4">
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Notes</h3>
                  <p className="text-white text-sm">{showDetailModal.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Application Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['pending', 'approved', 'rejected', 'waitlist'].map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(showDetailModal.id, s)}
                      className={`py-2 rounded-lg text-sm font-medium capitalize transition-colors ${showDetailModal.application_status === s ? STATUS_COLORS[s]?.bg + ' ' + STATUS_COLORS[s]?.text : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Payment</h3>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-400 text-sm">Amount</span>
                  <span className="text-white font-bold">${showDetailModal.payment_amount || 0}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['unpaid', 'paid'].map(s => (
                    <button
                      key={s}
                      onClick={() => updatePayment(showDetailModal.id, s)}
                      className={`py-2 rounded-lg text-sm font-medium capitalize transition-colors ${showDetailModal.payment_status === s ? PAYMENT_COLORS[s]?.bg + ' ' + PAYMENT_COLORS[s]?.text : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4">
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Booth Assignment</h3>
                <input
                  className={inputClass}
                  defaultValue={showDetailModal.booth_number || ''}
                  placeholder="e.g. A12"
                  onBlur={async e => {
                    await supabase.from('vendor_applications').update({ booth_number: e.target.value }).eq('id', showDetailModal.id)
                    loadData()
                  }}
                />
              </div>

              <div className="bg-slate-800 rounded-xl p-4">
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Applied</h3>
                <p className="text-white text-sm">
                  {new Date(showDetailModal.created_at).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={() => setShowDetailModal(null)} className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ADD/EDIT VENDOR MODAL */}
      {showVendorModal && (
        <Modal>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg">{editingVendorId ? 'Edit Vendor' : 'Add Vendor Manually'}</h2>
            <button onClick={() => setShowVendorModal(false)} className="text-slate-400 hover:text-white text-xl">X</button>
          </div>
          <div className="space-y-4">
            <Field label="Event" required>
              <select
                className={inputClass}
                value={vendorForm.event_id}
                onChange={e => setVendorForm({ ...vendorForm, event_id: e.target.value })}
              >
                <option value="">Select event...</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </Field>
            <Field label="Business Name" required>
              <input
                className={inputClass}
                value={vendorForm.business_name}
                onChange={e => setVendorForm({ ...vendorForm, business_name: e.target.value })}
                placeholder="e.g. Vintage Cards Co."
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Name">
                <input className={inputClass} value={vendorForm.contact_name} onChange={e => setVendorForm({ ...vendorForm, contact_name: e.target.value })} placeholder="Full name" />
              </Field>
              <Field label="Booth Number">
                <input className={inputClass} value={vendorForm.booth_number} onChange={e => setVendorForm({ ...vendorForm, booth_number: e.target.value })} placeholder="e.g. A12" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email">
                <input type="email" className={inputClass} value={vendorForm.email} onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })} placeholder="vendor@email.com" />
              </Field>
              <Field label="Phone">
                <input className={inputClass} value={vendorForm.phone} onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })} placeholder="(416) 555-0100" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Booth Fee ($)">
                <input type="number" className={inputClass} value={vendorForm.payment_amount} onChange={e => setVendorForm({ ...vendorForm, payment_amount: e.target.value })} placeholder="0.00" />
              </Field>
              <Field label="Payment Status">
                <select className={inputClass} value={vendorForm.payment_status} onChange={e => setVendorForm({ ...vendorForm, payment_status: e.target.value })}>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </Field>
            </div>
            <Field label="Application Status">
              <select className={inputClass} value={vendorForm.application_status} onChange={e => setVendorForm({ ...vendorForm, application_status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="waitlist">Waitlist</option>
              </select>
            </Field>
            <Field label="Internal Notes">
              <textarea
                className={inputClass + ' resize-none h-20'}
                value={vendorForm.notes}
                onChange={e => setVendorForm({ ...vendorForm, notes: e.target.value })}
                placeholder="Private notes about this vendor..."
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                onClick={saveVendor}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 text-sm transition-colors"
              >
                {saving ? 'Saving...' : editingVendorId ? 'Save Changes' : 'Add Vendor'}
              </button>
              <button onClick={() => setShowVendorModal(false)} className="px-5 py-3 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* FIELD BUILDER MODAL */}
      {showFieldModal && (
        <Modal>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg">{editingFieldId ? 'Edit Field' : 'Add Form Field'}</h2>
            <button onClick={() => setShowFieldModal(false)} className="text-slate-400 hover:text-white text-xl">X</button>
          </div>
          <div className="space-y-4">
            <Field label="Field Label" required>
              <input
                className={inputClass}
                value={fieldForm.label}
                onChange={e => setFieldForm({ ...fieldForm, label: e.target.value })}
                placeholder="e.g. What products do you sell?"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Field Type">
                <select
                  className={inputClass}
                  value={fieldForm.field_type}
                  onChange={e => setFieldForm({ ...fieldForm, field_type: e.target.value })}
                >
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Sort Order">
                <input
                  type="number"
                  className={inputClass}
                  value={fieldForm.sort_order}
                  onChange={e => setFieldForm({ ...fieldForm, sort_order: parseInt(e.target.value) || 0 })}
                />
              </Field>
            </div>
            <Field label="Placeholder Text">
              <input
                className={inputClass}
                value={fieldForm.placeholder}
                onChange={e => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                placeholder="e.g. Describe your products..."
              />
            </Field>
            {['select', 'radio'].includes(fieldForm.field_type) && (
              <Field label="Options (one per line)">
                <textarea
                  className={inputClass + ' resize-none h-28'}
                  value={fieldForm.options}
                  onChange={e => setFieldForm({ ...fieldForm, options: e.target.value })}
                  placeholder={'Trading Cards\nAction Figures\nComic Books\nVintage Toys'}
                />
              </Field>
            )}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="required"
                checked={fieldForm.required}
                onChange={e => setFieldForm({ ...fieldForm, required: e.target.checked })}
                className="w-4 h-4 accent-indigo-500"
              />
              <label htmlFor="required" className="text-sm text-slate-400">This field is required</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={saveField}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 text-sm transition-colors"
              >
                {saving ? 'Saving...' : editingFieldId ? 'Save Changes' : 'Add Field'}
              </button>
              <button onClick={() => setShowFieldModal(false)} className="px-5 py-3 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}