import { NextRequest, NextResponse } from 'next/server';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import {
  emailConfig,
  formatEmailFrom,
  getSenderAddress,
  isEmailConfigured
} from '@/lib/config/email';
import { sendEmail } from '@/lib/email/resend';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailSectionLabel,
  emailShell,
  emailSummaryBox
} from '@/lib/email/email-shared';

function buildTestEmailHtml(): string {
  const configDetails = `
    <p style="margin:0;font-size:12px;color:${EMAIL_BRAND.textSecondary};font-family:ui-monospace,Menlo,Consolas,monospace;line-height:1.8;">
      from: ${formatEmailFrom('default')}<br/>
      tickets: ${getSenderAddress('tickets')}<br/>
      davetiye: ${getSenderAddress('invitation')}<br/>
      fatura: ${getSenderAddress('invoice')}<br/>
      reply-to: ${emailConfig.replyTo}
    </p>`;

  const content = `
    ${emailLogoBar()}
    ${emailAccentBar()}
    <tr>
      <td style="padding:28px 28px 8px;">
        ${emailSectionLabel('Sistem testi')}
        <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.25;">
          E-posta testi başarılı ✓
        </h1>
        <p style="margin:0 0 20px;font-size:15px;color:${EMAIL_BRAND.textSecondary};line-height:1.65;">
          BiletFeed Resend entegrasyonu çalışıyor. Bu mesaj admin test endpoint'inden gönderildi.
        </p>
        ${emailSummaryBox(configDetails)}
      </td>
    </tr>
    ${emailFooter()}`;

  return emailShell(content, 'BiletFeed e-posta entegrasyonu testi başarılı.');
}

/**
 * POST /api/admin/test-email
 * Admin oturumu ile Resend bağlantısını test eder.
 * Alıcı yalnızca oturum e-postası olabilir.
 */
export async function POST(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'settings.manage');
  if ('error' in guard) return guard.error;

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY yapılandırılmamış', configured: false },
      { status: 503 }
    );
  }

  const to = guard.ctx.session.email;
  if (!to) {
    return NextResponse.json(
      { error: 'Oturum e-postası bulunamadı' },
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
