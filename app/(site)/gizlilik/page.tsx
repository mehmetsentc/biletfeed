import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Gizlilik Politikası — BiletFeed',
  description: 'BiletFeed kişisel verilerin korunması politikası ve aydınlatma metni.',
  path: '/gizlilik'
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

export default function GizlilikPage() {
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
                  link.href === '/gizlilik'
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
          <h1>Kişisel Verilerin Korunması Politikası — Aydınlatma Metni</h1>

          <p>
            BiletFeed olarak vermekte olduğumuz hizmet gereğince; hizmet-sözleşme
            ilişkisinin kurulması, hizmet devamlılığının sağlanması, hizmetlerimizin
            ifa edilmesi, yasalardan kaynaklanan sorumluluklar gereğince kişisel
            verileriniz kullanılmak, kaydedilmek, saklanmak, muhafaza edilmek,
            güncellenmek, yeniden düzenlemek, açıklanmak, aktarılmak ve/veya
            sınıflandırılmak, devralınmak suretiyle ve mevzuatta yer alan şekillerde
            işlenebilecektir.
          </p>
          <p>
            Siz değerli web sitesi ve mobil uygulama kullanıcımızın güvenliğini göz
            önünde bulundurarak, başta özel hayatın gizliliği olmak üzere, temel hak
            ve özgürlüklerin korunması amacıyla, kişisel verilerinizin hukuka aykırı
            olarak işlenmesini ve erişilmesini önleme ve muhafazasını sağlama
            amacıyla gereken güvenlik düzeyini sağlamaya yönelik tüm tedbirleri
            almaktayız. Kişisel verilerle ilgili düzenlenen 6698 sayılı Kişisel
            Verilerin Korunması Kanunu (&quot;KVKK&quot;) ve bağlı yönetmelik ve tebliğlere
            istinaden aydınlatma yükümlülüğümüz kapsamında bu metni hazırlamış
            bulunmaktayız.
          </p>

          <h2>1. Veri Sorumlusu</h2>
          <p>
            KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ, KVKK ve ilgili düzenlemeler
            kapsamında &quot;veri sorumlusu&quot; sıfatına haiz olup aşağıdaki iletişim
            bilgileri ile tarafımıza ulaşmanız mümkündür.
          </p>
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

          <h2>2. İşlenen Verileriniz</h2>
          <p>
            Sitemize üye olmanız ve/veya hizmetlerimizden yararlanmanız durumunda
            işlenen kişisel verileriniz aşağıda sayılmaktadır:
          </p>
          <ul>
            <li><strong>Kimlik Bilgileri:</strong> Ad soyad, T.C. kimlik no, vergi no, doğum tarihi ve cinsiyet.</li>
            <li><strong>İletişim Bilgileri:</strong> İşyeri adresi, ev adresi, e-posta, KEP adresi, sabit hat ve GSM numarası.</li>
            <li><strong>Ödeme ve Finans Bilgileri:</strong> Banka kredi kartı, banka hesabı ve banka kartı gibi hesap bilgileri, ödeme yöntem bilgileri, ödeme belgesi, dekont, fatura bilgileri.</li>
            <li><strong>Lokasyon Bilgileri:</strong> Seçilen bölge ve şehir gibi lokasyon verileri.</li>
            <li><strong>Müşteri İşlemlerine Dair Bilgiler:</strong> Sipariş ve fatura bilgileri, talep ve şikâyet bilgileri, IP adresi, Mac ID, gezinme bilgileri, kullanıcı adı ve şifre bilgileri, ticari iletişim izinleri, pazarlama faaliyetlerine ilişkin veriler.</li>
            <li>
              <strong>Çerez Bilgileri:</strong> BiletFeed web sitesi çerezleri; internet vasıtasıyla topladığı bilgileri tercihlerinizle ilgili bir özet oluşturmak amacıyla depolar.
              Detaylı bilgiye{' '}
              <Link href="/cerezler" className="text-primary">Çerez Politikası</Link>
              &apos;ndan ulaşabilirsiniz.
            </li>
          </ul>

          <h2>3. Kişisel Verilerinizin İşlenme Amacı</h2>
          <p>Verileriniz yalnızca aşağıdaki amaçlarla sınırlı olarak işlenmektedir:</p>
          <ol>
            <li>Üyelik kaydının oluşturulması, kimlik doğrulaması ve sözleşmenin kurulması/ifası</li>
            <li>Ön Bilgilendirme Formu, Mesafeli Satış Sözleşmesi ve ilgili mevzuat hükümleri uyarınca bilgilendirme yapılması</li>
            <li>Ürün ve hizmet satışı, faturalandırılması ve iade/değişim işlemlerinin yürütülmesi</li>
            <li>Kampanya, çekiliş ve promosyonların iletilmesi; müşteri memnuniyetinin artırılması</li>
            <li>Kişiselleştirilmiş pazarlama ve reklam faaliyetleri; anket düzenlenmesi</li>
            <li>Bilgi güvenliği süreçlerinin planlanması ve icrası</li>
            <li>Finans, muhasebe, hukuk ve insan kaynakları işlemlerinin yürütülmesi</li>
            <li>Elektronik ödeme sistemlerine ilişkin kayıt ve belgelerin düzenlenmesi</li>
            <li>Mevzuat gereği bilgi saklama, raporlama ve bilgilendirme yükümlülüklerine uyulması</li>
            <li>Müşteri talep, şikâyet ve önerilerinin değerlendirilmesi</li>
            <li>Resmî kurum/kuruluşların talepleri doğrultusunda yasal yükümlülüklerin yerine getirilmesi</li>
          </ol>

          <h2>4. Kişisel Verilerinizin Aktarılabileceği Taraflar</h2>
          <p>
            İşlenen kişisel verileriniz; yurt içindeki resmî kurum ve kuruluşlara,
            kolluk kuvvetlerine, mahkemeler ve icra müdürlüklerine, ilişkili üçüncü
            taraflara, hizmet sağlayıcı firmalara, iş ortaklarına, bulut ortamında
            depolama hizmeti aldığımız yurt içi/yurt dışı kurumlara, Bankalararası
            Kart Merkezi ve anlaşmalı bankalara, online ödeme sistemlerine, ajans ve
            reklam şirketlerine, vergi danışmanları ve mali müşavirlere aktarılabilecektir.
          </p>
          <p>
            Üçüncü kişilere veri aktarımı sırasında hak ihlallerini önlemek için
            gerekli teknik ve hukuki önlemler alınmaktadır.
          </p>

          <h2>5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
          <p>Kişisel verileriniz aşağıdaki yollarla toplanmaktadır:</p>
          <ul>
            <li>Web sitesi ve mobil uygulama üzerindeki formlar, çerezler ve gezinme verileri</li>
            <li>Müşteri hizmetleri ve çağrı merkezi görüşmeleri</li>
            <li>Sosyal medya platformları ve üçüncü taraf kaynaklardan paylaşılan veriler</li>
            <li>Kâğıt üzerindeki formlar, kartvizitler ve benzeri fiziksel kanallar</li>
          </ul>
          <p>
            Kişisel verileriniz; açık rızanız, yasal yükümlülüklerin yerine getirilmesi,
            sözleşmenin kurulması ve ifası, meşru menfaatlerimiz ve kanunda öngörülen
            diğer hukuki sebepler kapsamında KVKK&apos;nın 5. ve 6. maddeleri uyarınca
            işlenmektedir.
          </p>

          <h2>6. Kişisel Verilerinizin Saklanma Süresi</h2>
          <p>
            Kişisel verileriniz, işlenme amacının gerektirdiği süre ve ilgili
            mevzuatın öngördüğü süreler boyunca saklanır. Bu sürelerin dolması
            halinde verileriniz silinir, yok edilir veya anonim hâle getirilir.
          </p>

          <h2>7. KVKK Kapsamındaki Haklarınız</h2>
          <p>
            6698 sayılı Kanun&apos;un 11. maddesi çerçevesinde aşağıdaki haklara sahipsiniz:
          </p>
          <ol>
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse bunlara ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
            <li>Kanun&apos;un 7. maddesi çerçevesinde silinmesini veya yok edilmesini isteme</li>
            <li>Düzeltme ve silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
            <li>Münhasıran otomatik işleme dayalı aleyhte sonuçlara itiraz etme</li>
            <li>Kanuna aykırı işleme sebebiyle uğranılan zararın giderilmesini talep etme</li>
          </ol>
          <p>
            Taleplerinizi; HURMA MAH. 246 SK. ADALIN PARK NO: 9 İÇ KAPI NO: 2
            KONYAALTI / ANTALYA adresimize elden veya noter kanalıyla,{' '}
            ya da kayıtlı elektronik posta (KEP) adresi, güvenli elektronik imza
            ya da sistemimizde kayıtlı e-posta adresiniz üzerinden{' '}
            <a href="mailto:destek@biletfeed.com" className="text-primary">
              destek@biletfeed.com
            </a>{' '}
            adresine iletebilirsiniz.
          </p>
          <p>
            Başvurular kimlik doğrulamasını takiben en geç 30 gün içinde
            ücretsiz olarak sonuçlandırılacaktır.
          </p>

          <h2>8. Güvenlik Tedbirleri</h2>
          <p>
            BiletFeed, kişisel verilerinizin hukuka aykırı olarak işlenmesini ve
            erişilmesini önlemek, gizlilik ve bütünlüğünü korumak amacıyla uygun
            güvenlik düzeyini temin etmeye yönelik gerekli teknik ve idari tedbirleri
            almayı taahhüt eder.
          </p>
          <p>
            İşbu Aydınlatma Metni, mevzuattaki değişiklikler kapsamında güncellenebilir.
            Güncel metne her zaman bu sayfadan ulaşabilirsiniz.
          </p>
        </main>
      </div>
    </div>
  );
}
