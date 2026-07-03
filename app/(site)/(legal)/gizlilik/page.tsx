import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';
import { LegalPageShell } from '@/components/legal/legal-page-shell';
import { companyLegal, formatCompanyTaxLine } from '@/lib/config/company';

const LAST_UPDATED = '2026-07-03';

const PAGE_DESCRIPTION =
  'BiletFeed kişisel verilerin korunması politikası, KVKK aydınlatma metni ve çerez bilgilendirmesi.';

export const metadata = createPageMetadata({
  title: 'Gizlilik Politikası',
  description: PAGE_DESCRIPTION,
  path: '/gizlilik'
});

const sections = [
  { id: 'veri-sorumlusu', label: 'Veri Sorumlusu' },
  { id: 'toplanan-veriler', label: 'Toplanan Veriler' },
  { id: 'kullanim-amaclari', label: 'Kullanım Amaçları' },
  { id: 'cerez', label: 'Çerez Politikası' },
  { id: 'odeme-guvenligi', label: 'Ödeme Güvenliği' },
  { id: 'ucuncu-taraf', label: 'Üçüncü Taraf Hizmetleri' },
  { id: 'teknoloji', label: 'Teknoloji Altyapısı' },
  { id: 'aktarim', label: 'Veri Aktarımı' },
  { id: 'saklama', label: 'Saklama Süresi' },
  { id: 'haklar', label: 'Kullanıcı Hakları' },
  { id: 'kvkk-basvuru', label: 'KVKK Başvuru' },
  { id: 'iletisim', label: 'İletişim' }
] as const;

