import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Çerez Politikası',
  path: '/cerezler'
});

export default function CookiesPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 prose prose-neutral dark:prose-invert">
      <h1>Çerez Politikası</h1>
      <p>
        Bu politika, web sitemizde kullanılan çerezlerin türlerini ve
        kullanım amaçlarını açıklar.
      </p>
      <h2>Çerez Nedir?</h2>
      <p>
        Çerezler, tarayıcınıza kaydedilen küçük metin dosyalarıdır. Site
        deneyiminizi iyileştirmek ve tercihlerinizi hatırlamak için
        kullanılır.
      </p>
      <h2>Kullandığımız Çerez Türleri</h2>
      <ul>
        <li>
          <strong>Zorunlu çerezler:</strong> Oturum yönetimi ve güvenlik için
          gereklidir.
        </li>
        <li>
          <strong>Analitik çerezler:</strong> Site kullanımını anonim olarak
          analiz etmemize yardımcı olur.
        </li>
        <li>
          <strong>Tercih çerezleri:</strong> Tema (açık/koyu) gibi
          tercihlerinizi saklar.
        </li>
      </ul>
      <h2>Çerezleri Yönetme</h2>
      <p>
        Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz.
        Zorunlu çerezlerin devre dışı bırakılması bazı özelliklerin
        çalışmamasına neden olabilir.
      </p>
    </div>
  );
}
