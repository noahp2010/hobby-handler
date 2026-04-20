'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
// Import Lucide icons
import { 
  LayoutDashboard, 
  Calendar, 
  Store, 
  Ticket, 
  Map, 
  Handshake, 
  Gift, 
  Wallet, 
  Settings,
  LogOut, 
  Paperclip
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',  href: '/dashboard',           icon: LayoutDashboard },
  { label: 'Events',     href: '/dashboard/events',    icon: Calendar },
  { label: 'Vendors',    href: '/dashboard/vendors',   icon: Store },
  { label: 'Ticketing',  href: '/dashboard/tickets',   icon: Ticket },
  { label: 'Invoices',   href: '/dashboard/invoices',  icon: Paperclip },
  { label: 'Floor Plan', href: '/dashboard/floorplan', icon: Map },
  { label: 'Sponsors',   href: '/dashboard/sponsors',  icon: Handshake },
  { label: 'Giveaways',  href: '/dashboard/giveaways', icon: Gift },
  { label: 'Budget',     href: '/dashboard/budget',    icon: Wallet },
  { label: 'Settings',   href: '/dashboard/settings',  icon: Settings },
]

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      setUser(data.user)
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#020617' }}>

      {/* Sidebar - always visible */}
      <aside style={{
        width: '256px',
        minWidth: '256px',
        backgroundColor: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#4f46e5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '13px' }}>HH</span>
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: '600', fontSize: '14px', margin: 0 }}>Hobby Handler</p>
            <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Event Platform</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon // Capitalize to use as a component
            
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
                  backgroundColor: active ? '#4f46e5' : 'transparent',
                  color: active ? 'white' : '#94a3b8',
                  fontWeight: active ? '500' : '400',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = '#1e293b'
                    e.currentTarget.style.color = 'white'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#94a3b8'
                  }
                }}
              >
                {/* Render the Lucide Icon component */}
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '16px', borderTop: '1px solid #1e293b' }}>
          <p style={{ 
            color: '#475569', 
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
              color: '#94a3b8',
              fontSize: '14px',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.backgroundColor = '#1e293b' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent' }}
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