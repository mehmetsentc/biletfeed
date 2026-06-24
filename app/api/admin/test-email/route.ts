import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { adminUnauthorized, requireAdminSession } from '@/lib/auth/admin-api';
import {
  emailConfig,
  formatEmailFrom,
  getSenderAddress,
  isEmailConfigured
} from '@/lib/config/email';
import { sendEmail } from '@/lib/email/resend';
import {
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailShell
} from '@/lib/email/email-shared';

const bodySchema = z.object({
  to: z.string().email().optional()
});

function buildTestEmailHtml(): string {
  const content = `
    ${emailLogoBar()}
    ${emailAccentBar()}
    <tr>
      <td style="padding:28px;">
        <h1 style="margin:0 0 12px;font-size:20px;color:#fff;">E-posta testi başarılı ✓</h1>
        <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.65);line-height:1.6;">
          BiletFeed Resend entegrasyonu çalışıyor. Bu mesaj admin test endpoint'inden gönderildi.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="background:rgba(255,255,255,0.04);border-radius:8px;">
          <tr>
            <td style="padding:16px;font-size:12px;color:rgba(255,255,255,0.5);font-family:monospace;line-height:1.8;">
              from: ${formatEmailFrom('default')}<br/>
              tickets: ${getSenderAddress('tickets')}<br/>
              davetiye: ${getSenderAddress('invitation')}<br/>
              fatura: ${getSenderAddress('invoice')}<br/>
              reply-to: ${emailConfig.replyTo}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${emailFooter()}`;

  return emailShell(content);
}

/**
 * POST /api/admin/test-email
 * Admin oturumu ile Resend bağlantısını test eder.
 */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session) return adminUnauthorized();

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY yapılandırılmamış', configured: false },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  const to =
    (parsed.success && parsed.data.to) ||
    session.email ||
    process.env.SUPER_ADMIN_EMAILS?.split(',')[0]?.trim();

  if (!to) {
    return NextResponse.json(
      { error: 'Alıcı e-postası belirtilmedi (body.to veya oturum e-postası gerekli)' },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    to,
    subject: 'BiletFeed — E-posta testi',
    html: buildTestEmailHtml(),
    sender: 'default'
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? 'Gönderim başarısız', configured: true },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    messageId: result.messageId,
    to,
    from: formatEmailFrom('default')
  });
}
