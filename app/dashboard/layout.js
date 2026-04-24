'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { 
  LayoutDashboard, 
  Calendar, 
  CheckCircle2,
  FileText,
  Gift,
  Handshake,
  LogOut,
  Map,
  Settings,
  Store, 
  Ticket, 
  Wallet, 
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',  href: '/dashboard',           icon: LayoutDashboard },
  { label: 'Events',     href: '/dashboard/events',    icon: Calendar },
  { label: 'Vendors',    href: '/dashboard/vendors',   icon: Store },
  { label: 'Floor Plan', href: '/dashboard/floorplan', icon: Map },
  { label: 'Sponsors',   href: '/dashboard/sponsors',  icon: Handshake },
  { label: 'Giveaways',  href: '/dashboard/giveaways', icon: Gift },
  { label: 'Budget',     href: '/dashboard/budget',    icon: Wallet },
  { label: 'Invoices',   href: '/dashboard/invoices',  icon: FileText },
  { label: 'Settings',   href: '/dashboard/settings',  icon: Settings },
]

const DASHBOARD_THEME_KEY = 'hh-dashboard-theme'

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      setUser(data.user)
    })
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem(DASHBOARD_THEME_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme)
    }

    const onThemeChange = (event) => {
      const nextTheme = event?.detail
      if (nextTheme === 'light' || nextTheme === 'dark') {
        setTheme(nextTheme)
      }
    }

    window.addEventListener('hh-theme-change', onThemeChange)
    return () => window.removeEventListener('hh-theme-change', onThemeChange)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div
      className={`dashboard-theme-${theme}`}
      style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-slate-950)' }}
    >

      {/* Sidebar - always visible */}
      <aside style={{
        width: '256px',
        minWidth: '256px',
        backgroundColor: 'var(--color-slate-900)',
        borderRight: '1px solid var(--color-slate-800)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}>

        {/* Logo */}
        <div style={{ padding: '32px 24px', borderBottom: '1px solid var(--color-slate-800)' }}>
          <div style={{ marginBottom: 0 }}>
            <img src="/logo.svg" alt="Hobby Handler" style={{ height: 140, maxWidth: '100%', width: 'auto' }} />
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  textDecoration: 'none',
                  marginBottom: '2px',
                  backgroundColor: active ? 'var(--color-indigo-600)' : 'transparent',
                  color: active ? 'white' : 'var(--color-slate-400)',
                  fontWeight: active ? '500' : '400',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'var(--color-slate-800)'
                    e.currentTarget.style.color = 'white'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--color-slate-400)'
                  }
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--color-slate-800)' }}>
          <p style={{ 
            color: 'var(--color-slate-600)', 
            fontSize: '11px', 
            marginBottom: '8px', 
            paddingLeft: '12px',
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {user?.email}
          </p>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-slate-400)',
              fontSize: '14px',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.backgroundColor = 'var(--color-slate-800)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-slate-400)'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}