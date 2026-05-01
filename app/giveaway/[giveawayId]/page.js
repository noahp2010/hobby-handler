'use client'
import { useState, useEffect, use } from 'react'
import Logo from '../../components/logo'

const ACTION_ICONS = {
  follow_instagram: '📸',
  follow_facebook: '👍',
  follow_tiktok: '🎵',
  follow_twitter: '🐦',
  follow_youtube: '▶️',
  refer_friend: '👥',
  answer_question: '❓',
  visit_website: '🌐',
  custom: '⭐',
}

export default function GiveawayPage({ params }) {
  const { giveawayId } = use(params)
  const [giveaway, setGiveaway] = useState(null)
  const [entryCount, setEntryCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [step, setStep] = useState('enter')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [entry, setEntry] = useState(null)
  const [completedActions, setCompletedActions] = useState([])
  const [totalEntries, setTotalEntries] = useState(1)
  const [timeLeft, setTimeLeft] = useState(null)
  const [referredBy, setReferredBy] = useState('')

  useEffect(() => {
    if (!giveawayId) return
    fetch('/api/giveaway/' + giveawayId)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setGiveaway(data.giveaway)
        setEntryCount(data.entryCount)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })

    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) setReferredBy(ref)
  }, [giveawayId])

  useEffect(() => {
    if (!giveaway?.end_date) return
    const interval = setInterval(() => {
      const diff = new Date(giveaway.end_date) - new Date()
      if (diff <= 0) { setTimeLeft('Ended'); clearInterval(interval); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`)
    }, 1000)
    return () => clearInterval(interval)
  }, [giveaway])

  async function handleEnter() {
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email.'); return }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/giveaway/enter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ giveawayId, name, email, referredBy }),
    })
    const data = await res.json()
    if (data.error === 'already_entered') {
      setEntry(data.entry)
      setCompletedActions(data.entry.completed_actions || [])
      setTotalEntries(data.entry.total_entries)
      setStep('actions')
    } else if (data.error) {
      setError(data.error)
    } else {
      setEntry(data.entry)
      setTotalEntries(data.entry.total_entries)
      setEntryCount(prev => prev + 1)
      setStep('actions')
    }
    setSubmitting(false)
  }

  async function handleAction(action) {
    if (completedActions.includes(action.id) || !entry) return
    if (action.type === 'refer_friend') return
    if (action.url) window.open(action.url, '_blank')
    const res = await fetch('/api/giveaway/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId: entry.id, actionId: action.id, bonusEntries: action.bonus_entries }),
    })
    const data = await res.json()
    if (data.success) {
      setCompletedActions(prev => [...prev, action.id])
      setTotalEntries(data.newTotal)
    }
  }

  const referralLink = typeof window !== 'undefined' && entry
    ? window.location.origin + '/giveaway/' + giveawayId + '?ref=' + entry.referral_code
    : ''

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '4px solid #1e293b', borderTop: '4px solid #6366f1', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b' }}>Loading giveaway...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎁</div>
        <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Giveaway not found</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>This giveaway doesn't exist or has been removed.</p>
      </div>
    </div>
  )

  const actions = giveaway?.entry_actions || []
  const isEnded = giveaway?.end_date && new Date(giveaway.end_date) < new Date()

  return (
    <div style={{ minHeight: '100vh', background: '#020617', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <nav style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Logo size="xl" showFull />
      </nav>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

        {/* Prize card */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', border: '1px solid #3730a3', borderRadius: 20, padding: '32px 28px', marginBottom: 24, textAlign: 'center' }}>
          {giveaway.prize_image_url && (
            <img src={giveaway.prize_image_url} alt={giveaway.prize_name} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, marginBottom: 20 }} />
          )}
          <p style={{ color: '#818cf8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
            {giveaway.events?.name || 'Giveaway'} · {isEnded ? 'Ended' : 'Active'}
          </p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }}>{giveaway.title}</h1>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', borderRadius: 50, padding: '8px 20px', marginBottom: 16 }}>
            <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 16 }}>🏆 {giveaway.prize_name}</span>
            {giveaway.prize_value > 0 && (
              <span style={{ color: '#a5b4fc', fontSize: 14, marginLeft: 8 }}>· ${giveaway.prize_value} value</span>
            )}
          </div>
          {giveaway.description && (
            <p style={{ color: '#a5b4fc', fontSize: 14, lineHeight: 1.7, margin: '0 0 16px' }}>{giveaway.description}</p>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            {giveaway.show_entry_count && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 22, margin: 0 }}>{entryCount.toLocaleString()}</p>
                <p style={{ color: '#818cf8', fontSize: 12, margin: '2px 0 0' }}>Entries</p>
              </div>
            )}
            {timeLeft && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 22, margin: 0, fontFamily: 'monospace' }}>{timeLeft}</p>
                <p style={{ color: '#818cf8', fontSize: 12, margin: '2px 0 0' }}>Remaining</p>
              </div>
            )}
          </div>
        </div>

        {isEnded && giveaway.status !== 'active' ? (
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '32px', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: 16, margin: 0 }}>This giveaway has ended. Thank you for participating!</p>
          </div>
        ) : step === 'enter' ? (
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 28 }}>
            <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>Enter to Win</h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>Fill in your details for a chance to win!</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6, fontWeight: 500 }}>Full Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', color: 'white', borderRadius: 8, padding: '11px 14px', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#1e293b'}
                />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6, fontWeight: 500 }}>Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@email.com"
                  style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', color: 'white', borderRadius: 8, padding: '11px 14px', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#1e293b'}
                />
              </div>

              {error && (
                <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ color: '#fca5a5', fontSize: 13, margin: 0 }}>⚠️ {error}</p>
                </div>
              )}

              <button
                onClick={handleEnter}
                disabled={submitting}
                style={{ width: '100%', background: submitting ? '#312e81' : '#4f46e5', color: 'white', border: 'none', borderRadius: 10, padding: '14px', fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
              >
                {submitting ? 'Entering...' : 'Enter Giveaway'}
              </button>

              <p style={{ color: '#334155', fontSize: 12, textAlign: 'center', margin: 0 }}>
                By entering you agree to receive communications about this giveaway.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Entry confirmed */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #065f46, #047857)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28 }}>✓</div>
              <h2 style={{ color: 'white', fontWeight: 800, fontSize: 20, margin: '0 0 6px' }}>You're entered!</h2>
              <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 16px' }}>
                Hi {entry?.name}! You currently have
              </p>
              <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 12, padding: '12px 28px', marginBottom: 12 }}>
                <p style={{ color: '#818cf8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Your Entries</p>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 32, margin: 0 }}>{totalEntries}</p>
              </div>
              <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>Complete actions below to earn more entries!</p>
            </div>

            {/* Bonus actions */}
            {actions.length > 0 && (
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24 }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: '0 0 16px' }}>
                  Earn Bonus Entries
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {actions.map(action => {
                    const done = completedActions.includes(action.id)
                    const isRefer = action.type === 'refer_friend'
                    return (
                      <div
                        key={action.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: done ? '#052e16' : '#020617',
                          border: done ? '1px solid #166534' : '1px solid #1e293b',
                          borderRadius: 12, padding: '14px 18px',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 22 }}>{ACTION_ICONS[action.type] || '⭐'}</span>
                          <div>
                            <p style={{ color: done ? '#4ade80' : 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>{action.label}</p>
                            <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>+{action.bonus_entries} {action.bonus_entries === 1 ? 'entry' : 'entries'}</p>
                          </div>
                        </div>
                        {done ? (
                          <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>Done ✓</span>
                        ) : isRefer ? (
                          <button
                            onClick={() => navigator.clipboard.writeText(referralLink).then(() => alert('Referral link copied!'))}
                            style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Copy Link
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(action)}
                            style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Go
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Referral link */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>Refer Friends for Bonus Entries</h3>
              <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 14px' }}>
                For every friend who enters using your link, you get {giveaway.referral_bonus_entries || 3} bonus entries!
              </p>
              <div style={{ background: '#020617', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#6366f1', wordBreak: 'break-all', marginBottom: 10 }}>
                {referralLink}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(referralLink).then(() => alert('Copied!'))}
                style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Copy Referral Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}