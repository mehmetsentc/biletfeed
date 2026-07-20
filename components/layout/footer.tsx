import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CookiePreferencesButton } from '@/components/consent/cookie-preferences-button';
import { PaymentCardLogos } from '@/components/checkout/payment-card-logos';
import { AppStoreBadges } from '@/components/footer/app-store-badges';
import { siteConfig } from '@/lib/config/site';
import { accountSiteHref, supportHref } from '@/lib/config/domain';
import { getServerTranslations } from '@/lib/i18n/server';
import { getCategories } from '@/lib/services/events';

const socialLinks = [
  { href: siteConfig.links.facebook, label: 'Facebook' },
  { href: siteConfig.links.instagram, label: 'Instagram' },
  { href: siteConfig.links.twitter, label: 'Twitter' },
  { href: siteConfig.links.youtube, label: 'Youtube' }
].filter((link): link is { href: string; label: string } => Boolean(link.href));

const legalLabels: Record<
  string,
  Record<'tr' | 'en' | 'de' | 'ru', string>
> = {
  career: {
    tr: 'Kariyer',
    en: 'Careers',
    de: 'Karriere',
    ru: 'Карьера'
  },
  faq: { tr: 'SSS', en: 'FAQ', de: 'FAQ', ru: 'FAQ' },
  userAgreement: {
    tr: 'Kullanıcı Sözleşmesi',
    en: 'User Agreement',
    de: 'Nutzervereinbarung',
    ru: 'Пользовательское соглашение'
  },
  distanceSales: {
    tr: 'Mesafeli Satış Sözleşmesi',
    en: 'Distance Sales Agreement',
    de: 'Fernabsatzvertrag',
    ru: 'Договор дистанционной продажи'
  },
  refundCancel: {
    tr: 'Teslimat – İade – İptal',
    en: 'Delivery – Refund – Cancel',
    de: 'Lieferung – Rückgabe – Storno',
    ru: 'Доставка – Возврат – Отмена'
  },
  refundGuarantee: {
    tr: 'İade Garantisi Koşulları',
    en: 'Refund Guarantee Terms',
    de: 'Rückerstattungsgarantie',
    ru: 'Условия гарантии возврата'
  },
  cookies: {
    tr: 'Çerez Politikası',
    en: 'Cookie Policy',
    de: 'Cookie-Richtlinie',
    ru: 'Политика cookie'
  },
  helpCenter: {
    tr: 'Yardım Merkezi',
    en: 'Help Center',
    de: 'Hilfezentrum',
    ru: 'Центр помощи'
  },
  supportRequest: {
    tr: 'Destek Talebi',
    en: 'Support Request',
    de: 'Support-Anfrage',
    ru: 'Запрос в поддержку'
  },
  listEvent: {
    tr: 'Etkinlik Listeleme',
    en: 'List an Event',
    de: 'Event listen',
    ru: 'Разместить событие'
  },
  companyInfo: {
    tr: 'Şirket Bilgisi',
    en: 'Company',
    de: 'Unternehmen',
    ru: 'О компании'
  },
  categoriesHeading: {
    tr: 'Kategoriler',
    en: 'Categories',
    de: 'Kategorien',
    ru: 'Категории'
  },
  followUs: {
    tr: 'Bizi Takip Edin',
    en: 'Follow Us',
    de: 'Folgen Sie uns',
    ru: 'Мы в соцсетях'
  },
  downloadApp: {
    tr: 'Uygulamayı İndir',
    en: 'Download the App',
    de: 'App herunterladen',
    ru: 'Скачать приложение'
  },
  socialSoon: {
    tr: 'Sosyal medya hesaplarımız yakında.',
    en: 'Our social channels are coming soon.',
    de: 'Unsere Social-Media-Kanäle folgen in Kürze.',
    ru: 'Наши соцсети скоро появятся.'
  },
  paymentNote: {
    tr: 'Ödemeler banka sanal POS altyapısı ile SSL/TLS şifreli bağlantı üzerinden işlenir. Kart bilgileriniz BiletFeed sunucularında saklanmaz.',
    en: 'Payments are processed via bank virtual POS over SSL/TLS. Card details are never stored on BiletFeed servers.',
    de: 'Zahlungen laufen über virtuelle Bank-POS mit SSL/TLS. Kartendaten werden nicht auf BiletFeed-Servern gespeichert.',
    ru: 'Платежи обрабатываются через виртуальный POS банка по SSL/TLS. Данные карт на серверах BiletFeed не хранятся.'
  }
};

