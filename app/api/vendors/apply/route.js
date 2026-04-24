import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const { eventId, businessName, contactName, email, phone, formResponses, boothFee } = body

    if (!eventId || !businessName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: application, error } = await supabase
      .from('vendor_applications')
      .insert({
        event_id: eventId,
        business_name: businessName,
        contact_name: contactName || '',
        email: email || '',
        phone: phone || '',
        form_responses: formResponses || {},
        payment_amount: parseFloat(boothFee) || 0,
        payment_status: parseFloat(boothFee) > 0 ? 'unpaid' : 'paid',
        application_status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (email) {
      const { data: event } = await supabase
        .from('events')
        .select('name, user_id')
        .eq('id', eventId)
        .single()

      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('event_id', eventId)
        .single()

      if (template?.send_on_submit) {
        let logoUrl = null
        let brandColor = '#4f46e5'
        let companyName = null
        let senderName = null
        let footerText = null

        if (event?.user_id) {
          const { data: settings } = await supabase
            .from('organizer_settings')
            .select('*')
            .eq('user_id', event.user_id)
            .single()

          if (settings) {
            logoUrl = settings.logo_url
            brandColor = settings.brand_color
            companyName = settings.company_name
            senderName = settings.sender_name
            footerText = settings.email_footer_text
          }
        }

        const requestOrigin = new URL(request.url).origin
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestOrigin

        const emailRes = await fetch(`${baseUrl}/api/email/vendor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: template.subject,
            greeting: template.greeting,
            body: template.body,
            closing: template.closing,
            signature: template.signature,
            logoUrl,
            brandColor,
            companyName,
            footerText,
            fromName: senderName || companyName || event?.name || 'Hobby Handler',
            businessName,
            eventName: event?.name || '',
          }),
        })

        if (!emailRes.ok) {
          const emailErr = await emailRes.json().catch(() => ({}))
          return NextResponse.json({
            error: 'Application saved but failed to send confirmation email',
            emailError: emailErr.error || 'Unknown email error',
          }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ application })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}