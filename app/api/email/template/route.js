import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null

export async function GET(request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'No eventId' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('email_templates')
    .select('*')
    .eq('event_id', eventId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ template: data || null })
}

export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    const body = await request.json()
    const { eventId, subject, greeting, body: emailBody, closing, signature, sendOnSubmit } = body

    if (!eventId) {
      return NextResponse.json({ error: 'No eventId' }, { status: 400 })
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('email_templates')
      .select('id')
      .eq('event_id', eventId)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    if (existing) {
      const { error } = await supabaseAdmin.from('email_templates').update({
        subject, greeting, body: emailBody, closing, signature, send_on_submit: sendOnSubmit,
      }).eq('event_id', eventId)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      const { error } = await supabaseAdmin.from('email_templates').insert({
        event_id: eventId, subject, greeting, body: emailBody, closing, signature, send_on_submit: sendOnSubmit,
      })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}