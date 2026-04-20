import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event
  try {
    event = process.env.STRIPE_WEBHOOK_SECRET
      ? stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
      : JSON.parse(body)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const session = event.data?.object

  if (event.type === 'checkout.session.completed') {
    const userId = session.metadata?.userId
    const customerId = session.customer
    const subscriptionId = session.subscription

    if (userId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      const priceId = sub.items.data[0]?.price?.id

      let plan = 'basic'
      if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
          priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID) {
        plan = 'pro'
      }

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        plan,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    }
  }

  if (event.type === 'customer.subscription.deleted' ||
      event.type === 'customer.subscription.paused') {
    const sub = session
    const userId = sub.metadata?.userId
    if (userId) {
      await supabase.from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', sub.id)
    }
  }

  return NextResponse.json({ received: true })
}