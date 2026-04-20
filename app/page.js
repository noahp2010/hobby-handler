'use client'
import { useState } from 'react'
import { Calendar, Store, Ticket, Map, Handshake, Gift, Wallet, FileText, Check } from 'lucide-react'

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
    icon: Ticket,
    title: 'Ticketing with QR Codes',
    description: 'Issue tickets instantly with unique QR codes. Scan at the door using any mobile device.',
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
    color: '#4f46e5',
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
      'Ticketing with QR codes',
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

  return (
    <div style={{ background: '#020617', minHeight: '100vh', fontFamily: 'sans-serif', color: 'white' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1e293b' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#4f46e5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 13 }}>HH</span>
            </div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>Hobby Handler</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="#features" style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none', padding: '6px 12px' }}>Features</a>
            <a href="#pricing" style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none', padding: '6px 12px' }}>Pricing</a>
            <a href="/login" style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none', padding: '6px 12px' }}>Sign in</a>
            <a
              href="/login"
              style={{ background: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 600, textDecoration: 'none', padding: '8px 20px', borderRadius: 8 }}
            >
              Get started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 50, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ width: 8, height: 8, background: '#34d399', borderRadius: '50%', display: 'inline-block' }}></span>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Built for collectible event organizers</span>
        </div>

        <h1 style={{ fontSize: 58, fontWeight: 900, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: -1 }}>
          The all-in-one platform
          <br />
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            for collectible events
          </span>
        </h1>

        <p style={{ color: '#94a3b8', fontSize: 20, maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Manage vendors, tickets, floor plans, sponsors, giveaways, and budgets — all from one powerful dashboard.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/login"
            style={{ background: '#4f46e5', color: 'white', fontWeight: 700, fontSize: 16, textDecoration: 'none', padding: '14px 32px', borderRadius: 10 }}
          >
            Start free today
          </a>
          <a
            href="#pricing"
            style={{ background: '#0f172a', color: '#94a3b8', fontWeight: 600, fontSize: 16, textDecoration: 'none', padding: '14px 32px', borderRadius: 10, border: '1px solid #1e293b' }}
          >
            View pricing
          </a>
        </div>

        {/* App preview card */}
        <div style={{ marginTop: 64, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: 24, maxWidth: 860, margin: '64px auto 0' }}>
          <div style={{ background: '#020617', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Total Events', value: '12', color: 'white' },
                { label: 'Total Vendors', value: '148', color: '#818cf8' },
                { label: 'Tickets Sold', value: '1,204', color: '#34d399' },
                { label: 'Total Revenue', value: '$24,800', color: '#fbbf24' },
              ].map(stat => (
                <div key={stat.label} style={{ flex: 1, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '16px' }}>
                  <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 6px' }}>{stat.label}</p>
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
                <div key={item.label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <item.Icon size={22} color="#4f46e5" />
                  <div>
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{item.label}</p>
                    <p style={{ color: '#475569', fontSize: 11, margin: '2px 0 0' }}>{item.sub}</p>
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
          <p style={{ color: '#64748b', fontSize: 18, margin: 0 }}>Eight powerful tools built specifically for collectible event organizers.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {FEATURES.map(feature => {
            const IconComponent = feature.icon
            return (
              <div
                key={feature.title}
                style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24 }}
              >
                <div style={{ marginBottom: 14 }}><IconComponent size={32} color="#4f46e5" /></div>
                <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{feature.title}</h3>
                <p style={{ color: '#64748b', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: '#0f172a', borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>Loved by event organizers</h2>
            <p style={{ color: '#64748b', fontSize: 18, margin: 0 }}>Join hundreds of organizers running better events with Hobby Handler.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map(t => (
              <div
                key={t.name}
                style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 16, padding: 28 }}
              >
                <p style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 1.7, margin: '0 0 24px' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, background: t.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{t.avatar}</span>
                  </div>
                  <div>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>{t.name}</p>
                    <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>Simple, transparent pricing</h2>
          <p style={{ color: '#64748b', fontSize: 18, margin: '0 0 32px' }}>All prices in Canadian dollars. Cancel anytime.</p>

          <div style={{ display: 'inline-flex', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 50, padding: 4 }}>
            <button
              onClick={() => setAnnual(false)}
              style={{ background: !annual ? '#4f46e5' : 'transparent', color: !annual ? 'white' : '#64748b', border: 'none', borderRadius: 50, padding: '8px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{ background: annual ? '#4f46e5' : 'transparent', color: annual ? 'white' : '#64748b', border: 'none', borderRadius: 50, padding: '8px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              Annual
              <span style={{ background: '#065f46', color: '#34d399', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>Save up to 17%</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {PLANS.map(plan => (
            <div
              key={plan.key}
              style={{ background: '#0f172a', border: plan.popular ? '2px solid #6366f1' : '1px solid #1e293b', borderRadius: 20, padding: 36, flex: '1 1 320px', maxWidth: 400, position: 'relative' }}
            >
              {plan.popular && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#4f46e5', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 50, whiteSpace: 'nowrap' }}>
                  MOST POPULAR
                </div>
              )}

              <h3 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>{plan.name}</h3>

              <div style={{ marginBottom: 28 }}>
                <span style={{ color: 'white', fontSize: 44, fontWeight: 800 }}>
                  ${annual ? plan.annualMonthly : plan.monthlyPrice}
                </span>
                <span style={{ color: '#64748b', fontSize: 15 }}>/mo</span>
                <p style={{ color: annual ? '#34d399' : '#64748b', fontSize: 13, margin: '6px 0 0' }}>
                  {annual ? `Billed $${plan.annualPrice} CAD/year` : 'Billed monthly in CAD'}
                </p>
              </div>

              <a
                href="/login"
                style={{ display: 'block', textAlign: 'center', background: plan.popular ? '#4f46e5' : '#1e293b', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none', padding: '14px', borderRadius: 10, marginBottom: 28, border: plan.popular ? 'none' : '1px solid #334155' }}
              >
                Get started with {plan.name}
              </a>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Check size={18} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: '#cbd5e1', fontSize: 14 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ background: '#0f172a', borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>Ready to run your best event yet?</h2>
          <p style={{ color: '#64748b', fontSize: 18, margin: '0 0 36px' }}>
            Join organizers across Canada using Hobby Handler to manage their collectible events.
          </p>
          <a
            href="/login"
            style={{ display: 'inline-block', background: '#4f46e5', color: 'white', fontWeight: 700, fontSize: 17, textDecoration: 'none', padding: '16px 40px', borderRadius: 12 }}
          >
            Get started for free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1e293b', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#4f46e5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 11 }}>HH</span>
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>Hobby Handler</p>
              <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>Built for collectible event organizers</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#features" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>Pricing</a>
            <a href="/pricing" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>Plans</a>
            <a href="/login" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>Sign in</a>
          </div>

          <p style={{ color: '#334155', fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} Hobby Handler. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}