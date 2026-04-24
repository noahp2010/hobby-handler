import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

function slugifySender(value) {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function buildFromEmail({ fromEmail, fromName, companyName, eventName }) {
  if (fromEmail) return fromEmail

  const fallback = process.env.FROM_EMAIL || 'no-reply@hobbyhandler.app'
  const domain = fallback.includes('@') ? fallback.split('@').slice(1).join('@') : fallback
  const localPart = slugifySender(fromName || companyName || eventName || 'no-reply') || 'no-reply'

  return `${localPart}@${domain}`
}

function buildEmailHtml({ subject, greeting, body, closing, signature, logoUrl, brandColor, companyName, footerText }) {
  const color = brandColor || '#4f46e5'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:${color};padding:32px 40px;text-align:center;">
      ${logoUrl
        ? `<img src="${logoUrl}" alt="${companyName || 'Logo'}" style="max-height:60px;max-width:200px;width:auto;display:block;margin:0 auto 12px;" />`
        : `<div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
             <span style="color:white;font-weight:800;font-size:18px;">${(companyName || 'HH').substring(0, 2).toUpperCase()}</span>
           </div>`
      }
      ${companyName ? `<p style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:600;margin:0 0 8px;letter-spacing:0.5px;">${companyName}</p>` : ''}
      <h1 style="color:white;margin:0;font-size:20px;font-weight:800;line-height:1.3;">Vendor Application Received</h1>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">
      <p style="color:#1e293b;font-size:16px;font-weight:600;margin:0 0 20px;line-height:1.4;">${greeting}</p>

      <p style="color:#475569;font-size:15px;line-height:1.8;margin:0 0 24px;white-space:pre-line;">${body}</p>

      <div style="background:#f8fafc;border-left:4px solid ${color};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
        <p style="color:#64748b;font-size:13px;margin:0;line-height:1.6;">
          You will receive a follow-up email once your application has been reviewed. Please check your spam folder if you don't hear back within a few days.
        </p>
      </div>

      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">${closing}</p>

      <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:8px;">
        <p style="color:#1e293b;font-size:15px;font-weight:700;margin:0 0 4px;">${signature}</p>
        ${companyName ? `<p style="color:#64748b;font-size:13px;margin:0;">${companyName}</p>` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0 0 6px;">${footerText || 'Thank you for being part of our event!'}</p>
      <p style="color:#cbd5e1;font-size:11px;margin:0;">Powered by <strong>Hobby Handler</strong> — Collectible Event Management</p>
    </div>
  </div>
</body>
</html>
  `
}

export async function POST(request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Server is missing RESEND_API_KEY' }, { status: 500 })
    }
    if (!process.env.FROM_EMAIL) {
      return NextResponse.json({
        error: 'Server is missing FROM_EMAIL. Set it to a verified Resend sender address or domain to send to any recipient.',
      }, { status: 500 })
    }

    const body = await request.json()
    const {
      to, subject, greeting, body: emailBody,
      closing, signature, logoUrl, brandColor,
      companyName, footerText, businessName, eventName,
      fromName, fromEmail,
    } = body

    if (!to || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    function resolve(str) {
      return (str || '')
        .replace(/{{business_name}}/g, businessName || '')
        .replace(/{{event_name}}/g, eventName || '')
    }

    const html = buildEmailHtml({
      subject: resolve(subject),
      greeting: resolve(greeting),
      body: resolve(emailBody),
      closing: resolve(closing),
      signature: resolve(signature),
      logoUrl,
      brandColor,
      companyName,
      footerText,
    })

    const senderName = fromName || companyName || eventName || 'Hobby Handler'
    const senderEmail = buildFromEmail({ fromEmail, fromName, companyName, eventName })

    const { data, error } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to,
      subject: resolve(subject),
      html,
    })

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to send email', details: error }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}