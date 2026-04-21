import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  try {
    const body = await request.json()
    const { type, priceId, email, userId, eventId, ticketTypeId, attendeeName, quantity } = body

    if (type === 'subscription') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
        metadata: { userId },
        subscription_data: { metadata: { userId } },
      })
      return NextResponse.json({ url: session.url })
    }

    if (type === 'ticket') {
      const { name, amount, eventName, ticketTypeName } = body
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email || undefined,
        line_items: [{
          price_data: {
            currency: 'cad',
            product_data: {
              name: `${ticketTypeName} - ${eventName}`,
              description: `Ticket for ${eventName}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: quantity || 1,
        }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}/tickets/success?session_id={CHECKOUT_SESSION_ID}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email || '')}&ticketType=${encodeURIComponent(ticketTypeName)}&amount=${amount}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}/tickets?cancelled=true`,
        metadata: { type: 'ticket', eventId, ticketTypeId, attendeeName: name, attendeeEmail: email || '' },
      })
      return NextResponse.json({ url: session.url })
    }

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}