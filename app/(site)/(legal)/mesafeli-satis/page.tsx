import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';
import { LegalPageShell } from '@/components/legal/legal-page-shell';
import { companyLegal, formatCompanyTaxLine } from '@/lib/config/company';

const LAST_UPDATED = '2026-07-03';

const PAGE_DESCRIPTION =
  'BiletFeed üzerinden dijital etkinlik bileti satın alımına ilişkin mesafeli satış sözleşmesi.';

export const metadata = createPageMetadata({
  title: 'Mesafeli Satış Sözleşmesi',
  description: PAGE_DESCRIPTION,
  path: '/mesafeli-satis'
});

const sections = [
  { id: 'taraflar', label: 'Taraflar' },
  { id: 'konu', label: 'Konu' },
  { id: 'hizmet', label: 'Hizmet Tanımı' },
  { id: 'siparis', label: 'Sipariş Süreci' },
  { id: 'odeme', label: 'Ödeme' },
  { id: 'teslimat', label: 'Dijital Bilet Teslimi' },
  { id: 'qr', label: 'QR Kodlu Bilet' },
  { id: 'iptal', label: 'İptal Koşulları' },
  { id: 'mucbir', label: 'Mücbir Sebepler' },
  { id: 'organizator', label: 'Organizatör Sorumluluğu' },
  { id: 'kullanici', label: 'Kullanıcı Sorumluluğu' },
  { id: 'uyusmazlik', label: 'Uyuşmazlıklar' }
] as const;

