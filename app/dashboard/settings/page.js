'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const DASHBOARD_THEME_KEY = 'hh-dashboard-theme'

const inputClass = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
const LabelClass = "block text-sm text-slate-400 mb-1"

function Section({ title, description, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-white font-semibold text-base">{title}</h2>
        {description && <p className="text-slate-500 text-sm mt-0.5">{description}</p>}
      </div>
      <div className="border-t border-slate-800 pt-4 space-y-4">
        {children}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [orgName, setOrgName] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [orgWebsite, setOrgWebsite] = useState('')
  const [orgAddress, setOrgAddress] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [plan, setPlan] = useState(null)
  const [theme, setTheme] = useState('dark')
  const [themeMsg, setThemeMsg] = useState('')

  useEffect(() => {
    const savedTheme = localStorage.getItem(DASHBOARD_THEME_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/'; return }
      setUser(data.user)
      const meta = data.user.user_metadata || {}
      setOrgName(meta.org_name || '')
      setOrgPhone(meta.org_phone || '')
      setOrgWebsite(meta.org_website || '')
      setOrgAddress(meta.org_address || '')

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', data.user.id)
        .single()
      if (sub) setPlan(sub)
    })
  }, [])

  async function saveProfile() {
    setSaving(true)
    setMsg('')
    const { error } = await supabase.auth.updateUser({
      data: {
        org_name: orgName,
        org_phone: orgPhone,
        org_website: orgWebsite,
        org_address: orgAddress,
      }
    })
    setSaving(false)
    setMsg(error ? error.message : 'Profile saved!')
    setTimeout(() => setMsg(''), 3000)
  }

  async function changePassword() {
    if (!newPassword || newPassword.length < 6) {
      setPwMsg('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMsg('Passwords do not match.')
      return
    }
    setPwSaving(true)
    setPwMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    setPwMsg(error ? error.message : 'Password updated!')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPwMsg(''), 3000)
  }

  async function handleManageBilling() {
    if (!plan?.stripe_customer_id) {
      window.location.href = '/pricing'
      return
    }
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: plan.stripe_customer_id }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

 async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function handleThemeChange(nextTheme) {
    if (nextTheme !== 'light' && nextTheme !== 'dark') return

    setTheme(nextTheme)
    localStorage.setItem(DASHBOARD_THEME_KEY, nextTheme)
    window.dispatchEvent(new CustomEvent('hh-theme-change', { detail: nextTheme }))
    setThemeMsg(`Theme updated to ${nextTheme} mode.`)
    setTimeout(() => setThemeMsg(''), 2500)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1 text-sm">Manage your account and organizer profile.</p>
      </div>

      {/* Account */}
      <Section title="Account" description="Your login email address.">
        <div>
          <label className={LabelClass}>Email address</label>
          <input className={inputClass} value={user?.email || ''} disabled />
          <p className="text-slate-600 text-xs mt-1">Email cannot be changed here.</p>
        </div>
      </Section>

      {/* Organizer profile */}
      <Section title="Organizer Profile" description="This info appears on invoices and communications.">
        <div>
          <label className={LabelClass}>Organization Name</label>
          <input
            className={inputClass}
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            placeholder="e.g. Great Lakes Collectibles LLC"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LabelClass}>Phone</label>
            <input
              className={inputClass}
              value={orgPhone}
              onChange={e => setOrgPhone(e.target.value)}
              placeholder="(416) 555-0100"
            />
          </div>
          <div>
            <label className={LabelClass}>Website</label>
            <input
              className={inputClass}
              value={orgWebsite}
              onChange={e => setOrgWebsite(e.target.value)}
              placeholder="https://yoursite.com"
            />
          </div>
        </div>
        <div>
          <label className={LabelClass}>Address</label>
          <input
            className={inputClass}
            value={orgAddress}
            onChange={e => setOrgAddress(e.target.value)}
            placeholder="123 Main St, Toronto, Ontario"
          />
        </div>
        {msg && (
          <p className={`text-sm ${msg.includes('saved') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>
        )}
        <button
          onClick={saveProfile}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </Section>

      {/* Subscription */}
      <Section title="Subscription" description="Manage your Hobby Handler plan and billing.">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">
              Current Plan: <span className="text-indigo-400 capitalize">{plan?.plan || 'No active plan'}</span>
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Status: <span className={plan?.status === 'active' ? 'text-emerald-400' : 'text-red-400'}>{plan?.status || 'None'}</span>
            </p>
          </div>
          <div className="flex gap-3">
          {!plan && (
              <button
                onClick={() => { window.location.href = '/pricing' }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                View Plans
              </button>
            )}
            {plan && (
              <button
                onClick={handleManageBilling}
                className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                Manage Billing
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" description="Choose how dashboard pages look for your account.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleThemeChange('dark')}
            className={`rounded-xl border p-4 text-left transition-colors ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-950/60'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <p className="text-white font-semibold text-sm">Dark Mode</p>
            <p className="text-slate-400 text-xs mt-1">Deep navy surfaces with bright accents.</p>
          </button>

          <button
            onClick={() => handleThemeChange('light')}
            className={`rounded-xl border p-4 text-left transition-colors ${
              theme === 'light'
                ? 'border-indigo-500 bg-indigo-950/60'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <p className="text-white font-semibold text-sm">Light Mode</p>
            <p className="text-slate-400 text-xs mt-1">Brighter cards and surfaces for daytime use.</p>
          </button>
        </div>

        {themeMsg && <p className="text-emerald-400 text-sm">{themeMsg}</p>}
      </Section>

      {/* Change password */}
      <Section title="Change Password" description="Update your account password.">
        <div>
          <label className={LabelClass}>New Password</label>
          <input
            type="password"
            className={inputClass}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className={LabelClass}>Confirm New Password</label>
          <input
            type="password"
            className={inputClass}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {pwMsg && (
          <p className={`text-sm ${pwMsg.includes('updated') ? 'text-emerald-400' : 'text-red-400'}`}>{pwMsg}</p>
        )}
        <button
          onClick={changePassword}
          disabled={pwSaving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          {pwSaving ? 'Updating...' : 'Update Password'}
        </button>
      </Section>

      {/* Sign out */}
      <Section title="Account Actions" description="Sign out of your account.">
        <button
          onClick={handleSignOut}
          className="bg-red-950 hover:bg-red-900 border border-red-800 text-red-400 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </Section>
    </div>
  )
}