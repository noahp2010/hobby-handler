import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { ticketEmailHtml } from '../../../lib/emails/ticketEmail'
import QRCode from 'qrcode'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const { attendeeName, attendeeEmail, eventName, eventDate, eventVenue, ticketType, ticketCode, price } = await request.json()

    const qrCodeUrl = await QRCode.toDataURL(ticketCode, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })

    await resend.emails.send({
      from: 'Hobby Handler <tickets@hobbyhandler.com>',
      to: attendeeEmail,
      subject: `Your ticket for ${eventName}`,
      html: ticketEmailHtml({
        attendeeName,
        eventName,
        eventDate,
        eventVenue,
        ticketType,
        ticketCode,
        price,
        qrCodeUrl,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}