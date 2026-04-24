'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { Calendar, Store, Ticket, Map, Handshake, Gift } from 'lucide-react'

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color || 'text-white'}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function QuickLink({ href, Icon, label, description }) {
  return (
    <Link href={href} className="bg-slate-900 border border-slate-800 hover:border-indigo-600 rounded-2xl p-5 flex items-start gap-4 transition-colors group">
      <span className="text-indigo-400 mt-0.5"><Icon size={22} /></span>
      <div>
        <p className="text-white font-medium text-sm group-hover:text-indigo-400 transition-colors">{label}</p>
        <p className="text-slate-500 text-xs mt-0.5">{description}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    events: 0,
    vendors: 0,
    tickets: 0,
    revenue: 0,
  })
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [eventsRes, vendorsRes, ticketsRes] = await Promise.all([
        supabase.from('events').select('*').eq('user_id', user.id),
        supabase.from('vendors').select('*, events!inner(user_id)').eq('events.user_id', user.id),
        supabase.from('tickets').select('*, events!inner(user_id)').eq('events.user_id', user.id),
      ])

      const events = eventsRes.data || []
      const vendors = vendorsRes.data || []
      const tickets = ticketsRes.data || []
      const revenue = tickets.reduce((sum, t) => sum + (t.price || 0), 0)

      setStats({
        events: events.length,
        vendors: vendors.length,
        tickets: tickets.length,
        revenue: revenue.toFixed(2),
      })

      setRecentEvents(events.slice(0, 5))
      setLoading(false)
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back! Here&apos;s what&apos;s happening across your events.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Events"   value={stats.events}  sub="All time"            color="text-white" />
        <StatCard label="Total Vendors"  value={stats.vendors} sub="Across all events"   color="text-indigo-400" />
        <StatCard label="Tickets Sold"   value={stats.tickets} sub="Across all events"   color="text-emerald-400" />
        <StatCard label="Total Revenue"  value={`$${stats.revenue}`} sub="Ticket sales"  color="text-indigo-300" />
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickLink href="/dashboard/events" Icon={Calendar} label="Create an Event" description="Set up a new collectible event" />
          <QuickLink href="/dashboard/vendors" Icon={Store} label="Manage Vendors" description="Add booths and track payments" />
          <QuickLink href="/dashboard/tickets" Icon={Ticket} label="Manage Tickets" description="Issue and track attendee tickets" />
          <QuickLink href="/dashboard/floorplan" Icon={Map} label="Build Floor Plan" description="Design your venue layout" />
          <QuickLink href="/dashboard/sponsors" Icon={Handshake} label="Manage Sponsors" description="Track sponsorship tiers and deals" />
          <QuickLink href="/dashboard/giveaways" Icon={Gift} label="Run a Giveaway" description="Set prizes and pick winners" />
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Recent Events</h2>
          <Link href="/dashboard/events" className="text-indigo-400 text-sm hover:text-indigo-300">
            View all →
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-10 text-center">
            <p className="text-slate-400 text-sm">No events yet.</p>
            <Link href="/dashboard/events" className="inline-block mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              Create your first event
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {recentEvents.map((event, i) => (
              <div key={event.id} className={`flex items-center justify-between px-6 py-4 ${i !== recentEvents.length - 1 ? 'border-b border-slate-800' : ''}`}>
                <div>
                  <p className="text-white text-sm font-medium">{event.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{event.venue_location || 'No location set'}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  event.status === 'published'
                    ? 'bg-emerald-950 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}