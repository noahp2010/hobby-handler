'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import Logo from '../components/logo'
import {
  LayoutDashboard, CalendarDays, Store, Ticket, MapPin,
  Handshake, Gift, Wallet, FileText, Settings, LogOut,
  ChevronLeft, ChevronRight, ScanQrCode, Bell, Menu, X,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',  href: '/dashboard',              icon: LayoutDashboard },
  { label: 'Events',     href: '/dashboard/events',       icon: CalendarDays    },
  { label: 'Vendors',    href: '/dashboard/vendors',      icon: Store           },
  { label: 'Ticketing',  href: '/dashboard/tickets',      icon: Ticket          },
  { label: 'Check-in',  href: '/dashboard/checkin',      icon: ScanQrCode      },
  { label: 'Floor Plan', href: '/dashboard/floorplan',   icon: MapPin          },
  { label: 'Sponsors',   href: '/dashboard/sponsors',    icon: Handshake       },
  { label: 'Giveaways',  href: '/dashboard/giveaways',   icon: Gift            },
  { label: 'Budget',     href: '/dashboard/budget',      icon: Wallet          },
  { label: 'Invoices',   href: '/dashboard/invoices',    icon: FileText        },
  { label: 'Settings',   href: '/dashboard/settings',    icon: Settings        },
]

function TrialBanner({ userId }) {
  const [info, setInfo] = useState(null)
  useEffect(() => {
    if (!userId) return
    supabase.from('subscriptions').select('trial_ends_at, plan').eq('user_id', userId).single()
      .then(({ data }) => {
        if (data?.trial_ends_at && new Date(data.trial_ends_at) > new Date()) {
          const days = Math.ceil((new Date(data.trial_ends_at) - new Date()) / 86400000)
          setInfo({ days, plan: data.plan })
        }
      })
  }, [userId])
  if (!info) return null
  return (
    <div style={{ background: '#1e1b4b', borderBottom: '1px solid #3730a3', padding: '8px 24px', textAlign: 'center', flexShrink: 0 }}>
      <p style={{ color: '#c7d2fe', fontSize: 13, margin: 0 }}>
        Free trial active — <strong>{info.days} days remaining</strong> on your {info.plan} plan.{' '}
        <Link href="/pricing" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>Upgrade now →</Link>
      </p>
    </div>
  )
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) window.location.href = '/dashboard'
    })
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user
      if (!user) { router.push('/login'); return }
      setUser(user)
    })
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebarW = collapsed ? 64 : 220

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Sidebar */}
      <div style={{
        width: sidebarW,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 40,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}>

        {/* Logo area */}
        <div style={{ padding: collapsed ? '16px 12px' : '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', minHeight: 64, flexShrink: 0 }}>
          {!collapsed && <Logo size="xl" showFull />}
          {collapsed && <Logo size="xs" showFull={false} />}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0 }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '10px' : '9px 12px',
                  borderRadius: 10,
                  marginBottom: 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? 'var(--brand)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  title={collapsed ? item.label : ''}
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{item.label}</span>}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {!collapsed && user && (
            <div style={{ padding: '8px 12px', marginBottom: 6 }}>
              <p style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: collapsed ? '10px' : '9px 12px', justifyContent: collapsed ? 'center' : 'flex-start', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', borderRadius: 10, fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            title={collapsed ? 'Sign Out' : ''}
          >
            <LogOut size={18} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: sidebarW, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.2s ease' }}>

        {/* Top bar */}
        <header style={{ height: 58, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>
              {navItems.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.label || 'Dashboard'}
            </h1>
          </div>
        </header>

        <TrialBanner userId={user?.id} />

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}