import { createPageMetadata } from '@/lib/seo/metadata';
import { LegalPageShell } from '@/components/legal/legal-page-shell';
import { companyLegal, formatCompanyTaxLine } from '@/lib/config/company';

const LAST_UPDATED = '2026-07-03';

const PAGE_DESCRIPTION =
  'BiletFeed; Türkiye genelinde etkinlik keşfi, güvenli dijital biletleme ve organizatör odaklı modern bir platformdur.';

export const metadata = createPageMetadata({
  title: 'Hakkımızda',
  description: PAGE_DESCRIPTION,
  path: '/hakkimizda'
});

const sections = [
  { id: 'nedir', label: 'BiletFeed Nedir?' },
  { id: 'vizyon', label: 'Vizyon ve Misyon' },
  { id: 'ozellikler', label: 'Platform Özellikleri' },
  { id: 'guven', label: 'Güven ve Ödeme' },
  { id: 'sirket', label: 'Şirket Bilgileri' }
] as const;

export default function AboutPage() {
  return (
    <LegalPageShell
      title="Hakkımızda"
      description={PAGE_DESCRIPTION}
      path="/hakkimizda"
      lastUpdated={LAST_UPDATED}
      sections={[...sections]}
    >
      <section id="nedir">
        <h2>BiletFeed Nedir?</h2>
        <p>
          {companyLegal.brandName}, organizatörlerin oluşturduğu konser, festival,
          tiyatro, spor, workshop ve daha birçok etkinliği tek bir platformda
          bir araya getiren modern bir etkinlik keşif ve bilet satış
          platformudur. Kullanıcılar şehir ve kategoriye göre etkinlikleri
          keşfedebilir; organizatörler ise profesyonel araçlarla etkinliklerini
          yönetebilir ve biletleme süreçlerini dijitalleştirebilir.
        </p>
      </section>

      <section id="vizyon">
        <h2>Vizyon ve Misyon</h2>
        <p>
          <strong>Misyonumuz:</strong> Kültürel, sanatsal ve sosyal etkinlikleri
          geniş kitlelere ulaştırmak; güvenilir, şeffaf ve kullanıcı dostu bir
          biletleme deneyimi sunmak.
        </p>
        <p>
          <strong>Vizyonumuz:</strong> Türkiye&apos;nin en güvenilir ve en
          sevilen dijital etkinlik platformu olmak; organizatörler ile
          katılımcılar arasında kaliteli bir köprü kurmak.
        </p>
      </section>

      <section id="ozellikler">
        <h2>Platform Özellikleri</h2>
        <ul>
          <li>
            <strong>Mobil öncelikli tasarım:</strong> Tüm deneyim akışları
            önce mobil cihazlar için optimize edilir.
          </li>
          <li>
            <strong>Organizatör odaklı panel:</strong> Etkinlik oluşturma,
            bilet türleri, kurallar, duyurular ve satış takibi tek panelde.
          </li>
          <li>
            <strong>Dijital bilet:</strong> Satın alma sonrası biletler hesabınızda
            ve e-posta ile teslim edilir.
          </li>
          <li>
            <strong>QR doğrulama:</strong> Giriş noktalarında güvenli QR kod
            doğrulama altyapısı.
          </li>
          <li>
            <strong>Etkinlik kuralları motoru:</strong> Kategorize edilmiş,
            çok dilli ve şeffaf etkinlik kuralları.
          </li>
          <li>
            <strong>Türkiye geneli keşif:</strong> Şehir bazlı etkinlik listeleri
            ve kategori filtreleri.
          </li>
        </ul>
      </section>

      <section id="guven">
        <h2>Güven ve Ödeme</h2>
        <p>
          Ödeme işlemleri banka sanal POS altyapısı üzerinden SSL/TLS şifreli
          bağlantı ile gerçekleştirilir. Kart bilgileriniz BiletFeed
          sunucularında saklanmaz. Tüm işlemler 3D Secure doğrulama
          süreçlerine tabidir.
        </p>
        <p>
          Kişisel verileriniz KVKK kapsamında korunur. Detaylı bilgi için{' '}
          <a href="/gizlilik">Gizlilik Politikası</a> sayfamızı inceleyebilirsiniz.
        </p>
      </section>

      <section id="sirket">
        <h2>Şirket Bilgileri</h2>
        <table>
          <tbody>
            <tr>
              <td><strong>Ticaret Unvanı</strong></td>
              <td>{companyLegal.tradeName}</td>
            </tr>
            <tr>
              <td><strong>Vergi Dairesi / No</strong></td>
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
    </LegalPageShell>
  );
}
