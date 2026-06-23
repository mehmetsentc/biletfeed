import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Çerez Politikası — BiletFeed',
  description: 'BiletFeed çerez politikası ve çerez yönetimi hakkında bilgi.',
  path: '/cerezler'
});

const sidebarLinks = [
  { label: 'Hakkımızda', href: '/hakkimizda' },
  { label: 'Gizlilik Politikası', href: '/gizlilik' },
  { label: 'Kullanıcı Sözleşmesi', href: '/kullanici-sozlesmesi' },
  { label: 'Kullanım Koşulları', href: '/kosullar' },
  { label: 'Açık Rıza Beyanı', href: '/acik-riza-beyani' },
  { label: 'Ticari Elektronik İleti', href: '/ticari-elektronik-ileti' },
  { label: 'BiletFeed Panel', href: '/biletfeed-panel' },
  { label: 'Üyelik Sözleşmesi', href: '/uyelik-sozlesmesi' },
  { label: 'Çerez Politikası', href: '/cerezler' },
  { label: 'Mesafeli Satış Sözleşmesi', href: '/mesafeli-satis' },
  { label: 'İade ve İptal Koşulları', href: '/iade-iptal' },
  { label: 'İade Garantisi', href: '/iade-garantisi' },
  { label: 'İletişim', href: '/iletisim' },
];

const cookies = [
  {
    name: '_fbp',
    provider: 'Facebook',
    purpose: 'Facebook reklam ölçümü ve hedefleme için tarayıcı tanımlama çerezi.',
    type: 'Reklam/Pazarlama',
    duration: '90 gün',
  },
  {
    name: '_fbc',
    provider: 'Facebook',
    purpose: 'Facebook tıklama tanımlama çerezi; reklam dönüşümlerini izler.',
    type: 'Reklam/Pazarlama',
    duration: '90 gün',
  },
  {
    name: '_ga',
    provider: 'Google Analytics',
    purpose: 'Kullanıcıları ayırt etmek için kullanılan Google Analytics ana çerezi.',
    type: 'Performans/Analiz',
    duration: '2 yıl',
  },
  {
    name: '_ga_*',
    provider: 'Google Analytics',
    purpose: 'Oturum durumunu sürdürmek için kullanılan GA4 çerezi.',
    type: 'Performans/Analiz',
    duration: '2 yıl',
  },
  {
    name: '_gid',
    provider: 'Google Analytics',
    purpose: 'Kullanıcıları ayırt etmek için kullanılır.',
    type: 'Performans/Analiz',
    duration: '24 saat',
  },
  {
    name: '_gcl_au',
    provider: 'Google Ads',
    purpose: 'Google Ads dönüşüm izleme çerezi.',
    type: 'Reklam/Pazarlama',
    duration: '90 gün',
  },
  {
    name: '_ttp',
    provider: 'TikTok',
    purpose: 'TikTok Pixel ile reklam performansı ve dönüşüm ölçümü.',
    type: 'Reklam/Pazarlama',
    duration: '13 ay',
  },
  {
    name: 'session',
    provider: 'BiletFeed',
    purpose: 'Kullanıcı oturumunu güvenli biçimde yönetmek için HMAC imzalı oturum çerezi.',
    type: 'Zorunlu',
    duration: '5 gün',
  },
  {
    name: 'cityId',
    provider: 'BiletFeed',
    purpose: 'Kullanıcının seçtiği şehri hatırlayarak yerel etkinlikleri öncelikli göstermek.',
    type: 'İşlevsel',
    duration: '1 yıl',
  },
];

export default function CerezlerPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  link.href === '/cerezler'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 prose prose-neutral dark:prose-invert max-w-none">
          <h1>Çerez Politikası</h1>
          <p>
            Bu politika, BiletFeed (&quot;biz&quot;) tarafından işletilen{' '}
            <strong>www.biletfeed.com</strong> adresinde kullanılan çerezleri ve
            benzer teknolojileri açıklamaktadır.
          </p>

          <h2>Çerez Nedir?</h2>
          <p>
            Çerez, ziyaret ettiğiniz bir web sitesi tarafından cihazınıza (bilgisayar,
            telefon, tablet) yerleştirilen küçük bir metin dosyasıdır. Çerezler;
            dil ve konum tercihleri, giriş durumu gibi bilgileri saklamak için
            kullanılır. Web siteleri yalnızca kendileri tarafından yerleştirilen
            çerezlere erişebilir.
          </p>

          <h2>Çerez Türleri</h2>
          <ul>
            <li><strong>Oturum Çerezleri:</strong> Tarayıcı kapatıldığında otomatik silinen geçici çerezler.</li>
            <li><strong>Kalıcı Çerezler:</strong> Belirli bir süre cihazda kalan çerezler.</li>
            <li><strong>Zorunlu Çerezler:</strong> Sitenin çalışması için teknik olarak gerekli; devre dışı bırakılamaz.</li>
            <li><strong>İşlevsel Çerezler:</strong> Dil ve şehir seçimi gibi tercihlerinizi hatırlayan çerezler.</li>
            <li><strong>Performans/Analitik Çerezler:</strong> Ziyaretçi davranışlarını analiz etmek için kullanılan çerezler.</li>
            <li><strong>Reklam/Pazarlama Çerezleri:</strong> İlgi alanlarınıza göre reklam göstermek ve dönüşüm ölçmek için kullanılan çerezler.</li>
          </ul>

          <h2>BiletFeed&apos;in Kullandığı Çerezler</h2>

          <div className="overflow-x-auto not-prose">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-4 py-3 text-left font-semibold">Çerez Adı</th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">Sağlayıcı</th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">Amaç</th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">Tür</th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">Süre</th>
                </tr>
              </thead>
              <tbody>
                {cookies.map((c, i) => (
                  <tr key={c.name} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="border border-border px-4 py-3 font-mono text-xs">{c.name}</td>
                    <td className="border border-border px-4 py-3">{c.provider}</td>
                    <td className="border border-border px-4 py-3 text-muted-foreground">{c.purpose}</td>
                    <td className="border border-border px-4 py-3">{c.type}</td>
                    <td className="border border-border px-4 py-3">{c.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Çerezleri Yönetme</h2>
          <p>
            Tarayıcınızın ayarlarından çerezleri silebilir veya yeni çerez
            yerleştirilmesini engelleyebilirsiniz. Daha fazla bilgi için:
          </p>
          <ul>
            <li>
              <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-primary">
                www.allaboutcookies.org
              </a>
            </li>
            <li>
              <a href="https://www.youronlinechoices.eu" target="_blank" rel="noopener noreferrer" className="text-primary">
                www.youronlinechoices.eu
              </a>
            </li>
          </ul>
          <p>
            Zorunlu çerezleri devre dışı bırakmanız durumunda Platform&apos;un bazı
            işlevleri çalışmayabilir.
          </p>

          <h2>KVKK Kapsamında Çerezler</h2>
          <p>
            Çerezler aracılığıyla toplanan veriler kişisel veri niteliği taşıyabilir.
            Ayrıntılı bilgi için{' '}
            <Link href="/gizlilik" className="text-primary">
              Gizlilik Politikası
            </Link>{' '}
            ve{' '}
            <Link href="/acik-riza-beyani" className="text-primary">
              Açık Rıza Beyanı
            </Link>{' '}
            sayfalarımızı inceleyebilirsiniz.
          </p>

          <h2>İletişim</h2>
          <p>
            <a href="mailto:destek@biletfeed.com" className="text-primary">
              destek@biletfeed.com
            </a>
          </p>
        </main>
      </div>
    </div>
  );
}
