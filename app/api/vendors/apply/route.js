import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      eventId, businessName, contactName, email, phone,
      formResponses, boothFee, stripeSessionId, paymentStatus,
    } = body

    if (!eventId || !businessName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Prevent duplicate submissions from the same Stripe session
    if (stripeSessionId) {
      const { data: existing } = await supabase
        .from('vendor_applications')
        .select('id')
        .eq('stripe_session_id', stripeSessionId)
        .single()
      if (existing) {
        return NextResponse.json({ error: 'already_submitted', application: existing })
      }
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
        payment_status: paymentStatus || (parseFloat(boothFee) > 0 ? 'unpaid' : 'paid'),
        application_status: 'pending',
        stripe_session_id: stripeSessionId || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-sync to budget if paid
    if (paymentStatus === 'paid' && parseFloat(boothFee) > 0) {
      await supabase.from('budget_items').insert({
        event_id: eventId,
        category: 'Vendor Fees',
        description: `Booth fee — ${businessName}`,
        type: 'income',
        estimated_amount: parseFloat(boothFee),
        actual_amount: parseFloat(boothFee),
        source: 'auto',
        source_type: 'vendor_payment',
        source_id: application.id,
      }).catch(e => console.error('Budget sync error:', e))
    }

    // Send confirmation email if template exists
    if (email) {
      try {
        const { data: event } = await supabase
          .from('events').select('name, user_id').eq('id', eventId).single()
        const { data: template } = await supabase
          .from('email_templates').select('*').eq('event_id', eventId).single()

        if (template?.send_on_submit) {
          let logoUrl = null, brandColor = '#4f46e5', companyName = null, footerText = null
          if (event?.user_id) {
            const { data: settings } = await supabase
              .from('organizer_settings').select('*').eq('user_id', event.user_id).single()
            if (settings) {
              logoUrl = settings.logo_url
              brandColor = settings.brand_color
              companyName = settings.company_name
              footerText = settings.email_footer_text
            }
          }
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/vendor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: email,
              subject: template.subject,
              greeting: template.greeting,
              body: template.body,
              closing: template.closing,
              signature: template.signature,
              logoUrl, brandColor, companyName, footerText,
              businessName,
              eventName: event?.name || '',
            }),
          })
        }
      } catch (e) {
        console.error('Email error:', e)
      }
    }

    return NextResponse.json({ application })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 