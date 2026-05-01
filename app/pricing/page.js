'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Logo from '../components/logo'

const PLANS = {
  basic: {
    name: 'Basic',
    monthlyPrice: 19,
    annualPrice: 200,
    description: 'Perfect for small organizers running a couple events per year.',
    color: '#6366f1',
    features: [
      '2 events per year',
      '60 vendors per event',
      'Floor Plan Builder',
      'Budgeting and Finance',
      'Invoice Generation',
      'Vendor Registration Forms',
      'Email Confirmations',
      '14-day free trial',
    ],
    notIncluded: [
      'Ticketing System',
      'Sponsor Management',
      'Giveaway Management',
      'Priority Support',
    ],
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 40,
    annualPrice: 450,
    description: 'For serious organizers running multiple events with ticketing.',
    color: '#8b5cf6',
    features: [
      'Everything in Basic',
      'Unlimited events',
      'Unlimited vendors',
      'Full Ticketing System',
      'Sponsor Management',
      'Giveaway Management',
      'Promo Codes',
      'Priority Support',
      'Custom Domain',
      '14-day free trial',
    ],
    notIncluded: [],
  },
}

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly')
  const [user, setUser] = useState(null)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(null)
  const [required, setRequired] = useState(false)
  const [upgrade, setUpgrade] = useState(false)
  const [trialEndsAt, setTrialEndsAt] = useState(null)
  const [embedUrl, setEmbedUrl] = useState(null)
  const [embedPlan, setEmbedPlan] = useState(null)
  const iframeRef = useRef(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('required')) setRequired(true)
    if (p.get('upgrade')) setUpgrade(true)
    init()
  }, [])

  async function init() {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    if (u) {
      const { data: sub } = await supabase
        .from('subscriptions').select('*').eq('user_id', u.id).single()
      if (sub) {
        setCurrentPlan(sub.plan)
        if (sub.trial_ends_at) setTrialEndsAt(sub.trial_ends_at)
      }
      const { data: granted } = await supabase
        .from('admin_granted_access').select('plan').eq('user_id', u.id).single()
      if (granted) setCurrentPlan(granted.plan)
    }
    setLoading(false)
  }

  async function handleSelectPlan(plan) {
    if (!user) { window.location.href = '/login?redirect=/pricing'; return }
    if (currentPlan === plan) return
    setCheckingOut(plan)

    const priceId = billing === 'monthly'
      ? (plan === 'pro'
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID)
      : (plan === 'pro'
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_BASIC_ANNUAL_PRICE_ID)

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'subscription',
        priceId,
        email: user.email,
        userId: user.id,
        trial: true,
      }),
    })
    const data = await res.json()
    if (data.url) {
      setEmbedUrl(data.url)
      setEmbedPlan(plan)
    } else {
      alert('Error: ' + data.error)
    }
    setCheckingOut(null)
  }

  const S = {
    page: { minHeight: '100vh', background: '#020617', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', color: 'white' },
    nav:  { background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 },
  }

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 44, height: 44, border: '4px solid #1e293b', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // Show embedded Stripe checkout
  if (embedUrl) {
    return (
      <div style={S.page}>
        <nav style={S.nav}>
          <a href="/pricing" onClick={() => setEmbedUrl(null)} style={{ color: '#64748b', textDecoration: 'none', fontSize: 14 }}>← Back to Plans</a>
          <Logo size="xl" showFull />
          <div style={{ width: 80 }} />
        </nav>
        <div style={{ maxWidth: 560, margin: '40px auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>
              Complete Your {PLANS[embedPlan]?.name} Subscription
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              14-day free trial — cancel anytime. Your card will not be charged until the trial ends.
            </p>
          </div>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden', minHeight: 600 }}>
            <iframe
              ref={iframeRef}
              src={embedUrl}
              width="100%"
              height="700"
              frameBorder="0"
              style={{ display: 'block', border: 'none' }}
              title="Stripe Checkout"
            />
          </div>
          <p style={{ color: '#334155', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
            🔒 Secured by Stripe. Your payment info is never stored on our servers.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14 }}>← Home</a>
        <Logo size="xl" showFull />
        <a href="/dashboard" style={{ color: '#6366f1', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Dashboard</a>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px' }}>

        {required && (
          <div style={{ background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: 12, padding: '16px 20px', marginBottom: 32, textAlign: 'center' }}>
            <p style={{ color: '#c7d2fe', fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Subscription Required</p>
            <p style={{ color: '#818cf8', fontSize: 13, margin: 0 }}>Choose a plan to access Hobby Handler. Start with a 14-day free trial — no credit card required until trial ends.</p>
          </div>
        )}

        {upgrade && !required && (
          <div style={{ background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: 12, padding: '16px 20px', marginBottom: 32, textAlign: 'center' }}>
            <p style={{ color: '#c7d2fe', fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Pro Feature</p>
            <p style={{ color: '#818cf8', fontSize: 13, margin: 0 }}>This feature requires the Pro plan. Upgrade to unlock ticketing, sponsors, giveaways, and more.</p>
          </div>
        )}

        {trialEndsAt && (
          <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: 12, padding: '14px 20px', marginBottom: 32, textAlign: 'center' }}>
            <p style={{ color: '#4ade80', fontSize: 14, fontWeight: 600, margin: 0 }}>
              Free trial active — ends {new Date(trialEndsAt).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ color: '#818cf8', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 12px' }}>Pricing</p>
          <h1 style={{ color: 'white', fontSize: 42, fontWeight: 900, margin: '0 0 14px', letterSpacing: -1 }}>Simple, honest pricing</h1>
          <p style={{ color: '#64748b', fontSize: 18, margin: '0 0 32px' }}>14-day free trial on all plans. No credit card required to start.</p>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 4 }}>
            {['monthly', 'annual'].map(b => (
              <button key={b} onClick={() => setBilling(b)}
                style={{ background: billing === b ? '#4f46e5' : 'transparent', border: 'none', color: billing === b ? 'white' : '#64748b', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s' }}
              >
                {b === 'monthly' ? 'Monthly' : 'Annual'}
                {b === 'annual' && <span style={{ marginLeft: 6, background: '#065f46', color: '#34d399', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Save 15%</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 60 }}>
          {Object.entries(PLANS).map(([key, plan]) => {
            const price = billing === 'monthly' ? plan.monthlyPrice : plan.annualPrice
            const isCurrentPlan = currentPlan === key
            const isPro = key === 'pro'

            return (
              <div key={key} style={{ background: isPro ? 'linear-gradient(135deg, #1e1b4b, #1e293b)' : '#0f172a', border: isPro ? '2px solid #6366f1' : '1px solid #1e293b', borderRadius: 20, padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
                {isPro && (
                  <div style={{ position: 'absolute', top: 16, right: 16, background: '#4f46e5', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 50, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Most Popular
                  </div>
                )}

                <div style={{ marginBottom: 24 }}>
                  <p style={{ color: plan.color, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                    <span style={{ color: 'white', fontSize: 48, fontWeight: 900, letterSpacing: -2 }}>${price}</span>
                    <span style={{ color: '#64748b', fontSize: 15 }}>CAD / {billing === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{plan.description}</p>
                </div>

                <button
                  onClick={() => handleSelectPlan(key)}
                  disabled={isCurrentPlan || checkingOut === key}
                  style={{ width: '100%', background: isCurrentPlan ? '#1e293b' : isPro ? '#4f46e5' : '#334155', color: isCurrentPlan ? '#64748b' : 'white', border: isCurrentPlan ? '1px solid #334155' : 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: isCurrentPlan ? 'default' : 'pointer', marginBottom: 28, transition: 'all 0.2s', opacity: checkingOut && checkingOut !== key ? 0.5 : 1 }}
                >
                  {checkingOut === key ? 'Loading...' : isCurrentPlan ? 'Current Plan' : 'Start Free Trial'}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: '#34d399', fontSize: 16, flexShrink: 0 }}>✓</span>
                      <span style={{ color: '#cbd5e1', fontSize: 14 }}>{f}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.4 }}>
                      <span style={{ color: '#64748b', fontSize: 16, flexShrink: 0 }}>✗</span>
                      <span style={{ color: '#64748b', fontSize: 14 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#475569', fontSize: 14 }}>
            All prices in Canadian dollars. Cancel anytime. Questions?{' '}
            <a href="mailto:hello@hobbyhandler.app" style={{ color: '#6366f1' }}>Contact us</a>
          </p>
        </div>
      </div>
    </div>
  )
}