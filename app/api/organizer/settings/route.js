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
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'No userId' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('organizer_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settings: data || null })
}

export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    const body = await request.json()
    const { userId, brandColor, companyName, senderName, website, phone, address, emailFooterText, logoUrl } = body

    if (!userId) {
      return NextResponse.json({ error: 'No userId' }, { status: 400 })
    }

    const payload = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    }

    if (brandColor !== undefined) payload.brand_color = brandColor
    if (companyName !== undefined) payload.company_name = companyName
    if (senderName !== undefined) payload.sender_name = senderName
    if (website !== undefined) payload.website = website
    if (phone !== undefined) payload.phone = phone
    if (address !== undefined) payload.address = address
    if (emailFooterText !== undefined) payload.email_footer_text = emailFooterText
    if (logoUrl !== undefined) payload.logo_url = logoUrl

    const { error } = await supabaseAdmin
      .from('organizer_settings')
      .upsert(payload, { onConflict: 'user_id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}