export default function DistanceSalesPage() {
  return (
    <LegalPageShell
      title="Mesafeli Satış Sözleşmesi"
      description={PAGE_DESCRIPTION}
      path="/mesafeli-satis"
      lastUpdated={LAST_UPDATED}
      sections={[...sections]}
    >
      <p>
        İşbu Mesafeli Satış Sözleşmesi (&quot;Sözleşme&quot;), 6502 sayılı
        Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
        hükümleri uyarınca, {companyLegal.brandName} platformu üzerinden dijital
        etkinlik bileti satın alımına ilişkin tarafların hak ve yükümlülüklerini
        düzenler.
      </p>

      <section id="taraflar">
        <h2>1. Taraflar</h2>
        <p>
          <strong>Satıcı / Aracı Hizmet Sağlayıcı:</strong>
        </p>
        <ul>
          <li>Unvan: {companyLegal.tradeName}</li>
          <li>Vergi: {formatCompanyTaxLine()}</li>
          <li>Adres: {companyLegal.address}</li>
          <li>E-posta: <a href={`mailto:${companyLegal.email}`}>{companyLegal.email}</a></li>
          <li>Telefon: {companyLegal.phone}</li>
        </ul>
        <p>
          <strong>Alıcı:</strong> Platform üzerinden bilet satın alan gerçek veya
          tüzel kişi kullanıcı.
        </p>
        <p>
          <strong>Organizatör:</strong> Etkinliği düzenleyen ve bilet koşullarını
          belirleyen taraf. BiletFeed, organizatör adına aracı hizmet sağlar.
        </p>
      </section>

      <section id="konu">
        <h2>2. Konu</h2>
        <p>
          Sözleşmenin konusu; Alıcı&apos;nın {companyLegal.brandName} üzerinden
          elektronik ortamda sipariş verdiği etkinlik biletinin satışı ve dijital
          teslimatına ilişkin usul ve esasların belirlenmesidir.
        </p>
      </section>

      <section id="hizmet">
        <h2>3. Hizmet Tanımı</h2>
        <p>
          Platform üzerinden sunulan hizmet, belirli bir tarih ve mekânda
          gerçekleşecek etkinliğe giriş hakkı sağlayan dijital biletin
          satışıdır. Bilet fiziksel olarak gönderilmez; elektronik ortamda
          teslim edilir.
        </p>
      </section>

      <section id="siparis">
        <h2>4. Sipariş Süreci</h2>
        <ol>
          <li>Kullanıcı etkinlik sayfasından bilet türü ve adet seçer.</li>
          <li>Katılımcı bilgileri ve varsa etkinlik kuralları onaylanır.</li>
          <li>Ödeme adımında sipariş özeti görüntülenir.</li>
          <li>Ödeme onayı sonrası sipariş kesinleşir ve dijital bilet oluşturulur.</li>
        </ol>
      </section>

      <section id="odeme">
        <h2>5. Ödeme</h2>
        <p>
          Ödemeler banka sanal POS altyapısı üzerinden SSL/TLS şifreli bağlantı
          ile alınır. Kart bilgileri BiletFeed sunucularında saklanmaz. Ödeme
          işlemleri 3D Secure doğrulamasına tabidir. Kabul edilen kart ağları
          Visa, Mastercard, Troy ve Tosla&apos;dır.
        </p>
        <p>
          Fiyatlar Türk Lirası (TRY) cinsinden gösterilir; KDV dahil/hariç
          durumu ödeme özetinde belirtilir.
        </p>
      </section>

      <section id="teslimat">
        <h2>6. Dijital Bilet Teslimi</h2>
        <p>
          Ödeme onayının ardından bilet derhal dijital olarak teslim edilir:
        </p>
        <ul>
          <li>Kullanıcı hesabındaki &quot;Biletlerim&quot; bölümü</li>
          <li>Kayıtlı e-posta adresine gönderilen bilet bildirimi</li>
          <li>QR kodlu dijital bilet görüntüsü</li>
        </ul>
        <p>
          Teslimat süresi ödeme onayı ile eş zamanlıdır; fiziksel kargo
          uygulanmaz.
        </p>
      </section>

      <section id="qr">
        <h2>7. QR Kodlu Bilet</h2>
        <p>
          Her bilet benzersiz bir QR kod içerir. Giriş noktasında QR kod
          okutularak doğrulama yapılır. Bilet devri, kopyalanması veya
          yetkisiz paylaşımı etkinlik kuralları ve yürürlükteki mevzuata aykırı
          olabilir.
        </p>
      </section>

      <section id="iptal">
        <h2>8. İptal ve Cayma Hakkı</h2>
        <p>
          Dijital içerik ve belirli tarihte gerçekleşen etkinlik biletlerinde
          cayma hakkı istisnaları uygulanabilir. İptal ve iade koşulları
          etkinlik organizatörünün politikasına tabidir. Detaylar için{' '}
          <Link href="/iade-iptal">Teslimat – İade – İptal</Link> sayfasına
          bakınız.
        </p>
      </section>

      <section id="mucbir">
        <h2>9. Mücbir Sebepler</h2>
        <p>
          Doğal afet, salgın, resmi makam kararları, güvenlik gerekçeleri ve
          benzeri mücbir sebep hallerinde etkinlik ertelenebilir veya iptal
          edilebilir. Bu durumda organizatörün belirlediği iade veya telafi
          politikası uygulanır.
        </p>
      </section>

      <section id="organizator">
        <h2>10. Organizatör Sorumluluğu</h2>
        <p>
          Etkinliğin içeriği, tarihi, mekânı, kapasitesi ve iptal/erteleme
          kararlarından organizatör sorumludur. BiletFeed, platform altyapısı
          sağlayıcısı olarak aracı konumundadır.
        </p>
      </section>

      <section id="kullanici">
        <h2>11. Kullanıcı Sorumluluğu</h2>
        <p>
          Alıcı; doğru iletişim bilgisi vermek, etkinlik kurallarına uymak,
          bileti yetkisiz üçüncü kişilerle paylaşmamak ve girişte geçerli kimlik
          ibraz etmekle yükümlüdür.
        </p>
      </section>

      <section id="uyusmazlik">
        <h2>12. Uyuşmazlıklar ve Yetkili Mahkeme</h2>
        <p>
          İşbu sözleşmeden doğan uyuşmazlıklarda Tüketici Hakem Heyetleri ve
          Tüketici Mahkemeleri yetkilidir. Tüketici; yerleşim yerindeki veya
          işlemin yapıldığı yerdeki hakem heyetine başvurabilir.
        </p>
      </section>
    </LegalPageShell>
  );
}
