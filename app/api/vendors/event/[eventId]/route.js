import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request, { params }) {
  try {
    const { eventId } = await params

    const { data: event } = await supabase
      .from('events').select('*').eq('id', eventId).single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const { data: fields } = await supabase
      .from('vendor_form_fields').select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })

    const { data: paymentSettings } = await supabase
      .from('vendor_payment_settings').select('*')
      .eq('event_id', eventId).single()

    // Check if organizer has Stripe Connect enabled
    let stripeEnabled = false
    if (event.user_id) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('stripe_connect_id, stripe_connect_enabled')
        .eq('user_id', event.user_id).single()
      if (sub?.stripe_connect_enabled) stripeEnabled = true
    }

    return NextResponse.json({
      event,
      fields: fields || [],
      paymentSettings: paymentSettings || null,
      stripeEnabled,
      organizerUserId: event.user_id,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}