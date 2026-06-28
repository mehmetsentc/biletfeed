import {
  EMAIL_BRAND,
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailShell
} from '@/lib/email/email-shared';
import { getSiteUrl } from '@/lib/config/domain';

export function buildNewsletterWelcomeEmail(params?: {
  cityName?: string | null;
}): string {
  const eventsUrl = getSiteUrl('/etkinlikler');
  const cityName = params?.cityName?.trim();

  const cityLine = cityName
    ? `<p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.78);line-height:1.65;">
         <strong style="color:#ffffff;">${cityName}</strong> ve Türkiye genelindeki yeni etkinlikleri
         size <strong style="color:#ffffff;">"BiletFeed'te yeni"</strong> ve
         <strong style="color:#ffffff;">"${cityName}'de yeni"</strong> başlıklarıyla ileteceğiz.
       </p>`
    : `<p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.78);line-height:1.65;">
         Yaklaşan konserler, festivaller ve şehrinizdeki yeni etkinliklerden
         haberdar olacaksınız. Konumunuzu site üzerinden seçerseniz
         <strong style="color:#ffffff;">"Şehrinizde yeni"</strong> listeleri de gönderilir.
       </p>`;

  const body = `
    <tr>
      <td style="padding:32px 28px;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
          Bültenimize hoş geldiniz!
        </h1>
        <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.78);line-height:1.65;">
          BiletFeed bültenine abone oldunuz.
        </p>
        ${cityLine}
        <p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;">
          Haftalık özetler ve öne çıkan etkinlikler bu adrese gönderilecektir.
        </p>
        <a href="${eventsUrl}"
           style="display:inline-block;padding:14px 28px;background:${EMAIL_BRAND.accent};color:#111111;font-size:15px;font-weight:600;text-decoration:none;border-radius:14px;">
          Etkinlikleri Keşfet
        </a>
      </td>
    </tr>`;

  return emailShell(
    `${emailLogoBar()}${emailAccentBar()}${body}${emailFooter()}`
  );
}
