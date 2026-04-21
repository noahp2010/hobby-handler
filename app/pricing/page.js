'use client'
import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const PLANS = {
  basic: {
    name: 'Basic',
    monthlyPrice: 19,
    annualPrice: 200,
    annualMonthly: (200 / 12).toFixed(0),
    color: '#4b86d4',
    features: [
      '60 vendors max per event',
      'Budgeting and finance tools',
      'Invoice generation',
      'Ticketing with QR codes',
      'Event management',
      'Floor plan builder',
    ],
    notIncluded: [
      'Sponsor management',
      'Giveaway management',
      'Unlimited vendors',
    ],
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 40,
    annualPrice: 450,
    annualMonthly: (450 / 12).toFixed(0),
    color: '#7aa8e6',
    features: [
      'Everything in Basic',
      'Unlimited vendors per event',
      'Sponsor management',
      'Giveaway management with prize draws',
      'Full floor plan builder',
      'Priority support',
    ],
    notIncluded: [],
  },
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleSubscribe(plan) {
    setLoading(plan)

    const priceMap = {
      basic_monthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID,
      basic_annual: process.env.NEXT_PUBLIC_STRIPE_BASIC_ANNUAL_PRICE_ID,
      pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
      pro_annual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID,
    }

    const key = `${plan}_${annual ? 'annual' : 'monthly'}`
    const priceId = priceMap[key]

    if (!priceId) {
      alert('Price ID not configured. Please check your .env.local file.')
      setLoading(null)
      return
    }

    if (!user) {
      window.location.href = '/?redirect=pricing'
      return
    }

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'subscription',
        priceId,
        email: user.email,
        userId: user.id,
      }),
    })

    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert('Error: ' + data.error)
      setLoading(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020b1c', padding: '60px 20px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ marginBottom: 16 }}>
          <a href="/" style={{ color: '#89a3c8', fontSize: 14, textDecoration: 'none' }}>← Back to login</a>
        </div>
        <h1 style={{ color: 'white', fontSize: 40, fontWeight: 800, margin: 0 }}>Simple, transparent pricing</h1>
        <p style={{ color: '#89a3c8', fontSize: 18, marginTop: 12 }}>Built for collectible event organizers. Cancel anytime.</p>

        {/* Toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 28, background: '#0c1f3f', border: '1px solid #1f3a67', borderRadius: 50, padding: '6px 8px' }}>
          <button
            onClick={() => setAnnual(false)}
            style={{ background: !annual ? '#336bbc' : 'transparent', color: !annual ? 'white' : '#89a3c8', border: 'none', borderRadius: 50, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s' }}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            style={{ background: annual ? '#336bbc' : 'transparent', color: annual ? 'white' : '#89a3c8', border: 'none', borderRadius: 50, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s' }}
          >
            Annual
            <span style={{ marginLeft: 6, background: '#123567', color: '#6fb1ff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>Save up to 6%</span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 900, margin: '0 auto' }}>
        {Object.entries(PLANS).map(([key, plan]) => (
          <div
            key={key}
            style={{
              background: '#0c1f3f',
              border: key === 'pro' ? '2px solid #4b86d4' : '1px solid #1f3a67',
              borderRadius: 20,
              padding: 36,
              width: 380,
              position: 'relative',
              flex: '1 1 320px',
            }}
          >
            {key === 'pro' && (
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#336bbc', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 50, whiteSpace: 'nowrap' }}>
                MOST POPULAR
              </div>
            )}

            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>{plan.name}</h2>

            <div style={{ marginBottom: 28 }}>
              <span style={{ color: 'white', fontSize: 48, fontWeight: 800 }}>
                ${annual ? plan.annualMonthly : plan.monthlyPrice}
              </span>
              <span style={{ color: '#89a3c8', fontSize: 16 }}>/mo</span>
              {annual && (
                <p style={{ color: '#6fb1ff', fontSize: 13, margin: '4px 0 0' }}>
                  Billed ${plan.annualPrice} CAD/year
                </p>
              )}
              {!annual && (
                <p style={{ color: '#89a3c8', fontSize: 13, margin: '4px 0 0' }}>
                  Billed monthly in CAD
                </p>
              )}
            </div>

            <button
              onClick={() => handleSubscribe(key)}
              disabled={loading === key}
              style={{
                width: '100%',
                background: key === 'pro' ? '#336bbc' : '#1f3a67',
                color: 'white',
                border: key === 'pro' ? 'none' : '1px solid #335282',
                borderRadius: 10,
                padding: '14px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: 28,
                opacity: loading === key ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading === key ? 'Redirecting...' : `Get started with ${plan.name}`}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Check size={18} color="#6fb1ff" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#dbe7f8', fontSize: 14 }}>{f}</span>
                </div>
              ))}
              {plan.notIncluded.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <X size={18} color="#335282" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#335282', fontSize: 14 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 600, margin: '64px auto 0', textAlign: 'center' }}>
        <h3 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Common questions</h3>
        {[
          { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime from your account settings. You keep access until the end of your billing period.' },
          { q: 'Can I switch plans?', a: 'Absolutely. Upgrade or downgrade at any time. Stripe handles the proration automatically.' },
          { q: 'Is there a free trial?', a: 'We offer a 14-day free trial on all plans. No credit card required to start.' },
          { q: 'What currency is this?', a: 'All prices are in Canadian dollars (CAD).' },
        ].map(item => (
          <div key={item.q} style={{ textAlign: 'left', marginBottom: 20, background: '#0c1f3f', border: '1px solid #1f3a67', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ color: 'white', fontWeight: 600, margin: '0 0 6px', fontSize: 15 }}>{item.q}</p>
            <p style={{ color: '#89a3c8', margin: 0, fontSize: 14 }}>{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}