export async function Footer() {
  const categories = await getCategories();
  const year = new Date().getFullYear();
  const { t, locale } = await getServerTranslations();

  const companyLinks = [
    { href: '/hakkimizda', label: t.footer.about },
    { href: '/iletisim', label: t.footer.contact },
    { href: '/kariyer', label: legalLabels.career[locale] },
    { href: '/sss', label: legalLabels.faq[locale] },
    { href: '/kosullar', label: t.footer.terms },
    { href: '/gizlilik', label: t.footer.privacy },
    { href: '/kullanici-sozlesmesi', label: legalLabels.userAgreement[locale] },
    { href: '/mesafeli-satis', label: legalLabels.distanceSales[locale] },
    { href: '/iade-iptal', label: legalLabels.refundCancel[locale] },
    { href: '/iade-garantisi', label: legalLabels.refundGuarantee[locale] },
    { href: '/cerezler', label: legalLabels.cookies[locale] }
  ];

  const helpLinks = [
    { href: accountSiteHref('/profil/destek'), label: t.account.support },
    { href: supportHref('/'), label: legalLabels.helpCenter[locale] },
    { href: supportHref('/destek-talebi'), label: legalLabels.supportRequest[locale] },
    {
      href: supportHref('/kategori/etkinlik-olusturma'),
      label: legalLabels.listEvent[locale]
    },
    { href: '/biletlerim', label: t.tickets.title },
    { href: '/kosullar', label: t.footer.terms }
  ];

  return (
    <footer>
      <div className="bg-black text-white">
        <div className="container mx-auto px-4 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide">
                {legalLabels.companyInfo[locale]}
              </h3>
              <ul className="space-y-2.5">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-white/90 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <CookiePreferencesButton className="text-sm font-medium text-white/90 transition-colors hover:text-primary" />
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide">
                {t.footer.help}
              </h3>
              <ul className="space-y-2.5">
                {helpLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-white/90 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide">
                {legalLabels.categoriesHeading[locale]}
              </h3>
              <ul className="space-y-2.5">
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/kategoriler/${cat.slug}`}
                      className="text-sm font-medium text-white/90 transition-colors hover:text-primary"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide">
                {legalLabels.followUs[locale]}
              </h3>
              {socialLinks.length > 0 ? (
                <ul className="space-y-2.5">
                  {socialLinks.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-white/90 transition-colors hover:text-primary"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/50">
                  {legalLabels.socialSoon[locale]}
                </p>
              )}
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide">
                {legalLabels.downloadApp[locale]}
              </h3>
              <AppStoreBadges variant="dark" className="flex-col items-start gap-3" />
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-8">
            {/* Ödeme yöntemleri */}
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-white/50">
                {t.footer.copyright(year, siteConfig.name)}
              </p>
              <PaymentCardLogos className="justify-center md:justify-end" />
            </div>
            <p className="mt-3 text-center text-xs text-white/30">
              {legalLabels.paymentNote[locale]}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export async function CuratedCtaBanner() {
  const { t } = await getServerTranslations();

  return (
    <section className="relative overflow-hidden bg-primary py-14">
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <svg className="size-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <path
            d="M0 80 Q200 160 400 80 T800 80 T1200 80"
            fill="none"
            stroke="#000000"
            strokeWidth="3"
          />
        </svg>
      </div>
      <div className="container relative mx-auto flex flex-col items-center gap-6 px-4 text-center md:flex-row md:text-left">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-black md:text-3xl">
            {t.home.curatedTitle}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-black/80 md:text-base">
            {t.home.curatedSubtitle}
          </p>
        </div>
        <Link href="/kayit">
          <span className="inline-flex items-center gap-2 rounded-lg bg-black px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-black/90">
            {t.common.getStarted}
            <ArrowRight className="size-4" />
          </span>
        </Link>
      </div>
    </section>
  );
}
