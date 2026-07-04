import { companyLegal } from '@/lib/config/company';
import { emailConfig, formatEmailFrom, getSenderAddress, isEmailConfigured } from '@/lib/config/email';
import { getEnvStatusItems, type EnvCheckItem } from '@/lib/config/env-status';
import { siteConfig } from '@/lib/config/site';
import { getPaymentProviderName } from '@/lib/payments/config';

export type AdminSettingField = {
  label: string;
  key: string;
  value: string;
  hint?: string;
};

export type AdminSettingSection = {
  title: string;
  description?: string;
  fields: AdminSettingField[];
};

export type AdminSettingsSnapshot = {
  envChecks: EnvCheckItem[];
  sections: AdminSettingSection[];
  editableSoon: boolean;
};

function boolLabel(value: boolean): string {
  return value ? 'Açık' : 'Kapalı';
}

/** Admin ayarlar sayfası için salt okunur yapılandırma özeti */
export function getAdminSettingsSnapshot(): AdminSettingsSnapshot {
  const envChecks = getEnvStatusItems();

  const sections: AdminSettingSection[] = [
    {
      title: 'Ödeme & Muhasebe',
      description: 'Komisyon oranları organizatör bazında yönetilir; KDV ortam değişkeninden okunur.',
      fields: [
        {
          label: 'Ödeme sağlayıcı',
          key: 'PAYMENT_PROVIDER',
          value: getPaymentProviderName(),
          hint: 'Production için iyzico (banka onayı sonrası)'
        },
        {
          label: 'KDV Oranı (%)',
          key: 'ACCOUNTING_VAT_RATE',
          value: String(companyLegal.defaultVatRate),
          hint: 'Fatura ve gelir hesaplamalarında kullanılır'
        },
        {
          label: 'Şirket IBAN',
          key: 'COMPANY_IBAN',
          value: companyLegal.iban ? '•••• ayarlı' : 'Eksik',
          hint: 'Fatura ve hakediş ödemeleri için'
        }
      ]
    },
    {
      title: 'Özellik Bayrakları',
      fields: [
        {
          label: 'AI Özellikleri',
          key: 'NEXT_PUBLIC_ENABLE_AI',
          value: boolLabel(siteConfig.features.aiAssistant),
          hint: 'Yapay zeka destekli özellikler'
        },
        {
          label: 'Subdomain Desteği',
          key: 'NEXT_PUBLIC_ENABLE_SUBDOMAINS',
          value: boolLabel(siteConfig.features.subdomains),
          hint: 'panel.biletfeed.com organizatör paneli'
        },
        {
          label: 'EventJoy',
          key: 'NEXT_PUBLIC_ENABLE_EVENTJOY',
          value: boolLabel(siteConfig.features.eventJoy),
          hint: 'Davetiye uygulaması'
        },
        {
          label: 'Panel URL',
          key: 'NEXT_PUBLIC_PANEL_URL',
          value: siteConfig.links.organizerPanel,
          hint: 'Organizatör paneli adresi'
        },
        {
          label: 'Site URL',
          key: 'NEXT_PUBLIC_SITE_URL',
          value: siteConfig.url,
          hint: 'Kanonical site adresi'
        }
      ]
    },
    {
      title: 'E-posta (Resend)',
      fields: [
        {
          label: 'Resend durumu',
          key: 'RESEND_API_KEY',
          value: isEmailConfigured() ? 'Yapılandırıldı' : 'Eksik (log-only)',
          hint: 'E-posta gönderimi için zorunlu'
        },
        {
          label: 'Gönderen Adı',
          key: 'RESEND_FROM_NAME',
          value: emailConfig.fromName
        },
        {
          label: 'Varsayılan Gönderen',
          key: 'RESEND_FROM_EMAIL',
          value: formatEmailFrom('default')
        },
        {
          label: 'Bilet Gönderen',
          key: 'RESEND_TICKETS_FROM',
          value: getSenderAddress('tickets')
        },
        {
          label: 'Davetiye Gönderen',
          key: 'RESEND_INVITATION_FROM',
          value: getSenderAddress('invitation')
        },
        {
          label: 'Fatura Gönderen',
          key: 'RESEND_INVOICE_FROM',
          value: getSenderAddress('invoice')
        },
        {
          label: 'Yanıt Adresi',
          key: 'RESEND_REPLY_TO',
          value: emailConfig.replyTo
        }
      ]
    }
  ];

  return {
    envChecks,
    sections,
    editableSoon: true
  };
}
