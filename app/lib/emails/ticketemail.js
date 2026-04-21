export function ticketEmailHtml({ attendeeName, eventName, eventDate, eventVenue, ticketType, ticketCode, price, qrCodeUrl }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Ticket - ${eventName}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#4f46e5;padding:32px 40px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;font-weight:800;">Your Ticket is Confirmed!</h1>
      <p style="color:#c7d2fe;margin:8px 0 0;font-size:15px;">See you at ${eventName}!</p>
    </div>

    <!-- Ticket body -->
    <div style="padding:36px 40px;">
      <p style="color:#64748b;font-size:15px;margin:0 0 24px;">Hi ${attendeeName}, your ticket has been confirmed. Show this QR code at the door.</p>

      <!-- QR Code -->
      <div style="text-align:center;margin:0 0 28px;">
        <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:12px;padding:24px;display:inline-block;">
          <img src="${qrCodeUrl}" alt="QR Code" width="180" height="180" style="display:block;" />
          <p style="color:#94a3b8;font-size:12px;font-family:monospace;margin:12px 0 0;">${ticketCode}</p>
        </div>
      </div>

      <!-- Event details -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <h2 style="color:#1e293b;font-size:18px;font-weight:700;margin:0 0 16px;">${eventName}</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:14px;width:120px;">Ticket Type</td>
            <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">${ticketType}</td>
          </tr>
          ${eventDate ? `
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:14px;">Date</td>
            <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">${eventDate}</td>
          </tr>` : ''}
          ${eventVenue ? `
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:14px;">Venue</td>
            <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">${eventVenue}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:14px;">Amount Paid</td>
            <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">$${price} CAD</td>
          </tr>
        </table>
      </div>

      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
        Powered by Hobby Handler — Collectible Event Management
      </p>
    </div>
  </div>
</body>
</html>
  `
}