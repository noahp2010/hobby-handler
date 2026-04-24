'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

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

function StripeConnectSection({ userId, email }) {
  const [status, setStatus] = useState('loading')
  const [connectId, setConnectId] = useState(null)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('subscriptions')
      .select('stripe_connect_id, stripe_connect_enabled')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (data?.stripe_connect_id) {
          setConnectId(data.stripe_connect_id)
          setStatus(data.stripe_connect_enabled ? 'connected' : 'pending')
        } else {
          setStatus('none')
        }
      })
  }, [userId])

  async function handleConnect() {
    setConnecting(true)
    const res = await fetch('/api/stripe/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, action: 'create' }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { alert('Error: ' + data.error); setConnecting(false) }
  }

  async function handleResume() {
    setConnecting(true)
    const res = await fetch('/api/stripe/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, action: 'link', connectId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { alert('Error: ' + data.error); setConnecting(false) }
  }

  if (status === 'loading') return <p className="text-slate-500 text-sm">Checking connection...</p>

  if (status === 'connected') return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block"></span>
      <p className="text-emerald-400 font-medium text-sm">Stripe account connected — payments go directly to your bank.</p>
    </div>
  )

  if (status === 'pending') return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 bg-amber-400 rounded-full inline-block"></span>
        <p className="text-amber-400 font-medium text-sm">Setup incomplete</p>
      </div>
      <button onClick={handleResume} disabled={connecting} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
        {connecting ? 'Loading...' : 'Finish Setup'}
      </button>
    </div>
  )

  return (
    <div>
      <p className="text-slate-400 text-sm mb-4">Connect your Stripe account so ticket payments go directly to your bank.</p>
      <button onClick={handleConnect} disabled={connecting} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
        {connecting ? 'Loading...' : 'Connect Stripe Account'}
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [orgName, setOrgName] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [orgWebsite, setOrgWebsite] = useState('')
  const [orgAddress, setOrgAddress] = useState('')
  const [senderName, setSenderName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [plan, setPlan] = useState(null)

  const [logoUrl, setLogoUrl] = useState(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoMsg, setLogoMsg] = useState('')
  const [brandColor, setBrandColor] = useState('#4f46e5')
  const [footerText, setFooterText] = useState('Thank you for being part of our event!')
  const [brandSaving, setBrandSaving] = useState(false)
  const [brandMsg, setBrandMsg] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      const meta = data.user.user_metadata || {}
      setOrgName(meta.org_name || '')
      setOrgPhone(meta.org_phone || '')
      setOrgWebsite(meta.org_website || '')
      setOrgAddress(meta.org_address || '')

      const { data: sub } = await supabase
        .from('subscriptions').select('*').eq('user_id', data.user.id).single()
      if (sub) setPlan(sub)

      const res = await fetch('/api/organizer/settings?userId=' + data.user.id)
      const result = await res.json()
      if (result.settings) {
        setLogoUrl(result.settings.logo_url)
        setBrandColor(result.settings.brand_color || '#4f46e5')
        setFooterText(result.settings.email_footer_text || 'Thank you for being part of our event!')
        setSenderName(result.settings.sender_name || meta.org_name || '')
      }

      const params = new URLSearchParams(window.location.search)
      if (params.get('connect') === 'success') {
        window.history.replaceState({}, '', '/dashboard/settings')
      }
    })
  }, [])

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      setLogoMsg('Please upload a PNG, JPG, SVG or WebP file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoMsg('File must be under 2MB.')
      return
    }
    setLogoUploading(true)
    setLogoMsg('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', user.id)
    const res = await fetch('/api/upload/logo', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) {
      setLogoUrl(data.url)
      setLogoMsg('Logo uploaded successfully!')
    } else {
      setLogoMsg('Upload failed: ' + (data.error || 'Unknown error'))
    }
    setLogoUploading(false)
    setTimeout(() => setLogoMsg(''), 4000)
  }

  async function removeLogo() {
    if (!user) return
    setLogoMsg('')
    const res = await fetch('/api/organizer/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, logoUrl: null }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      setLogoMsg('Failed to remove logo: ' + (data.error || 'Unknown error'))
      return
    }
    setLogoUrl(null)
    setLogoMsg('Logo removed.')
    setTimeout(() => setLogoMsg(''), 3000)
  }

  async function saveBranding() {
    if (!user) return
    setBrandSaving(true)
    setBrandMsg('')
    const res = await fetch('/api/organizer/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        brandColor,
        companyName: orgName,
        senderName,
        website: orgWebsite,
        phone: orgPhone,
        address: orgAddress,
        emailFooterText: footerText,
      }),
    })
    const data = await res.json()
    setBrandSaving(false)
    if (!res.ok || !data.success) {
      setBrandMsg('Failed to save branding: ' + (data.error || 'Unknown error'))
      return
    }
    setBrandMsg('Branding saved!')
    setTimeout(() => setBrandMsg(''), 3000)
  }

  async function saveProfile() {
    setSaving(true)
    setMsg('')
    const { error } = await supabase.auth.updateUser({
      data: { org_name: orgName, org_phone: orgPhone, org_website: orgWebsite, org_address: orgAddress }
    })
    setSaving(false)
    setMsg(error ? error.message : 'Profile saved!')
    setTimeout(() => setMsg(''), 3000)
  }

  async function changePassword() {
    if (!newPassword || newPassword.length < 6) { setPwMsg('Password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword) { setPwMsg('Passwords do not match.'); return }
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
    if (!plan?.stripe_customer_id) { window.location.href = '/pricing'; return }
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1 text-sm">Manage your account, branding, and organizer profile.</p>
      </div>

      {/* LOGO AND BRANDING */}
      <Section title="Logo and Branding" description="Your logo and brand color appear on vendor registration forms, emails, and invoices.">

        {/* Logo upload */}
        <div>
          <label className={LabelClass}>Your Logo</label>
          <div className="flex items-center gap-5 flex-wrap">
            <div className="w-28 h-20 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
              ) : (
                <p className="text-slate-600 text-xs text-center px-2">No logo yet</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoUploading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  {logoUploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                </button>
                {logoUrl && (
                  <button
                    onClick={removeLogo}
                    className="bg-slate-800 hover:bg-red-950 text-red-400 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-slate-600 text-xs">PNG, JPG, SVG or WebP. Max 2MB. Recommended: 400x200px</p>
              {logoMsg && (
                <p className={`text-xs ${logoMsg.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>{logoMsg}</p>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>

        {/* Brand color */}
        <div>
          <label className={LabelClass}>Brand Color</label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={brandColor}
              onChange={e => setBrandColor(e.target.value)}
              className="w-14 h-10 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer p-1"
            />
            <input
              className={inputClass + ' max-w-40'}
              value={brandColor}
              onChange={e => setBrandColor(e.target.value)}
              placeholder="#4f46e5"
            />
            <div
              className="flex-1 h-10 rounded-lg border border-slate-700"
              style={{ background: brandColor }}
            />
          </div>
          <p className="text-slate-600 text-xs mt-1">Used as the header color in emails and forms.</p>
        </div>

        <div>
          <label className={LabelClass}>Sender Name</label>
          <input
            className={inputClass}
            value={senderName}
            onChange={e => setSenderName(e.target.value)}
            placeholder="True North Card Expo"
          />
          <p className="text-slate-600 text-xs mt-1">Use your brand name, event name, or any display name you want recipients to see in the From field.</p>
        </div>

        {/* Email footer */}
        <div>
          <label className={LabelClass}>Email Footer Message</label>
          <input
            className={inputClass}
            value={footerText}
            onChange={e => setFooterText(e.target.value)}
            placeholder="Thank you for being part of our event!"
          />
        </div>

        {/* Preview */}
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide px-4 py-3 border-b border-slate-700">Email Preview</p>
          <div className="p-4">
            <div style={{ maxWidth: 400, margin: '0 auto', background: 'white', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ background: brandColor, padding: '20px 24px', textAlign: 'center' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ maxHeight: 48, maxWidth: 160, width: 'auto', display: 'block', margin: '0 auto 8px' }} />
                ) : (
                  <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>{(orgName || 'HH').substring(0, 2).toUpperCase()}</span>
                  </div>
                )}
                {orgName && <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, margin: '0 0 6px', fontWeight: 600 }}>{orgName}</p>}
                <p style={{ color: 'white', fontWeight: 800, fontSize: 16, margin: 0 }}>Vendor Application Received</p>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6, margin: '0 0 12px' }}>Hi Vintage Cards Co.,</p>
                <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6, margin: '0 0 12px' }}>Thank you for your vendor application. We will be in touch shortly.</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 24px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
                <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>{footerText}</p>
              </div>
            </div>
          </div>
        </div>

        {brandMsg && <p className={`text-sm ${brandMsg.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>{brandMsg}</p>}
        <button
          onClick={saveBranding}
          disabled={brandSaving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          {brandSaving ? 'Saving...' : 'Save Branding'}
        </button>
      </Section>

      {/* PROFILE */}
      <Section title="Organizer Profile" description="This info appears on invoices and vendor communications.">
        <div>
          <label className={LabelClass}>Organization Name</label>
          <input className={inputClass} value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Great Lakes Collectibles LLC" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LabelClass}>Phone</label>
            <input className={inputClass} value={orgPhone} onChange={e => setOrgPhone(e.target.value)} placeholder="(416) 555-0100" />
          </div>
          <div>
            <label className={LabelClass}>Website</label>
            <input className={inputClass} value={orgWebsite} onChange={e => setOrgWebsite(e.target.value)} placeholder="https://yoursite.com" />
          </div>
        </div>
        <div>
          <label className={LabelClass}>Address</label>
          <input className={inputClass} value={orgAddress} onChange={e => setOrgAddress(e.target.value)} placeholder="123 Main St, Toronto, Ontario" />
        </div>
        {msg && <p className={`text-sm ${msg.includes('saved') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>}
        <button onClick={saveProfile} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </Section>

      {/* ACCOUNT */}
      <Section title="Account" description="Your login email address.">
        <div>
          <label className={LabelClass}>Email address</label>
          <input className={inputClass} value={user?.email || ''} disabled />
          <p className="text-slate-600 text-xs mt-1">Email cannot be changed here.</p>
        </div>
      </Section>

      {/* SUBSCRIPTION */}
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
              <button onClick={() => window.location.href = '/pricing'} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                View Plans
              </button>
            )}
            {plan && (
              <button onClick={handleManageBilling} className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                Manage Billing
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* STRIPE CONNECT */}
      <Section title="Stripe Payouts" description="Connect your Stripe account to receive payments directly.">
        <StripeConnectSection userId={user?.id} email={user?.email} />
      </Section>

      {/* PASSWORD */}
      <Section title="Change Password" description="Update your account password.">
        <div>
          <label className={LabelClass}>New Password</label>
          <input type="password" className={inputClass} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div>
          <label className={LabelClass}>Confirm New Password</label>
          <input type="password" className={inputClass} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {pwMsg && <p className={`text-sm ${pwMsg.includes('updated') ? 'text-emerald-400' : 'text-red-400'}`}>{pwMsg}</p>}
        <button onClick={changePassword} disabled={pwSaving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
          {pwSaving ? 'Updating...' : 'Update Password'}
        </button>
      </Section>

      {/* SIGN OUT */}
      <Section title="Account Actions" description="Sign out of your account.">
        <button onClick={handleSignOut} className="bg-red-950 hover:bg-red-900 border border-red-800 text-red-400 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
          Sign Out
        </button>
      </Section>
    </div>
  )
}