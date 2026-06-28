import Link from 'next/link';
import { companyLegal } from '@/lib/config/company';
import { mobileAppConfig } from '@/lib/config/mobile-app';
import { siteConfig } from '@/lib/config/site';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Mobil Uygulama',
  description:
    'BiletFeed iOS ve Android uygulaması — gizlilik, destek ve hesap yönetimi bilgileri.',
  path: '/mobil-uygulama'
});

export default function MobileAppInfoPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{siteConfig.name} Mobil Uygulama</h1>
      <p className="mt-3 text-muted-foreground">
        {mobileAppConfig.description.full}
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Uygulama Bilgileri</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Paket adı</dt>
            <dd className="font-medium">{mobileAppConfig.appId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Sürüm</dt>
            <dd className="font-medium">{mobileAppConfig.version}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Geliştirici</dt>
            <dd className="font-medium">{companyLegal.tradeName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Destek</dt>
            <dd>
              <a
                href={`mailto:${mobileAppConfig.supportEmail}`}
                className="font-medium text-primary hover:underline"
              >
                {mobileAppConfig.supportEmail}
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Yasal & Gizlilik</h2>
        <ul className="list-inside list-disc space-y-2 text-sm">
          <li>
            <Link href="/gizlilik" className="text-primary hover:underline">
              Gizlilik Politikası
            </Link>
          </li>
          <li>
            <Link href="/kosullar" className="text-primary hover:underline">
              Kullanım Koşulları
            </Link>
          </li>
          <li>
            <Link
              href="/kullanici-sozlesmesi"
              className="text-primary hover:underline"
            >
              Kullanıcı Sözleşmesi
            </Link>
          </li>
          <li>
            <Link href="/cerezler" className="text-primary hover:underline">
              Çerez Politikası
            </Link>
          </li>
        </ul>
      </section>

      <section id="hesap-silme" className="mt-10 space-y-3 scroll-mt-24">
        <h2 className="text-xl font-semibold">Hesap Silme</h2>
        <p className="text-sm text-muted-foreground">
          Hesabınızı kalıcı olarak silmek için{' '}
          <a
            href={`mailto:${mobileAppConfig.supportEmail}?subject=Hesap%20Silme%20Talebi`}
            className="text-primary hover:underline"
          >
            {mobileAppConfig.supportEmail}
          </a>{' '}
          adresine kayıtlı e-posta adresinizden &quot;Hesap Silme Talebi&quot;
          konulu mail gönderin. Talebiniz en geç 30 gün içinde işlenir; yasal
          saklama yükümlülükleri kapsamındaki veriler (fatura, sipariş kayıtları)
          ilgili mevzuat süresince saklanabilir.
        </p>
        <p className="text-sm text-muted-foreground">
          Alternatif: Profil → Ayarlar üzerinden oturumu kapatıp destek ekibiyle
          iletişime geçebilirsiniz.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Toplanan Veriler (Özet)</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Hesap: e-posta, ad, profil fotoğrafı (isteğe bağlı)</li>
          <li>Sipariş: bilet ve ödeme kayıtları (PCI — kart bilgisi saklanmaz)</li>
          <li>Konum: şehir tercihi (isteğe bağlı, çerez/onay ile)</li>
          <li>Cihaz: analitik ve hata raporlama (anonimleştirilmiş)</li>
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-border bg-muted/30 p-6">
        <h2 className="text-lg font-semibold">App Store İnceleme Notu</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bu sayfa Apple App Store ve Google Play inceleme ekipleri için
          destek, gizlilik ve hesap silme bilgilerini tek noktada sunar.
        </p>
      </section>
    </div>
  );
}
