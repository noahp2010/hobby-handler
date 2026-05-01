import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const {
      eventId,
      businessName,
      contactName,
      email,
      phone,
      formResponses,
      boothFee,
      feeDescription,
      organizerUserId,
    } = await request.json()

    if (!eventId || !businessName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get organizer's Stripe Connect account
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_connect_id, stripe_connect_enabled')
      .eq('user_id', organizerUserId)
      .single()

    if (!sub?.stripe_connect_id || !sub?.stripe_connect_enabled) {
      return NextResponse.json({
        error: 'Organizer Stripe account not connected or not verified yet.'
      }, { status: 400 })
    }

    // Encode form data into success URL so we can create the application after payment
    const encodedData = encodeURIComponent(JSON.stringify({
      eventId,
      businessName,
      contactName,
      email,
      phone,
      formResponses,
      boothFee,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: feeDescription || 'Vendor Booth Fee',
            description: `Booth fee for ${businessName}`,
          },
          unit_amount: Math.round(parseFloat(boothFee) * 100),
        },
        quantity: 1,
      }],
      payment_intent_data: {
        transfer_data: {
          destination: sub.stripe_connect_id,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendors/${eventId}/success?session_id={CHECKOUT_SESSION_ID}&data=${encodedData}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendors/${eventId}?cancelled=true`,
      metadata: {
        type: 'vendor_booth_fee',
        eventId,
        businessName,
        email: email || '',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Vendor checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}