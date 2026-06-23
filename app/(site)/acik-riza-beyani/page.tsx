import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Açık Rıza Beyanı — BiletFeed',
  description: 'BiletFeed kişisel verilerin işlenmesine ilişkin açık rıza beyanı.',
  path: '/acik-riza-beyani'
});

const sidebarLinks = [
  { label: 'Hakkımızda', href: '/hakkimizda' },
  { label: 'Gizlilik Politikası', href: '/gizlilik' },
  { label: 'Kullanıcı Sözleşmesi', href: '/kullanici-sozlesmesi' },
  { label: 'Kullanım Koşulları', href: '/kosullar' },
  { label: 'Açık Rıza Beyanı', href: '/acik-riza-beyani' },
  { label: 'BiletFeed Panel', href: '/biletfeed-panel' },
  { label: 'Üyelik Sözleşmesi', href: '/uyelik-sozlesmesi' },
  { label: 'Çerez Politikası', href: '/cerezler' },
  { label: 'Mesafeli Satış Sözleşmesi', href: '/mesafeli-satis' },
  { label: 'İade ve İptal Koşulları', href: '/iade-iptal' },
  { label: 'İletişim', href: '/iletisim' },
];

export default function AcikRizaPage() {
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
                  link.href === '/acik-riza-beyani'
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
          <h1>Açık Rıza Beyanı</h1>
          <h2>KİŞİSEL VERİLERİMİN İŞLENMESİNE İLİŞKİN AÇIK RIZA BEYANI</h2>

          <p>
            Kişisel Verilerin Korunması Kanunu [&quot;KVKK&quot;] ve ilgili mevzuata uygun olarak
            kişisel verilerinizin işlenmesine ilişkin aşağıdaki hususlarda açık rızanızı
            talep etmekteyiz. Bu metne konu kişisel verilerinizin işlenmesine açık rıza
            verdikten sonra, dilediğiniz zaman açık rızanızı geri alabileceğinizi hatırlatmak
            isteriz.
          </p>
          <p>
            KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ (&quot;BiletFeed&quot;) veri sorumlusu sıfatıyla
            KVKK kapsamında, hizmet gereğince; hizmet-sözleşme ilişkisinin kurulması, hizmet
            devamlılığının sağlanması, hizmetlerimizin ifa edilmesi, yasalardan kaynaklanan
            sorumluluklar gereğince kişisel verileriniz kullanılmak, kaydedilmek, saklanmak,
            muhafaza edilmek, güncellenmek, yeniden düzenlemek, açıklanmak, aktarılmak ve/veya
            sınıflandırılmak, devralınmak suretiyle ve mevzuatta yer alan şekillerde
            işlenebilecektir.
          </p>
          <p>Aşağıda yer alan kişisel verileriniz şu amaçlarla işlenebilecektir:</p>
          <ul>
            <li>Müşteri/Kullanıcı ile yapılacak olan sözleşmenin kurulması ve/veya ifası, sona erdirilmesi işlemlerinin yerine getirilmesi</li>
            <li>Ürün/Hizmet satışı sonrası hizmetlerinin yerine getirilmesi, üyelik kaydı oluşturulabilmesi ve kimlik doğrulaması yapılabilmesi</li>
            <li>Ön Bilgilendirme Formu, Mesafeli Satış Sözleşmesi ve Tüketicinin Korunması Hakkında Kanun başta olmak üzere mevzuat hükümleri uyarınca gerekli bilgilendirmelerin yapılması</li>
            <li>Ürün, hizmet satışı, faturalandırılması ve iade/değişim işlemlerinin yapılması</li>
            <li>Reklam, çekiliş, kampanya ve promosyonların aktarılması; müşteri memnuniyetinin artırılması</li>
            <li>Web sitesi ve/veya mobil uygulamalardan ürün/hizmet satın alan müşterilerin tanınabilmesi ve müşteri çevresi analizinde kullanılması</li>
            <li>Çeşitli pazarlama ve reklam faaliyetlerinde kullanılması; anlaşmalı kuruluşlar aracılığıyla anketler düzenlenmesi</li>
            <li>Bilgi güvenliği süreçlerinin planlanması, denetimi ve icrası</li>
            <li>Finans ve/veya muhasebe işlerinin takibi, hukuk işlerinin takibi</li>
            <li>Bankacılık ve Elektronik Ödeme alanında zorunlu olan ödeme sistemleri ve belgelerin düzenlenmesi</li>
            <li>Mevzuat gereği bilgi saklama, raporlama, bilgilendirme yükümlülüklerine uyulması</li>
            <li>Pazarlama faaliyetlerinin yapılması, iş geliştirme ve planlama faaliyetlerinin gerçekleştirilmesi</li>
            <li>Müşteri talep, şikayet ve önerilerinin değerlendirilmesi</li>
            <li>Resmî kurum ve kuruluşlarca talep edilmesi halinde yasal yükümlülüklerin yerine getirilmesi</li>
          </ul>

          <p>Bu kapsamda işlenebilecek kişisel veri kategorileri:</p>
          <ul>
            <li><strong>Kimlik Bilgileri:</strong> Ad soyad, T.C. kimlik no, vergi no, doğum tarihi ve cinsiyet.</li>
            <li><strong>İletişim Bilgileri:</strong> İşyeri adresi, ev adresi, e-posta, KEP adresi, sabit hat ve GSM numarası.</li>
            <li><strong>Ödeme ve Finans Bilgileri:</strong> Banka kredi kartı, banka hesabı ve banka kartı gibi banka hesap bilgileri, ödeme yöntem bilgileri, ödeme belgesi, dekont, fatura bilgileri.</li>
            <li><strong>Lokasyon Bilgileri:</strong> Seçilen bölge, şehir gibi lokasyon verileri.</li>
            <li><strong>Müşteri İşlemlerine Dair Bilgiler:</strong> Ürün/Hizmet sipariş, fatura bilgileri, talep ve şikayet bilgileri, IP adresi, Mac ID, gezinme bilgileri, kullanıcı adı, şifre bilgileri, ticari iletişim izinleri, pazarlama faaliyetlerine ilişkin veriler.</li>
            <li><strong>Çerez Bilgileri:</strong> BiletFeed web sitesi çerezleri; internet vasıtası ile topladığı bilgileri tercihlerinizle ilgili bir özet oluşturmak amacıyla depolar. www.biletfeed.com web sitesi size özel tanıtım yapmak, promosyonlar ve pazarlama teklifleri sunmak, web sitesinin içeriğini size göre iyileştirmek ve/veya tercihlerinizi belirlemek, hizmet kalitesini arttırmak, internet kullanım alışkanlıklarınızı depolamak amacıyla site üzerinde gezinme bilgilerinizi ve/veya kullanım geçmişinizi izleyebilmekte ve saklayabilmektedir. Detaylı bilgiye <Link href="/cerezler" className="text-primary">Çerez Politikası</Link>&apos;ndan ulaşabilirsiniz.</li>
          </ul>

          <p>
            İşlenen kişisel verileriniz KVKK&apos;nın kişisel verilerin aktarılmasına ilişkin hükümleri
            kapsamında yukarıda yer alan amaçlarla yurt içindeki resmi kurum ve kuruluşlara,
            kolluk kuvvetlerine, mahkemeler ve icra müdürlüklerine, ilişkili olduğumuz üçüncü
            taraf konumundaki gerçek ve tüzel kişilere, hizmet sağlayıcı firmalar ve
            yetkililerine, iş ortaklarına, hizmet satıcısı-sağlayıcısı firmalara, verilerin
            bulut ortamında saklanması hizmeti aldığımız yurtiçi/yurtdışı kişi ve kurumlara,
            Bankalararası Kart Merkezine, anlaşmalı bankalara, online ödeme sistemlerine ve
            sizlere daha iyi hizmet sunabilmek amacıyla çeşitli pazarlama faaliyetleri
            kapsamında yurtiçi ve yurtdışındaki çeşitli ajans, reklam şirketleri ve anket
            şirketleriyle ve yurtiçi/yurtdışı diğer üçüncü kişilere aktarılabileceğini
            bildirmekteyiz.
          </p>

          <p>
            Kişisel verilerinizin işlenmesine ilişkin olarak 6698 sayılı Kişisel Verilerin
            Korunması Hakkında Kanunu&apos;nun (11.) maddesinde düzenlenmiş aşağıdaki haklarınız
            bulunmaktadır:
          </p>
          <ul>
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme</li>
            <li>Kişisel verilerinizin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
            <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme</li>
            <li>Kişisel verilerin silinmesini veya yok edilmesini isteme</li>
            <li>Verilerinizin aktarıldığı üçüncü kişilerin bildirilmesini isteme</li>
            <li>İşlenen verilerinizin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
            <li>Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararınızın giderilmesini talep etme</li>
          </ul>

          <p>
            Hak ve taleplerinizi dilekçe ile aşağıda yer alan iletişim bilgileri üzerinden
            sunabilirsiniz.
          </p>
          <p>
            <strong>Veri Sorumlusu:</strong> HURMA MAH. 246 SK. ADALIN PARK NO: 9 İÇ KAPI NO: 2
            KONYAALTI / ANTALYA adresli, 5901381024 vergi numaralı KSD ORGANİZASYON SANAYİ VE
            TİC LTD ŞTİ —{' '}
            <a href="mailto:destek@biletfeed.com" className="text-primary">
              destek@biletfeed.com
            </a>
          </p>

          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında KSD
            ORGANİZASYON SANAYİ VE TİC LTD ŞTİ tarafından yukarıdaki açıklamalar ve
            &quot;Kişisel Verilerin Korunması Politikası – Aydınlatma Metni&quot; ile tarafıma,
            işlenecek kişisel veri kategorileri, işlenecek kişisel veriler, işlenme amaçları,
            aktarılacağı kişiler, toplanma yöntemleri ve hukuki sebepleri, veri sorumlusunun
            kimliği ve sahip olduğum haklar ayrıntılı ve anlaşılır bir biçimde anlatılmış ve
            tarafımca söz konusu bu bilgilendirme metni okunmuş ve anlaşılmıştır.
          </p>
          <p>
            KVKK&apos;ya uygun olarak kişisel verilerimin; tamamen veya kısmen elde edilmesi,
            kaydedilmesi, saklanması, muhafaza edilmesi, güncellenmesi, yeniden düzenlemesi,
            açıklanması, aktarılması ve/veya sınıflandırılması, devralınması, anonim hale
            getirilmesi, işlendikleri amaç için gerekli olan ya da ilgili mevzuatta öngörülen
            süre boyunca muhafaza edilmesi, kanuni ya da hizmete bağlı fiili gereklilikler
            halinde şirketinizin birlikte çalıştığı iş ortaklarına ya da kanunen yükümlü
            olduğu kamu kurum ve kuruluşlarına, Türkiye&apos;de veya yurt dışında mukim olan 3.kişi
            hizmet sağlayıcılarına, tedarikçi firmalara, yurtdışına aktarılmasına ve yukarıda
            belirtilen ve{' '}
            <Link href="/gizlilik" className="text-primary">
              Kişisel Verilerin Korunması Politikası – Aydınlatma Metni
            </Link>
            &apos;nde yer alan açıklamalar kapsamında işlenmesine, konu hakkında tereddüde yer
            vermeyecek şekilde bilgi sahibi ve aydınlatılmış olarak <strong>açık rızam ile onay
            veriyorum.</strong>
          </p>
        </main>
      </div>
    </div>
  );
}
