import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const { vendorApplicationId } = await request.json()
    if (!vendorApplicationId) return NextResponse.json({ error: 'Missing vendor ID' }, { status: 400 })

    const { data: vendor } = await supabase
      .from('vendor_applications')
      .select('*, events(id, name)')
      .eq('id', vendorApplicationId)
      .single()

    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    await supabase
      .from('vendor_applications')
      .update({
        payment_status: 'paid',
        application_status: vendor.application_status === 'pending' ? 'approved' : vendor.application_status,
      })
      .eq('id', vendorApplicationId)

    // Sync to budget
    if (vendor.payment_amount > 0 && vendor.events?.id) {
      const { data: existing } = await supabase
        .from('budget_items').select('id')
        .eq('source_type', 'vendor_payment')
        .eq('source_id', vendorApplicationId)
        .single()

      if (!existing) {
        await supabase.from('budget_items').insert({
          event_id: vendor.events.id,
          category: 'Vendor Fees',
          description: `Booth fee — ${vendor.business_name}`,
          type: 'income',
          estimated_amount: vendor.payment_amount,
          actual_amount: vendor.payment_amount,
          source: 'auto',
          source_type: 'vendor_payment',
          source_id: vendorApplicationId,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}