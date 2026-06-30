'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Info } from 'lucide-react';

type Setting = { label: string; key: string; value: string; type: 'text' | 'number' | 'toggle'; hint?: string };

const SECTIONS: { title: string; settings: Setting[] }[] = [
  {
    title: 'Scraper Ayarları',
    settings: [
      { label: 'Max Listing Sayfası (Bubilet)', key: 'SCRAPER_MAX_PAGES', value: '120', type: 'number', hint: 'Bubilet scraper\'ının tarayacağı max sayfa sayısı' },
      { label: 'Concurrency (paralel istek)', key: 'SCRAPER_CONCURRENCY', value: '8', type: 'number', hint: 'Aynı anda yapılacak paralel istek sayısı' },
      { label: 'Max Detay Sayfası', key: 'SCRAPER_MAX_DETAILS', value: '400', type: 'number', hint: 'Tek scrape\'de işlenecek max etkinlik detayı' }
    ]
  },
  {
    title: 'Ödeme & Komisyon',
    settings: [
      { label: 'Varsayılan Komisyon Oranı (%)', key: 'DEFAULT_COMMISSION_RATE', value: '10', type: 'number', hint: 'Yeni organizatörlere atanacak varsayılan komisyon' },
      { label: 'KDV Oranı (%)', key: 'ACCOUNTING_VAT_RATE', value: '20', type: 'number', hint: 'Fatura ve gelir hesaplamalarında kullanılacak KDV oranı' }
    ]
  },
  {
    title: 'Özellik Bayrakları',
    settings: [
      { label: 'AI Özellikleri', key: 'NEXT_PUBLIC_ENABLE_AI', value: 'false', type: 'toggle', hint: 'Yapay zeka destekli özellikleri etkinleştir' },
      { label: 'Subdomain Desteği', key: 'NEXT_PUBLIC_ENABLE_SUBDOMAINS', value: 'true', type: 'toggle', hint: 'panel.biletfeed.com organizatör paneli' },
      { label: 'Panel URL', key: 'NEXT_PUBLIC_PANEL_URL', value: 'https://panel.biletfeed.com', type: 'text', hint: 'Organizatör paneli alt alanı' },
    ]
  },
  {
    title: 'E-posta (Resend)',
    settings: [
      { label: 'Gönderen Adı', key: 'RESEND_FROM_NAME', value: 'BiletFeed', type: 'text', hint: 'E-postalarda görünen marka adı' },
      { label: 'Varsayılan Gönderen', key: 'RESEND_FROM_EMAIL', value: 'tickets@biletfeed.com', type: 'text', hint: 'Bilet onayı ve varsayılan gönderen' },
      { label: 'Yanıt Adresi', key: 'RESEND_REPLY_TO', value: 'destek@biletfeed.com', type: 'text', hint: 'Müşteri yanıtları bu adrese gider' },
      { label: 'Fatura Gönderen', key: 'RESEND_INVOICE_FROM', value: 'fatura@biletfeed.com', type: 'text', hint: 'e-Arşiv / fatura bildirimleri' },
      { label: 'Davetiye Gönderen', key: 'RESEND_INVITATION_FROM', value: 'davetiye@biletfeed.com', type: 'text', hint: 'EventJoy davetiye e-postaları' }
    ]
  }
];

export function SystemSettingsPanel() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    SECTIONS.forEach((s) => s.settings.forEach((st) => { map[st.key] = st.value; }));
    return map;
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // In production: POST to /api/admin/settings to update env vars via Vercel API or DB config table
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex gap-2">
        <Info className="size-4 shrink-0 mt-0.5" />
        <span>
          Bu ayarlar ortam değişkenleri aracılığıyla yönetilir. Değişiklikler için
          <strong> Vercel Dashboard → Settings → Environment Variables</strong> kullanın veya
          bir <code>config</code> DB tablosu ekleyin.
        </span>
      </div>

      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.settings.map((setting) => (
              <div key={setting.key}>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{setting.label}</Label>
                  <code className="text-xs text-muted-foreground">{setting.key}</code>
                </div>
                {setting.hint && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{setting.hint}</p>
                )}
                {setting.type === 'toggle' ? (
                  <button
                    onClick={() =>
                      setValues((prev) => ({
                        ...prev,
                        [setting.key]: prev[setting.key] === 'true' ? 'false' : 'true'
                      }))
                    }
                    className={`mt-2 relative inline-flex h-6 w-11 rounded-full transition-colors ${
                      values[setting.key] === 'true' ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-1 size-4 rounded-full bg-card shadow transition-transform ${
                        values[setting.key] === 'true' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                ) : (
                  <Input
                    type={setting.type}
                    className="mt-2 h-8 text-sm font-mono"
                    value={values[setting.key] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90">
          <Save className="size-4" />
          {saved ? '✓ Kaydedildi' : 'Ayarları Kaydet'}
        </Button>
      </div>
    </div>
  );
}
