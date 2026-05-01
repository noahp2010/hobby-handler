'use client'
import { useState, useEffect } from 'react'
import { Calendar, Store, Ticket, Map, Handshake, Gift, Wallet, FileText, Check } from 'lucide-react'
import Logo from './components/logo'

const FEATURES = [
  {
    icon: Calendar,
    title: 'Event Management',
    description: 'Create and manage collectible events from start to finish. Set dates, venues, tags, and publish with one click.',
  },
  {
    icon: Store,
    title: 'Vendor Management',
    description: 'Onboard vendors, assign booth numbers, track payments, and manage applications all in one place.',
  },

  {
    icon: Map,
    title: 'Floor Plan Builder',
    description: 'Design your venue layout with a drag and drop builder. Place booths, tables, stages, and more.',
  },
  {
    icon: Handshake,
    title: 'Sponsor Management',
    description: 'Track Bronze, Silver, Gold, and Platinum sponsors. Monitor deal status and total sponsorship value.',
  },
  {
    icon: Gift,
    title: 'Giveaway Management',
    description: 'Run exciting prize draws with an animated winner picker that randomly selects from your attendees.',
  },
  {
    icon: Wallet,
    title: 'Budgeting and Finances',
    description: 'Track estimated vs actual income and expenses. See your real profit at a glance across all events.',
  },
  {
    icon: FileText,
    title: 'Invoice Generation',
    description: 'Generate professional invoices for vendors in seconds and print or save as PDF instantly.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Comic Con Organizer, Toronto',
    text: 'Hobby Handler completely transformed how I run my shows. Vendor check-in used to take hours — now it takes minutes with the QR scanner.',
    avatar: 'SM',
    color: '#336bbc',
  },
  {
    name: 'James K.',
    role: 'Trading Card Event Host, Vancouver',
    text: 'The floor plan builder is incredible. I designed my entire 200-booth layout in under an hour. My vendors love knowing exactly where they are before the event.',
    avatar: 'JK',
    color: '#059669',
  },
  {
    name: 'Priya D.',
    role: 'Collectibles Expo Organizer, Calgary',
    text: 'Managing sponsors used to be a nightmare of spreadsheets. Now everything is in one place and I can see my budget health at a glance.',
    avatar: 'PD',
    color: '#d97706',
  },
]

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    monthlyPrice: 19,
    annualPrice:205,
    annualMonthly: 17,
    popular: false,
    features: [
      '60 vendors max per event',
      'Budgeting and finance tools',
      'Invoice generation',
      'Event management',
      'Floor plan builder',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    monthlyPrice: 40,
    annualPrice: 405,
    annualMonthly: 34,
    popular: true,
    features: [
      'Everything in Basic',
      'Unlimited vendors per event',
      'Sponsor management',
      'Giveaway management',
      'Priority support',
    ],
  },
]
export default function LandingPage() {
  const [annual, setAnnual] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoSize, setLogoSize] = useState('hero')

  // compute responsive logo size on client
  useEffect(() => {
    function updateSize() {
      const w = window.innerWidth
      if (w >= 1400) setLogoSize('hero')
      else if (w >= 1100) setLogoSize('xl')
      else if (w >= 800) setLogoSize('lg')
      else if (w >= 480) setLogoSize('md')
      else setLogoSize('sm')
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // container sizes to match Logo SIZE_MAP
  const LOGO_BOX = {
    hero: { width: 560, height: 150 },
    xl: { width: 280, height: 72 },
    lg: { width: 244, height: 62 },
    md: { width: 208, height: 54 },
    sm: { width: 164, height: 44 },
    xs: { width: 40, height: 40 },
  }

  const box = LOGO_BOX[logoSize] || LOGO_BOX.hero

  return (
    <div style={{ background: '#020b1c', minHeight: '100vh', fontFamily: 'sans-serif', color: 'white' }}>

      {/* Nav */}
      <nav style={{ background: 'rgba(2,11,28,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1f3a67', paddingTop: 2 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: Math.max(56, box.height - 10) }}>
            <div style={{ width: box.width, height: box.height, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Logo size={logoSize} showFull />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="#features" style={{ color: '#b8cbe4', fontSize: 14, textDecoration: 'none', padding: '6px 12px' }}>Features</a>
            <a href="#pricing" style={{ color: '#b8cbe4', fontSize: 14, textDecoration: 'none', padding: '6px 12px' }}>Pricing</a>
            <a href="/login" style={{ color: '#b8cbe4', fontSize: 14, textDecoration: 'none', padding: '6px 12px' }}>Sign in</a>
            <a
              href="/login"
              style={{ background: '#336bbc', color: 'white', fontSize: 14, fontWeight: 600, textDecoration: 'none', padding: '8px 20px', borderRadius: 8 }}
            >
              Get started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 12px 32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0c1f3f', border: '1px solid #1f3a67', borderRadius: 50, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ width: 8, height: 8, background: '#6fb1ff', borderRadius: '50%', display: 'inline-block' }}></span>
          <span style={{ color: '#b8cbe4', fontSize: 13 }}>Built for collectible event organizers</span>
        </div>

        <h1 style={{ fontSize: 58, fontWeight: 900, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: -1 }}>
          The all-in-one platform
          <br />
          <span style={{ background: 'linear-gradient(135deg, #4b86d4, #7aa8e6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            for collectible events
          </span>
        </h1>

        <p style={{ color: '#b8cbe4', fontSize: 20, maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Manage vendors, tickets, floor plans, sponsors, giveaways, and budgets — all from one powerful dashboard.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/login"
            style={{ background: '#336bbc', color: 'white', fontWeight: 700, fontSize: 16, textDecoration: 'none', padding: '14px 32px', borderRadius: 10 }}
          >
            Start free today
          </a>
          <a
            href="#pricing"
            style={{ background: '#0c1f3f', color: '#b8cbe4', fontWeight: 600, fontSize: 16, textDecoration: 'none', padding: '14px 32px', borderRadius: 10, border: '1px solid #1f3a67' }}
          >
            View pricing
          </a>
        </div>

        {/* App preview card */}
        <div style={{ marginTop: 64, background: '#0c1f3f', border: '1px solid #1f3a67', borderRadius: 20, padding: 24, maxWidth: 860, margin: '64px auto 0' }}>
          <div style={{ background: '#020b1c', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Total Events', value: '12', color: 'white' },
                { label: 'Total Vendors', value: '148', color: '#6da7f0' },
                { label: 'Tickets Sold', value: '1,204', color: '#6fb1ff' },
                { label: 'Total Revenue', value: '$24,800', color: '#9cc6ff' },
              ].map(stat => (
                <div key={stat.label} style={{ flex: 1, background: '#0c1f3f', border: '1px solid #1f3a67', borderRadius: 12, padding: '16px' }}>
                  <p style={{ color: '#89a3c8', fontSize: 12, margin: '0 0 6px' }}>{stat.label}</p>
                  <p style={{ color: stat.color, fontSize: 22, fontWeight: 800, margin: 0 }}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { Icon: Calendar, label: 'Create an Event', sub: 'Set up a new collectible event' },
                { Icon: Store, label: 'Manage Vendors', sub: 'Add booths and track payments' },
                { Icon: Ticket, label: 'Manage Tickets', sub: 'Issue and track attendee tickets' },
              ].map(item => (
                <div key={item.label} style={{ background: '#0c1f3f', border: '1px solid #1f3a67', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <item.Icon size={22} color="#336bbc" />
                  <div>
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{item.label}</p>
                    <p style={{ color: '#5f7fab', fontSize: 11, margin: '2px 0 0' }}>{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>Everything you need to run a great event</h2>
          <p style={{ color: '#89a3c8', fontSize: 18, margin: 0 }}>Eight powerful tools built specifically for collectible event organizers.</p>
        </div>

        {[FEATURES.slice(0, 4), FEATURES.slice(4)].map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 20,
              marginBottom: rowIndex === 0 ? 20 : 0,
            }}
          >
            {row.map(feature => {
              const IconComponent = feature.icon
              return (
                <div
                  key={feature.title}
                  style={{ width: 240, maxWidth: '100%', background: '#0c1f3f', border: '1px solid #1f3a67', borderRadius: 16, padding: 24 }}
                >
                  <div style={{ marginBottom: 14 }}><IconComponent size={32} color="#336bbc" /></div>
                  <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{feature.title}</h3>
                  <p style={{ color: '#89a3c8', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{feature.description}</p>
                </div>
              )
            })}
          </div>
        ))}
      </section>

      {/* Testimonials */}
      <section style={{ background: '#0c1f3f', borderTop: '1px solid #1f3a67', borderBottom: '1px solid #1f3a67' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>Loved by event organizers</h2>
            <p style={{ color: '#89a3c8', fontSize: 18, margin: 0 }}>Join hundreds of organizers running better events with Hobby Handler.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map(t => (
              <div
                key={t.name}
                style={{ background: '#020b1c', border: '1px solid #1f3a67', borderRadius: 16, padding: 28 }}
              >
                <p style={{ color: '#dbe7f8', fontSize: 15, lineHeight: 1.7, margin: '0 0 24px' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, background: t.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{t.avatar}</span>
                  </div>
                  <div>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>{t.name}</p>
                    <p style={{ color: '#89a3c8', fontSize: 12, margin: '2px 0 0' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ color: '#818cf8', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 12px' }}>Pricing</p>
            <h1 style={{ color: 'white', fontSize: 42, fontWeight: 900, margin: '0 0 14px', letterSpacing: -1 }}>Simple, honest pricing</h1>
            <p style={{ color: '#64748b', fontSize: 18, margin: '0 0 32px' }}>14-day free trial on all plans. No credit card required to start.</p>
          <div style={{ display: 'inline-flex', background: '#0c1f3f', border: '1px solid #1f3a67', borderRadius: 50, padding: 4 }}>
            <button
              onClick={() => setAnnual(false)}
              style={{ background: !annual ? '#336bbc' : 'transparent', color: !annual ? 'white' : '#89a3c8', border: 'none', borderRadius: 50, padding: '8px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{ background: annual ? '#336bbc' : 'transparent', color: annual ? 'white' : '#89a3c8', border: 'none', borderRadius: 50, padding: '8px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              Annual
              <span style={{ background: '#123567', color: '#6fb1ff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>Save up to 17%</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {PLANS.map(plan => (
            <div
              key={plan.key}
              style={{ background: '#0c1f3f', border: plan.popular ? '2px solid #4b86d4' : '1px solid #1f3a67', borderRadius: 20, padding: 36, flex: '1 1 320px', maxWidth: 400, position: 'relative' }}
            >
              {plan.popular && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#336bbc', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 50, whiteSpace: 'nowrap' }}>
                  MOST POPULAR
                </div>
              )}

              <h3 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>{plan.name}</h3>

              <div style={{ marginBottom: 28 }}>
                <span style={{ color: 'white', fontSize: 44, fontWeight: 800 }}>
                  ${annual ? plan.annualMonthly : plan.monthlyPrice}
                </span>
                <span style={{ color: '#89a3c8', fontSize: 15 }}>/mo</span>
                <p style={{ color: annual ? '#6fb1ff' : '#89a3c8', fontSize: 13, margin: '6px 0 0' }}>
                  {annual ? `Billed $${plan.annualPrice} CAD/year` : 'Billed monthly in CAD'}
                </p>
              </div>

              <a
                href="/login"
                style={{ display: 'block', textAlign: 'center', background: plan.popular ? '#336bbc' : '#1f3a67', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none', padding: '14px', borderRadius: 10, marginBottom: 28, border: plan.popular ? 'none' : '1px solid #335282' }}
              >
                Get started with {plan.name}
              </a>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Check size={18} color="#6fb1ff" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: '#dbe7f8', fontSize: 14 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ background: '#0c1f3f', borderTop: '1px solid #1f3a67', borderBottom: '1px solid #1f3a67' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>Ready to run your best event yet?</h2>
          <p style={{ color: '#89a3c8', fontSize: 18, margin: '0 0 36px' }}>
            Join organizers across Canada using Hobby Handler to manage their collectible events.
          </p>
          <a
            href="/login"
            style={{ display: 'inline-block', background: '#336bbc', color: 'white', fontWeight: 700, fontSize: 17, textDecoration: 'none', padding: '16px 40px', borderRadius: 12 }}
          >
            Get started for free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1f3a67', padding: '24px 16px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
           <div style={{ marginBottom: 0, width: box.width, height: box.height, display: 'flex', alignItems: 'center' }}>
            <Logo size={logoSize} showFull />
           </div>

          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#features" style={{ color: '#89a3c8', fontSize: 14, textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ color: '#89a3c8', fontSize: 14, textDecoration: 'none' }}>Pricing</a>
            <a href="/pricing" style={{ color: '#89a3c8', fontSize: 14, textDecoration: 'none' }}>Plans</a>
            <a href="/terms" style={{ color: '#89a3c8', fontSize: 14, textDecoration: 'none' }}>Terms</a>
            <a href="/privacy" style={{ color: '#89a3c8', fontSize: 14, textDecoration: 'none' }}>Privacy</a>
            <a href="/login" style={{ color: '#89a3c8', fontSize: 14, textDecoration: 'none' }}>Sign in</a>
          </div>

          <p style={{ color: '#335282', fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} Hobby Handler. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}