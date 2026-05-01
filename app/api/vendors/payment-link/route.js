import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const { vendorApplicationId, sendEmail } = await request.json()

    const { data: vendor } = await supabase
      .from('vendor_applications')
      .select('*, events(id, name, user_id)')
      .eq('id', vendorApplicationId)
      .single()

    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    const organizerUserId = vendor.events?.user_id
    if (!organizerUserId) return NextResponse.json({ error: 'Cannot find event organizer' }, { status: 400 })

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_connect_id, stripe_connect_enabled')
      .eq('user_id', organizerUserId)
      .single()

    if (!sub?.stripe_connect_id || !sub?.stripe_connect_enabled) {
      return NextResponse.json({ error: 'Organizer Stripe account not connected or not verified.' }, { status: 400 })
    }

    const amount = vendor.payment_amount || 0
    if (amount <= 0) return NextResponse.json({ error: 'No booth fee set for this vendor.' }, { status: 400 })

    // Get organizer branding
    const { data: orgSettings } = await supabase
      .from('organizer_settings').select('*').eq('user_id', organizerUserId).single()

    const brandColor = orgSettings?.brand_color || '#4f46e5'
    const logoUrl = orgSettings?.logo_url || null
    const companyName = orgSettings?.company_name || 'Event Organizer'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: vendor.email || undefined,
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Vendor Booth Fee',
            description: `Booth fee for ${vendor.business_name} at ${vendor.events?.name}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      // Money goes directly to organizer's Stripe account
      payment_intent_data: {
        transfer_data: {
          destination: sub.stripe_connect_id,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendors/payment-success?vendor_id=${vendorApplicationId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendors/payment-cancelled`,
      metadata: {
        type: 'vendor_booth_fee',
        vendorApplicationId,
        organizerUserId,
      },
    })

    // Update vendor record with session ID
    await supabase
      .from('vendor_applications')
      .update({ stripe_session_id: session.id })
      .eq('id', vendorApplicationId)

    // Send email if requested
    if (sendEmail && vendor.email) {
      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:540px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:${brandColor};padding:32px 40px;text-align:center;">
    ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="max-height:48px;display:block;margin:0 auto 14px;width:auto;" />` : ''}
    <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">Booth Fee Payment Request</h1>
    ${companyName ? `<p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">${companyName}</p>` : ''}
  </div>
  <div style="padding:36px 40px;">
    <p style="color:#1e293b;font-size:16px;font-weight:600;margin:0 0 16px;">Hi ${vendor.business_name},</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Your vendor application for <strong>${vendor.events?.name}</strong> has been reviewed.
      Please complete your booth fee payment below to confirm your spot.
    </p>
    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="color:#64748b;font-size:13px;margin:0 0 6px;">Amount Due</p>
      <p style="color:#1e293b;font-size:36px;font-weight:900;margin:0;">$${amount.toFixed(2)} <span style="font-size:18px;font-weight:400;color:#64748b;">CAD</span></p>
    </div>
    <a href="${session.url}" style="display:block;background:${brandColor};color:white;text-decoration:none;text-align:center;border-radius:10px;padding:16px;font-size:16px;font-weight:700;margin-bottom:16px;">
      Pay Now — $${amount.toFixed(2)} CAD
    </a>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">🔒 Secured by Stripe. Your payment info is never stored on our servers.</p>
  </div>
  <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">Powered by Hobby Handler — Collectible Event Management</p>
  </div>
</div>
</body>
</html>`

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: vendor.email,
        subject: `Booth Fee Payment — ${vendor.events?.name} ($${amount.toFixed(2)} CAD)`,
        html,
      })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Payment link error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}