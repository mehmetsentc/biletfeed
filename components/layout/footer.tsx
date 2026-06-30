import Link from 'next/link';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { CookiePreferencesButton } from '@/components/consent/cookie-preferences-button';
import { AppStoreBadges } from '@/components/footer/app-store-badges';
import { siteConfig } from '@/lib/config/site';
import { panelHref } from '@/lib/config/domain';
import { getCategories } from '@/lib/services/events';

const companyLinks = [
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/iletisim', label: 'İletişim' },
  { href: '/kariyer', label: 'Kariyer' },
  { href: '/sss', label: 'SSS' },
  { href: '/kosullar', label: 'Kullanım Koşulları' },
  { href: '/gizlilik', label: 'Gizlilik Politikası' },
  { href: '/kullanici-sozlesmesi', label: 'Kullanıcı Sözleşmesi' },
  { href: '/mesafeli-satis', label: 'Mesafeli Satış Sözleşmesi' },
  { href: '/iade-iptal', label: 'Teslimat ve İade Şartları' },
  { href: '/cerezler', label: 'Çerez Politikası' },
];

const helpLinks = [
  { href: '/yardim', label: 'Hesap Desteği' },
  { href: panelHref('/organizator-panel/etkinlik/yeni'), label: 'Etkinlik Listeleme' },
  { href: '/biletlerim', label: 'Bilet Satın Alma' },
  { href: '/kosullar', label: 'Bilet Koşulları' }
];

const socialLinks = [
  { href: 'https://facebook.com', label: 'Facebook' },
  { href: 'https://instagram.com', label: 'Instagram' },
  { href: 'https://twitter.com', label: 'Twitter' },
  { href: 'https://youtube.com', label: 'Youtube' }
];

export async function Footer() {
  const categories = await getCategories();
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="bg-black text-white">
        <div className="container mx-auto px-4 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide">
                Şirket Bilgisi
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
                Yardım
              </h3>
              <ul className="space-y-2.5">
                {helpLinks.map((link) => (
                  <li key={link.href}>
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
                Kategoriler
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
                Bizi Takip Edin
              </h3>
              <ul className="space-y-2.5">
                {socialLinks.map((link) => (
                  <li key={link.href}>
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
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide">
                Uygulamayı İndir
              </h3>
              <AppStoreBadges className="flex-col items-start gap-3 [&_a]:opacity-90 [&_a:hover]:opacity-100" />
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-8">
            {/* Ödeme yöntemleri */}
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-white/50">
                © {year} {siteConfig.name}. Tüm hakları saklıdır.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                {/* iyzico ile Öde logosu */}
                <img
                  src="/iyzico/iyzico_ile_ode_colored_horizontal.svg"
                  alt="iyzico ile Öde"
                  className="h-7 w-auto"
                />
                {/* Kart logoları bandı */}
                <img
                  src="/iyzico/logo_band_colored.svg"
                  alt="Mastercard, Visa, American Express, Troy"
                  className="h-7 w-auto"
                />
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-white/30">
              Ödemeler onaylı ödeme kuruluşu altyapısı ile SSL/TLS şifreli bağlantı üzerinden işlenir.
              Kart bilgileriniz BiletFeed sunucularında saklanmaz.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function CreateEventBanner() {
  return (
    <section className="relative overflow-hidden bg-black py-14 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <svg className="size-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <path
            d="M0 100 Q300 20 600 100 T1200 100"
            fill="none"
            stroke="var(--bf-orange)"
            strokeWidth="2"
          />
          <path
            d="M0 140 Q400 60 800 140 T1200 120"
            fill="none"
            stroke="var(--bf-orange)"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div className="container relative mx-auto flex flex-col items-center gap-8 px-4 md:flex-row md:justify-between">
        <div className="max-w-xl text-center md:text-left">
          <h2 className="text-2xl font-bold text-primary md:text-3xl">
            Bilet Feed ile etkinlik oluşturun
          </h2>
          <p className="mt-3 text-sm text-white/80 md:text-base">
            Bir gösteriniz, etkinliğiniz veya harika bir deneyiminiz mi var?
            Bizimle ortak olun ve Bilet Feed&apos;de listelenin.
          </p>
        </div>
        <Link href={panelHref('/organizator-panel/etkinlik/yeni')}>
          <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90">
            <CalendarPlus className="size-5" />
            Etkinlik Oluştur
            <ArrowRight className="size-4" />
          </span>
        </Link>
      </div>
    </section>
  );
}

export function CuratedCtaBanner() {
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
            Size özel seçilmiş etkinlikler!
          </h2>
          <p className="mt-2 max-w-xl text-sm text-black/80 md:text-base">
            İlgi alanlarınıza göre etkinlik önerileri alın. Favori etkinliklerinizi
            kaçırmayın.
          </p>
        </div>
        <Link href="/kayit">
          <span className="inline-flex items-center gap-2 rounded-lg bg-black px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-black/90">
            Hemen Başla
            <ArrowRight className="size-4" />
          </span>
        </Link>
      </div>
    </section>
  );
}