export default function GizlilikPage() {
  return (
    <LegalPageShell
      title="Kişisel Verilerin Korunması Politikası"
      description={PAGE_DESCRIPTION}
      path="/gizlilik"
      lastUpdated={LAST_UPDATED}
      sections={[...sections]}
    >
      <p>
        {companyLegal.brandName} olarak vermekte olduğumuz hizmet gereğince kişisel
        verileriniz; hizmet-sözleşme ilişkisinin kurulması, ifası ve yasal
        yükümlülüklerin yerine getirilmesi amacıyla 6698 sayılı Kişisel
        Verilerin Korunması Kanunu (&quot;KVKK&quot;) ve Avrupa Birliği Genel
        Veri Koruma Tüzüğü (&quot;GDPR&quot;) ilkelerine uygun şekilde
        işlenmektedir.
      </p>

      <section id="veri-sorumlusu">
        <h2>1. Veri Sorumlusu</h2>
        <table>
          <tbody>
            <tr>
              <td><strong>Şirket Unvanı</strong></td>
              <td>{companyLegal.tradeName}</td>
            </tr>
            <tr>
              <td><strong>Vergi</strong></td>
              <td>{formatCompanyTaxLine()}</td>
            </tr>
            <tr>
              <td><strong>Adres</strong></td>
              <td>{companyLegal.address}</td>
            </tr>
            <tr>
              <td><strong>Telefon</strong></td>
              <td>{companyLegal.phone}</td>
            </tr>
            <tr>
              <td><strong>E-posta</strong></td>
              <td>
                <a href={`mailto:${companyLegal.email}`}>{companyLegal.email}</a>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="toplanan-veriler">
        <h2>2. Toplanan Veriler</h2>
        <ul>
          <li><strong>Kimlik:</strong> Ad soyad, doğum tarihi (gerektiğinde)</li>
          <li><strong>İletişim:</strong> E-posta, telefon, adres</li>
          <li><strong>Hesap:</strong> Kullanıcı adı, profil bilgileri, tercihler</li>
          <li><strong>İşlem:</strong> Sipariş, bilet, ödeme durumu, fatura bilgileri</li>
          <li><strong>Teknik:</strong> IP adresi, cihaz bilgisi, oturum kayıtları, çerezler</li>
          <li><strong>Etkinlik:</strong> Favoriler, katılım geçmişi, değerlendirmeler</li>
        </ul>
        <p>
          Kart numarası, CVV veya tam kart bilgileri BiletFeed sunucularında
          saklanmaz; ödeme banka sanal POS altyapısı üzerinden işlenir.
        </p>
      </section>

      <section id="kullanim-amaclari">
        <h2>3. Kullanım Amaçları</h2>
        <ol>
          <li>Üyelik ve kimlik doğrulama</li>
          <li>Bilet satışı, teslimatı ve müşteri desteği</li>
          <li>Ödeme ve muhasebe süreçlerinin yürütülmesi</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          <li>Platform güvenliği ve dolandırıcılık önleme</li>
          <li>İstatistik, analiz ve hizmet iyileştirme</li>
          <li>Açık rıza ile pazarlama ve bildirimler</li>
        </ol>
      </section>

      <section id="cerez">
        <h2>4. Çerez Politikası</h2>
        <p>
          Web sitemizde oturum yönetimi, tercih hatırlama ve analitik amaçlı
          çerezler kullanılmaktadır. Detaylı bilgi için{' '}
          <Link href="/cerezler">Çerez Politikası</Link> sayfamızı inceleyin.
          Çerez tercihlerinizi site altındaki çerez ayarları panelinden
          yönetebilirsiniz.
        </p>
      </section>

      <section id="odeme-guvenligi">
        <h2>5. Ödeme Güvenliği</h2>
        <p>
          Ödeme işlemleri SSL/TLS şifreli bağlantı üzerinden gerçekleştirilir.
          Kart bilgileri BiletFeed altyapısında depolanmaz; işlemler banka sanal
          POS sisteminde 3D Secure doğrulaması ile tamamlanır.
        </p>
      </section>

      <section id="ucuncu-taraf">
        <h2>6. Üçüncü Taraf Hizmetleri</h2>
        <p>
          Hizmet kalitesini sağlamak amacıyla aşağıdaki kategorilerde üçüncü
          taraf sağlayıcılardan yararlanılmaktadır:
        </p>
        <ul>
          <li>Kimlik doğrulama ve oturum yönetimi</li>
          <li>Ödeme ve bankacılık altyapısı</li>
          <li>E-posta ve bildirim servisleri</li>
          <li>Bulut barındırma ve dosya depolama</li>
          <li>Analitik ve performans izleme</li>
        </ul>
        <p>
          Üçüncü taraflarla veri paylaşımı yalnızca hizmetin ifası için gerekli
          ölçüde ve sözleşmesel güvenlik yükümlülükleri ile yapılır.
        </p>
      </section>

      <section id="teknoloji">
        <h2>7. Teknoloji Altyapısı</h2>
        <h3>Firebase Authentication</h3>
        <p>
          Kullanıcı girişi ve kimlik doğrulama Google Firebase Authentication
          altyapısı ile sağlanır. E-posta, şifre ve sosyal giriş bilgileri bu
          servis kapsamında işlenir.
        </p>
        <h3>PostgreSQL Veri Saklama</h3>
        <p>
          Etkinlik, sipariş, bilet ve kullanıcı profil verileri PostgreSQL
          veritabanında şifreli bağlantı ile saklanır. Veritabanı barındırması
          güvenilir bulut sağlayıcıları üzerinden yapılır.
        </p>
        <h3>Cloudflare R2 Dosya Depolama</h3>
        <p>
          Etkinlik görselleri ve yüklenen medya dosyaları Cloudflare R2 nesne
          depolama hizmetinde tutulur. Dosyalara erişim yetkilendirme
          kontrolleri ile sınırlandırılır.
        </p>
      </section>

      <section id="aktarim">
        <h2>8. Veri Aktarımı</h2>
        <p>
          Kişisel verileriniz; yasal zorunluluklar, ödeme kuruluşları, bulut
          altyapı sağlayıcıları ve hizmet ortakları ile yalnızca gerekli
          kapsamda paylaşılabilir. Yurt dışına aktarımda KVKK m. 9 hükümlerine
          uyulur.
        </p>
      </section>

      <section id="saklama">
        <h2>9. Saklama Süresi</h2>
        <p>
          Veriler, işleme amacının gerektirdiği süre ve ilgili mevzuatın öngördüğü
          süreler boyunca saklanır; süre sonunda silinir, yok edilir veya anonim
          hale getirilir.
        </p>
      </section>

      <section id="haklar">
        <h2>10. Kullanıcı Hakları (KVKK m. 11)</h2>
        <ol>
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenmişse bilgi talep etme</li>
          <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Yurt içi/yurt dışı aktarılan üçüncü kişileri bilme</li>
          <li>Eksik veya yanlış verilerin düzeltilmesini isteme</li>
          <li>Silinmesini veya yok edilmesini isteme</li>
          <li>Otomatik işlemeye itiraz etme</li>
          <li>Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme</li>
        </ol>
      </section>

      <section id="kvkk-basvuru">
        <h2>11. KVKK Başvuru Süreci</h2>
        <p>
          Taleplerinizi yazılı olarak {companyLegal.address} adresine veya{' '}
          <a href={`mailto:${companyLegal.email}`}>{companyLegal.email}</a>{' '}
          e-posta adresine iletebilirsiniz. Başvurular kimlik doğrulamasını
          takiben en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
        </p>
      </section>

      <section id="iletisim">
        <h2>12. İletişim Bilgileri</h2>
        <p>
          Gizlilik ile ilgili sorularınız için{' '}
          <Link href="/iletisim">İletişim</Link> sayfamızı kullanabilir veya{' '}
          <a href={`mailto:${companyLegal.email}`}>{companyLegal.email}</a>{' '}
          adresine yazabilirsiniz.
        </p>
      </section>
    </LegalPageShell>
  );
}
