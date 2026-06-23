import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Üyelik Sözleşmesi — BiletFeed',
  description: 'BiletFeed üyelik sözleşmesi ve kullanım şartları.',
  path: '/uyelik-sozlesmesi'
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

export default function UyelikSozlesmesiPage() {
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
                  link.href === '/uyelik-sozlesmesi'
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
          <h1>Üyelik Sözleşmesi</h1>
          <p>
            İşbu Üyelik Sözleşmesi (&quot;Sözleşme&quot;), BiletFeed web sitesi ve/veya mobil
            uygulamasına (&quot;Platform&quot;) üye olmak isteyen kişi (&quot;Üye&quot;) ile KSD ORGANİZASYON
            SANAYİ VE TİC LTD ŞTİ (&quot;BiletFeed&quot;) arasında akdedilmektedir. Üyelik
            kaydını tamamlayan kişi, işbu Sözleşme hükümlerini okuduğunu, anladığını
            ve kabul ettiğini beyan eder.
          </p>

          <h2>1. Taraflar</h2>
          <table>
            <tbody>
              <tr>
                <td><strong>Hizmet Sağlayıcı Unvanı</strong></td>
                <td>KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ</td>
              </tr>
              <tr>
                <td><strong>Vergi Dairesi / No</strong></td>
                <td>ANTALYA KURUMLAR VERGİ DAİRESİ MÜDÜRLÜĞÜ / 5901381024</td>
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
                <td>destek@biletfeed.com</td>
              </tr>
            </tbody>
          </table>

          <h2>2. Tanımlar</h2>
          <ul>
            <li><strong>Platform:</strong> www.biletfeed.com adresindeki web sitesi ve/veya BiletFeed mobil uygulaması.</li>
            <li><strong>Üye:</strong> Platform&apos;a kayıt yaptırarak üyelik hesabı oluşturan gerçek kişi.</li>
            <li><strong>Hesap:</strong> Üyelerin platforma erişim sağladığı, kullanıcı adı ve şifresiyle güvence altına alınan kişisel alan.</li>
            <li><strong>Hizmet:</strong> BiletFeed&apos;in etkinlik keşfi, bilet satışı ve ilgili dijital hizmetleri.</li>
            <li><strong>İçerik:</strong> Platform üzerindeki metin, görsel, ses, video ve diğer her türlü materyal.</li>
          </ul>

          <h2>3. Üyelik Koşulları</h2>
          <p>
            Platform&apos;a üye olabilmek için reşit (18 yaşını doldurmuş) olmak gerekmektedir.
            18 yaşından küçük kullanıcıların üyelik oluşturması yasaktır. Üye, üyelik
            formunda sağladığı bilgilerin doğru, güncel ve eksiksiz olduğunu taahhüt
            eder. Yanlış veya eksik bilgi verilmesi durumunda BiletFeed üyeliği
            askıya alma veya sonlandırma hakkını saklı tutar.
          </p>
          <p>
            Her gerçek kişi yalnızca bir üyelik hesabı oluşturabilir. Birden fazla
            hesap oluşturulduğunun tespiti halinde BiletFeed tüm hesapları kapatma
            hakkına sahiptir.
          </p>

          <h2>4. Hesap Güvenliği</h2>
          <p>
            Üye, hesabına ait kullanıcı adı ve şifresinin gizliliğinden ve güvenliğinden
            münferiden sorumludur. Hesap bilgilerinin yetkisiz kişilerce kullanımı
            halinde Üye, derhal BiletFeed&apos;i{' '}
            <a href="mailto:destek@biletfeed.com" className="text-primary">
              destek@biletfeed.com
            </a>{' '}
            adresi üzerinden bilgilendirmekle yükümlüdür. Bildirim yapılmadan önce
            yetkisiz kullanımdan doğan zararlardan BiletFeed sorumlu tutulamaz.
          </p>

          <h2>5. Üyenin Hak ve Yükümlülükleri</h2>
          <p>Üye, Platform&apos;u kullanırken aşağıdaki kurallara uymayı kabul ve taahhüt eder:</p>
          <ul>
            <li>Yürürlükteki tüm mevzuata ve işbu Sözleşme hükümlerine uymak.</li>
            <li>Platform üzerinden üçüncü kişilerin haklarını ihlal eden içerik paylaşmamak.</li>
            <li>Platform&apos;un güvenliğini tehdit edecek yazılım, virüs veya zararlı kod yaymamak.</li>
            <li>Başkalarının hesap bilgilerini ele geçirmeye veya kullanmaya çalışmamak.</li>
            <li>Platform üzerinden otomatik veri toplama, robot veya benzeri yöntemler kullanmamak.</li>
            <li>Etkinlik biletlerini spekülatif ya da ticari amaçla toplu satın almamak.</li>
            <li>Sahte veya yanıltıcı bilgi, inceleme veya yorum paylaşmamak.</li>
          </ul>

          <h2>6. Bilet Satın Alma ve İptal</h2>
          <p>
            Platform üzerinden gerçekleştirilen bilet alımları, Mesafeli Satış Sözleşmesi
            ve İade &amp; İptal Koşulları kapsamında değerlendirilir. Bilet iadesi yalnızca
            ilgili etkinliğin organizatörü ile BiletFeed&apos;in belirlediği koşullar
            çerçevesinde mümkündür. Etkinliğin iptal edilmesi veya ertelenmesi
            durumunda uygulanacak politika ilgili etkinlik sayfasında belirtilir.
          </p>

          <h2>7. Fikri Mülkiyet</h2>
          <p>
            Platform&apos;daki tüm içerik, tasarım, marka, logo ve yazılım BiletFeed veya
            lisans verenlerine aittir. Üye, bu içerikleri yalnızca kişisel, ticari
            olmayan amaçlarla kullanabilir. İzin alınmaksızın kopyalama, dağıtma
            veya değiştirme yasaktır.
          </p>

          <h2>8. Gizlilik ve Kişisel Veriler</h2>
          <p>
            Üyelik sürecinde toplanan kişisel veriler,{' '}
            <Link href="/gizlilik" className="text-primary">
              Kişisel Verilerin Korunması Politikası – Aydınlatma Metni
            </Link>{' '}
            ve{' '}
            <Link href="/acik-riza-beyani" className="text-primary">
              Açık Rıza Beyanı
            </Link>{' '}
            kapsamında işlenir. BiletFeed, 6698 sayılı KVKK hükümlerine uygun davranır.
          </p>

          <h2>9. Ticari İletişim</h2>
          <p>
            Üye, üyelik sürecinde onay vermesi halinde BiletFeed tarafından kampanya,
            etkinlik duyurusu ve bilgilendirme içeren ticari elektronik iletiler
            almayı kabul eder. Bu onay her zaman geri alınabilir.{' '}
            <Link href="/ticari-elektronik-ileti" className="text-primary">
              Ticari Elektronik İleti Bilgilendirme Metni
            </Link>{' '}
            için tıklayınız.
          </p>

          <h2>10. Üyeliğin Askıya Alınması ve Sonlandırılması</h2>
          <p>
            BiletFeed, işbu Sözleşme&apos;yi veya genel kullanım koşullarını ihlal eden
            üyenin üyeliğini önceden bildirim yapmaksızın askıya alabilir veya
            sonlandırabilir. Üye de dilediği zaman{' '}
            <a href="mailto:destek@biletfeed.com" className="text-primary">
              destek@biletfeed.com
            </a>{' '}
            adresine yazılı talep göndererek üyeliğini iptal ettirebilir. Üyeliğin
            sonlandırılması mevcut bilet rezervasyonlarını etkilemez.
          </p>

          <h2>11. Sorumluluk Sınırlaması</h2>
          <p>
            BiletFeed, bir etkinlik platformu olarak etkinliklerin organizasyonundan,
            mekan koşullarından veya sanatçı/katılımcı performansından doğrudan
            sorumlu değildir. Etkinliklerin iptali veya ertelenmesi durumunda iade
            politikası organizatörle birlikte belirlenir. BiletFeed&apos;in sorumluluğu,
            her halükarda ilgili bilet bedeliyle sınırlıdır.
          </p>

          <h2>12. Sözleşme Değişiklikleri</h2>
          <p>
            BiletFeed, işbu Sözleşme&apos;yi önceden bildirimde bulunmaksızın değiştirme
            hakkını saklı tutar. Değişiklikler Platform&apos;da yayımlandığı tarihten
            itibaren geçerli olur. Üye&apos;nin Platform&apos;u kullanmaya devam etmesi
            güncel Sözleşme hükümlerini kabul ettiği anlamına gelir.
          </p>

          <h2>13. Uygulanacak Hukuk ve Uyuşmazlık Çözümü</h2>
          <p>
            İşbu Sözleşme, Türkiye Cumhuriyeti hukukuna tabi olup taraflar arasında
            çıkabilecek uyuşmazlıkların çözümünde Antalya Merkez Mahkemeleri ve
            İcra Daireleri yetkilidir. Tüketici sıfatındaki Üyeler için ilgili
            mevzuat kapsamında Tüketici Hakem Heyeti ve Tüketici Mahkemeleri yetkilidir.
          </p>

          <h2>14. Yürürlük</h2>
          <p>
            İşbu Sözleşme, Üye&apos;nin üyelik kaydını tamamlamasıyla birlikte yürürlüğe
            girer ve üyelik süresince geçerliliğini korur.
          </p>

          <p>
            <strong>Veri Sorumlusu:</strong> KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ —{' '}
            <a href="mailto:destek@biletfeed.com" className="text-primary">
              destek@biletfeed.com
            </a>{' '}
            — 0541 953 93 00
          </p>
        </main>
      </div>
    </div>
  );
}
