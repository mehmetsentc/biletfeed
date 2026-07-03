import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';
import { LegalPageShell } from '@/components/legal/legal-page-shell';
import { companyLegal } from '@/lib/config/company';

const LAST_UPDATED = '2026-07-03';

const PAGE_DESCRIPTION =
  'BiletFeed dijital etkinlik bileti teslimatı, iptal ve iade koşulları. E-posta ve hesap teslimatı, QR kodlu bilet.';

export const metadata = createPageMetadata({
  title: 'Teslimat – İade – İptal Koşulları',
  description: PAGE_DESCRIPTION,
  path: '/iade-iptal'
});

const sections = [
  { id: 'teslimat', label: 'Dijital Bilet Teslimatı' },
  { id: 'eposta', label: 'E-posta Teslimatı' },
  { id: 'hesabim', label: 'Hesabım Ekranı' },
  { id: 'qr', label: 'QR Kod' },
  { id: 'organizator-iptal', label: 'Organizatör İptali' },
  { id: 'erteleme', label: 'Erteleme' },
  { id: 'mucbir', label: 'Mücbir Sebep' },
  { id: 'kullanici-iptal', label: 'Kullanıcı İptali' },
  { id: 'iade', label: 'İade Koşulları' },
  { id: 'yasal', label: 'Yasal Haklar' },
  { id: 'iletisim', label: 'İletişim' }
] as const;

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      title="Teslimat – İade – İptal Koşulları"
      description={PAGE_DESCRIPTION}
      path="/iade-iptal"
      lastUpdated={LAST_UPDATED}
      sections={[...sections]}
    >
      <p>
        Bu sayfa, {companyLegal.brandName} üzerinden satın alınan dijital etkinlik
        biletlerinin teslimatı, iptali ve iadesine ilişkin koşulları açıklar.
        Fiziksel ürün kargo süreçleri bu kapsamda yer almaz.
      </p>

      <section id="teslimat">
        <h2>1. Dijital Bilet Teslimatı</h2>
        <p>
          Etkinlik biletleri fiziksel olarak gönderilmez. Ödeme onayının
          ardından bilet anında dijital ortamda teslim edilir. Teslimat süresi
          ödeme işleminin başarıyla tamamlanması ile eş zamanlıdır.
        </p>
      </section>

      <section id="eposta">
        <h2>2. E-posta Teslimatı</h2>
        <p>
          Sipariş onayı ve bilet bilgileri, kayıtlı e-posta adresinize
          gönderilir. E-postanın ulaşmaması halinde spam/gereksiz klasörünü
          kontrol edin veya &quot;Biletlerim&quot; bölümünden biletinize
          erişin.
        </p>
      </section>

      <section id="hesabim">
        <h2>3. Hesabım Ekranı</h2>
        <p>
          Tüm aktif biletleriniz hesabınızdaki <Link href="/biletlerim">Biletlerim</Link>{' '}
          sayfasında görüntülenir. Bilet detayından QR kodunu açabilir,
          etkinlik bilgilerini inceleyebilirsiniz.
        </p>
      </section>

      <section id="qr">
        <h2>4. QR Kodlu Bilet</h2>
        <p>
          Giriş noktasında QR kodunuzu görevliye sunmanız yeterlidir. Her QR kod
          benzersizdir ve yalnızca bir kez kullanılabilir. Ekran parlaklığını
          artırmanız okumayı kolaylaştırır.
        </p>
      </section>

      <section id="organizator-iptal">
        <h2>5. Organizatör Tarafından İptal</h2>
        <p>
          Etkinlik organizatör tarafından iptal edilirse bilet bedeli iade
          edilir veya organizatörün belirlediği alternatif haklar (erteleme,
          değişim bileti vb.) sunulur. İptal bildirimi e-posta ve platform
          bildirimleri ile iletilir.
        </p>
      </section>

      <section id="erteleme">
        <h2>6. Erteleme</h2>
        <p>
          Etkinlik tarihi değiştiğinde mevcut biletleriniz yeni tarih için
          geçerli kalır; aksi organizatör tarafından açıkça belirtilmedikçe
          ek işlem gerekmez.
        </p>
      </section>

      <section id="mucbir">
        <h2>7. Mücbir Sebep</h2>
        <p>
          Doğal afet, salgın, resmi yasaklar ve benzeri mücbir sebep hallerinde
          etkinlik iptal veya ertelenebilir. Bu durumlarda iade/iptal
          politikası organizatörün duyurusuna ve yürürlükteki mevzuata tabidir.
        </p>
      </section>

      <section id="kullanici-iptal">
        <h2>8. Kullanıcı İptali</h2>
        <p>
          Etkinlik bazlı iptal kuralları organizatör tarafından belirlenir ve
          bilet satın alma ekranında gösterilir. Bazı etkinliklerde belirli bir
          tarihe kadar iptal talebi değerlendirilebilir; bazılarında iade
          yapılmayabilir.
        </p>
      </section>

      <section id="iade">
        <h2>9. İade Koşulları</h2>
        <p>
          Onaylanan iadeler, ödemenin yapıldığı banka kartına 5–14 iş günü
          içinde yansıtılır. İade süresi bankanıza bağlı olarak değişebilir.
          Dijital hizmet niteliğindeki biletlerde, etkinlik tarihine yakın
          dönemlerde iade kısıtlamaları uygulanabilir.
        </p>
      </section>

      <section id="yasal">
        <h2>10. Yasal Haklarınız</h2>
        <p>
          6502 sayılı Tüketicinin Korunması Hakkında Kanun ve ilgili
          yönetmelikler kapsamındaki yasal haklarınız saklıdır. Cayma hakkı
          istisnaları dijital içerik ve belirli tarihli etkinlikler için
          uygulanabilir.
        </p>
      </section>

      <section id="iletisim">
        <h2>11. İletişim</h2>
        <p>
          İade ve iptal talepleriniz için{' '}
          <Link href="/iletisim">İletişim</Link> sayfasından veya{' '}
          <a href={`mailto:${companyLegal.email}`}>{companyLegal.email}</a>{' '}
          adresinden bize ulaşabilirsiniz.
        </p>
      </section>
    </LegalPageShell>
  );
}
