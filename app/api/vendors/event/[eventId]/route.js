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
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const { data: fields } = await supabase
      .from('vendor_form_fields')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })

    return NextResponse.json({ event, fields: fields || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}