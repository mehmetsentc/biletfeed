/** Elegant HTML email template for event invitations. */
export function buildInvitationEmail(params: {
  guestName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventCity: string;
  coverImage: string;
  ticketTypeName: string;
  ticketCode: string;
  personalMessage?: string;
  inviteUrl: string;
}): string {
  const {
    guestName,
    eventTitle,
    eventDate,
    eventVenue,
    eventCity,
    coverImage,
    ticketTypeName,
    ticketCode,
    personalMessage,
    inviteUrl
  } = params;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Etkinlik Davetiyeniz</title>
</head>
<body style="margin:0;padding:0;background:#0c1017;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#0c1017;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#151b24;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

          <!-- Logo bar -->
          <tr>
            <td style="padding:20px 28px;background:#0e1420;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px;">
                bilet<span style="color:#f5a623;">feed</span>
              </span>
            </td>
          </tr>

          <!-- Cover image -->
          ${coverImage ? `
          <tr>
            <td>
              <img src="${coverImage}" alt="${eventTitle}"
                   width="560" style="display:block;width:100%;height:auto;max-height:240px;object-fit:cover;" />
            </td>
          </tr>` : ''}

          <!-- Gold accent bar -->
          <tr>
            <td>
              <div style="height:3px;background:linear-gradient(90deg,#f5a623,#e09510);"></div>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:32px 28px;">

              <!-- Badge -->
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#f5a623;">
                ✦ Davetiye
              </p>

              <!-- Greeting -->
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">
                Sayın ${guestName},
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;">
                <strong style="color:#fff;">${eventTitle}</strong> etkinliğine davetlisiniz.
                Sizi aramızda görmekten büyük mutluluk duyacağız.
              </p>

              ${personalMessage ? `
              <!-- Personal message -->
              <div style="margin:0 0 24px;padding:16px 20px;background:rgba(245,166,35,0.08);border-left:3px solid #f5a623;border-radius:0 8px 8px 0;">
                <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);font-style:italic;line-height:1.6;">
                  "${personalMessage}"
                </p>
              </div>` : ''}

              <!-- Event details -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Etkinlik</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#fff;">${eventTitle}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Tarih & Saat</p>
                    <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">📅 ${eventDate}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Konum</p>
                    <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">📍 ${eventVenue}, ${eventCity}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;">
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Bilet Türü</p>
                    <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">🎟 ${ticketTypeName}</p>
                  </td>
                </tr>
              </table>

              <!-- Ticket code -->
              <div style="text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Davetiye Kodu</p>
                <p style="margin:0;font-family:monospace;font-size:20px;font-weight:700;letter-spacing:3px;color:#f5a623;">${ticketCode}</p>
              </div>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}"
                       style="display:inline-block;padding:14px 36px;background:#f5a623;color:#000;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                      Davetiyen'i Görüntüle &amp; QR Kodu Al
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-size:12px;color:rgba(255,255,255,0.3);text-align:center;line-height:1.6;">
                Bu e-posta otomatik gönderilmiştir. Sorularınız için organizatörle iletişime geçin.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;background:#0e1420;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);text-align:center;">
                biletfeed.com · Güvenli etkinlik ve bilet platformu
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
