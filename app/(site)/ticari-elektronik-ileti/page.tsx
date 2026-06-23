import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Ticari Elektronik İleti Bilgilendirme Metni — BiletFeed',
  description: 'BiletFeed ticari elektronik ileti gönderimi hakkında bilgilendirme metni.',
  path: '/ticari-elektronik-ileti'
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

export default function TicariElektronikIletiPage() {
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
                  link.href === '/ticari-elektronik-ileti'
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
          <h1>Ticari Elektronik İleti Bilgilendirme Metni</h1>
          <p>
            İşbu metni, kullanıcılarımıza ticari elektronik ileti gönderebilmek için
            onayınıza sunmak ve bu kapsamda bilgi vermek için hazırladık.
          </p>

          <p>
            Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve ilgili mevzuat
            uyarınca ticari elektronik ileti; telefon, çağrı merkezleri, faks,
            otomatik arama makineleri, akıllı ses kaydedici sistemler, elektronik
            posta, kısa mesaj hizmeti gibi vasıtalar kullanılarak elektronik ortamda
            gerçekleştirilen ve ticari amaçlarla gönderilen veri, ses ve görüntü
            içerikli iletileri ifade etmektedir.
          </p>

          <p>
            Bahsi geçen ticari elektronik iletilerin gönderilebilmesi için alıcılardan
            önceden onay alınması gerekmekte olup söz konusu onay yazılı veya her türlü
            elektronik iletişim araçlarıyla ya da İleti Yönetim Sistemi (&quot;İYS&quot;)
            üzerinden alınabilmektedir.
          </p>

          <p>Onayınız halinde BiletFeed;</p>
          <ul>
            <li>Ürün ve hizmetlerimize ilişkin kampanyalar, reklamlar, avantajlar, promosyonlar, bilgilendirmeler, tanıtımlar ve kutlamalar</li>
            <li>Ürün ve hizmetler ile ilgili müşteri memnuniyeti anketleri</li>
            <li>Kampanya, yarışma, çekiliş, davet, açılış ve diğer etkinliklere ilişkin davetler</li>
          </ul>
          <p>
            pazarlama faaliyetleri kapsamında tarafınıza ticari elektronik ileti
            gönderebilecek olup kimlik ve iletişim gibi kişisel verileriniz işlenecektir.
          </p>

          <p>
            Kişisel verileriniz bu kapsamda; ticari elektronik ileti gönderiminin
            yapılabilmesi ve ileti gönderimine ilişkin onay/red tercihlerinizin
            güncel tutulabilmesi için İYS ile şirket sistemlerimizin entegrasyonunu
            yürütmek amacıyla hizmet aldığımız üçüncü taraflarla ve yasal
            yükümlülüklerimizi yerine getirebilmek amacıyla İYS ile paylaşılacaktır.
          </p>

          <h2>Red Bildirimi</h2>
          <p>
            Kullanıcılar istedikleri zaman hiçbir gerekçe göstermeksizin ticari
            elektronik ileti almayı reddedebilmektedir. Kullanıcıya ticari elektronik
            ileti hangi iletişim aracıyla gönderildiyse, o iletişim aracı üzerinden
            veya İYS üzerinden ücretsiz red bildiriminde bulunulabilir.
          </p>
          <p>
            Red bildiriminin BiletFeed&apos;e ulaşmasını takip eden üç iş günü içinde
            ilgili kanala ticari elektronik ileti gönderimi durdurulur.
          </p>

          <h2>Şirket Bilgileri</h2>
          <table>
            <tbody>
              <tr>
                <td><strong>Şirket Unvanı</strong></td>
                <td>KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ</td>
              </tr>
              <tr>
                <td><strong>Vergi No</strong></td>
                <td>5901381024</td>
              </tr>
              <tr>
                <td><strong>Adres</strong></td>
                <td>HURMA MAH. 246 SK. ADALIN PARK NO: 9 İÇ KAPI NO: 2 KONYAALTI / ANTALYA</td>
              </tr>
              <tr>
                <td><strong>Telefon</strong></td>
                <td>0541 953 93 00</td>
              </tr>
              <tr>
                <td><strong>E-posta</strong></td>
                <td>
                  <a href="mailto:destek@biletfeed.com" className="text-primary">
                    destek@biletfeed.com
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          <h2>TİCARİ ELEKTRONİK İLETİ GÖNDERİMİ HAKKINDA AÇIK RIZA BEYANI</h2>
          <p>
            Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve ilgili mevzuat
            kapsamında BiletFeed tarafından gerekli bilgilendirmenin yapıldığını,
            işbu bilgilendirme metnini okuyup anladığımı kabul ediyorum.
          </p>
          <p>
            BiletFeed&apos;in genel ve/veya bana özel kişiselleştirilmiş kampanyalar,
            reklamlar, avantajlar, promosyonlar, bilgilendirmeler, tanıtımlar,
            kutlamalar pazarlama faaliyetleri kapsamında, ürün ve hizmetler ile
            ilgili müşteri memnuniyetine yönelik anketlerin, kampanya, yarışma,
            çekiliş, davet, açılış ve diğer etkinliklere ilişkin davetlerin
            iletilmesi amacıyla şikâyet ve önerilere cevap verilmesi dahil her
            türlü elektronik iletinin gönderimi amacıyla; tarafımla, telefon, faks,
            kısa mesaj (SMS), e-posta, WhatsApp ve benzeri uygulamalar, sosyal
            mecralar, çağrı merkezi ve diğer tüm elektronik iletişim araçları
            vasıtasıyla iletişime geçilmesine, hiçbir gerekçe göstermeksizin
            istediğim zaman ücretsiz olarak ticari elektronik iletileri almayı
            reddedebileceğimi bilerek{' '}
            <strong>aydınlatılmış açık rızam ile onay veriyorum.</strong>
          </p>

          <p>
            Detaylı bilgi için{' '}
            <Link href="/acik-riza-beyani" className="text-primary">
              Açık Rıza Beyanı
            </Link>{' '}
            ve{' '}
            <Link href="/gizlilik" className="text-primary">
              Gizlilik Politikası
            </Link>{' '}
            sayfalarımızı inceleyebilirsiniz.
          </p>
        </main>
      </div>
    </div>
  );
}
