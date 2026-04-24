import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('Creating tickets with:', body)

    const { eventId, name, email, ticketType, amount, qty, sessionId } = body

    if (!eventId || !name) {
      return NextResponse.json({ error: 'Missing eventId or name', body }, { status: 400 })
    }

    const created = []

    for (let i = 0; i < qty; i++) {
      const code = 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase()

      const insertData = {
        event_id: eventId,
        attendee_name: name,
        attendee_email: email || null,
        ticket_type: ticketType || 'general',
        price: parseFloat(amount) / qty,
        qr_code: code,
        scanned: false,
      }

      console.log('Inserting ticket:', insertData)

      const { data, error } = await supabase
        .from('tickets')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Insert error:', error)
        return NextResponse.json({
          error: error.message,
          details: error,
          insertData,
        }, { status: 500 })
      }

      created.push(data)
    }

    console.log('Created tickets:', created)
    return NextResponse.json({ tickets: created, count: created.length })

  } catch (error) {
    console.error('Caught error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}