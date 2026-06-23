import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'BiletFeed Panel Gizlilik — BiletFeed',
  description: 'BiletFeed organizatör paneli kişisel verilerin korunmasına ilişkin gizlilik politikası.',
  path: '/biletfeed-panel'
});


export default function BiletFeedPanelPage() {
  return (
    <article className="min-w-0 flex-1 max-w-none prose prose-neutral dark:prose-invert">
          <h1>BiletFeed Panel Gizlilik Politikası</h1>
          <p><em>Son güncelleme: Haziran 2025</em></p>

          <p>
            Bu Gizlilik Politikası, KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ (&quot;BiletFeed&quot;)
            tarafından işletilen BiletFeed Organizatör Paneli (&quot;Panel&quot;) üzerinden toplanan
            kişisel verilerin nasıl işlendiğini açıklamaktadır.
          </p>

          <h2>1. Veri Sorumlusu</h2>
          <p>
            <strong>KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ</strong><br />
            Vergi No: 5901381024<br />
            Adres: HURMA MAH. 246 SK. ADALIN PARK NO: 9 İÇ KAPI NO: 2 KONYAALTI / ANTALYA<br />
            E-posta:{' '}
            <a href="mailto:destek@biletfeed.com" className="text-primary">
              destek@biletfeed.com
            </a>
          </p>

          <h2>2. BiletFeed Panel Nedir?</h2>
          <p>
            BiletFeed Panel, etkinlik organizatörlerinin etkinlik oluşturma, bilet yönetimi,
            satış takibi ve raporlama işlemlerini gerçekleştirebildiği çevrimiçi yönetim
            platformudur. Panel yalnızca onaylı organizatörlere açıktır.
          </p>

          <h2>3. Toplanan Kişisel Veriler</h2>
          <p>Panel üzerinden aşağıdaki kategorilerde kişisel veri toplanmaktadır:</p>
          <ul>
            <li><strong>Kimlik Bilgileri:</strong> Ad soyad, T.C. kimlik no veya vergi numarası</li>
            <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası, şirket adresi</li>
            <li><strong>Ticari Bilgiler:</strong> Şirket unvanı, vergi dairesi, banka IBAN bilgisi</li>
            <li><strong>Etkinlik Bilgileri:</strong> Oluşturulan etkinlik detayları, bilet yapısı, fiyatlandırma</li>
            <li><strong>Finansal Bilgiler:</strong> Satış tutarları, ödeme talepleri, hesap hareketleri</li>
            <li><strong>Log ve Sistem Bilgileri:</strong> IP adresi, oturum zamanları, yapılan işlem kayıtları</li>
          </ul>

          <h2>4. Kişisel Verilerin İşlenme Amaçları</h2>
          <ul>
            <li>Organizatör hesabının oluşturulması ve kimlik doğrulaması</li>
            <li>Organizatör sözleşmesinin kurulması ve ifası</li>
            <li>Etkinlik oluşturma, yönetim ve satış hizmetlerinin sunulması</li>
            <li>Bilet gelirlerinin organizatöre aktarılması ve muhasebe işlemleri</li>
            <li>Vergi ve yasal yükümlülüklerin yerine getirilmesi</li>
            <li>Müşteri desteği ve şikâyet yönetimi</li>
            <li>Hizmet kalitesinin ölçülmesi ve iyileştirilmesi</li>
            <li>Güvenlik ve dolandırıcılık önleme tedbirlerinin uygulanması</li>
          </ul>

          <h2>5. Kişisel Verilerin Aktarımı</h2>
          <p>
            Organizatör kişisel verileri; yasal yükümlülükler kapsamında kamu kurumlarına,
            ödeme işlemleri için bankalar ve ödeme sistemlerine, teknik altyapı için
            yurt içi/yurt dışı bulut servis sağlayıcılarına ve vergi/muhasebe hizmetleri
            için ilgili profesyonellere aktarılabilir.
          </p>

          <h2>6. Kişisel Verilerin Saklanma Süresi</h2>
          <p>
            Kişisel veriler, işlenme amacının gerektirdiği süre boyunca ve yasal saklama
            yükümlülükleri kapsamında (Türk Ticaret Kanunu gereğince 10 yıl, vergi mevzuatı
            gereğince 5 yıl) saklanır. Sürenin dolması halinde veriler silinir, yok edilir
            veya anonim hale getirilir.
          </p>

          <h2>7. Panel Güvenliği</h2>
          <p>
            BiletFeed Panel erişimi şifreli bağlantı (HTTPS) üzerinden sağlanmaktadır.
            Hesap güvenliği için güçlü parola kullanılması ve hesap bilgilerinin
            üçüncü taraflarla paylaşılmaması önerilir. BiletFeed, Panel üzerindeki
            verilerin güvenliği için endüstri standardı teknik ve idari önlemleri alır.
          </p>

          <h2>8. Organizatör Hakları</h2>
          <p>
            6698 sayılı KVKK kapsamında organizatörler aşağıdaki haklara sahiptir:
          </p>
          <ul>
            <li>Kişisel verilerinin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
            <li>Kanunda öngörülen koşullar dahilinde silinmesini veya yok edilmesini isteme</li>
            <li>Haklarını kullanarak yapılan işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
            <li>Münhasıran otomatik işleme dayalı aleyhte sonuçlara itiraz etme</li>
            <li>Kanuna aykırı işleme sebebiyle zararının giderilmesini talep etme</li>
          </ul>
          <p>
            Bu haklarınızı kullanmak için{' '}
            <a href="mailto:destek@biletfeed.com" className="text-primary">
              destek@biletfeed.com
            </a>{' '}
            adresine yazılı başvuru yapabilirsiniz.
          </p>

          <h2>9. Çerezler</h2>
          <p>
            BiletFeed Panel, oturum yönetimi ve güvenlik amacıyla zorunlu çerezler kullanır.
            Performans ve analiz çerezleri hakkında ayrıntılı bilgi için{' '}
            <Link href="/cerezler" className="text-primary">
              Çerez Politikası
            </Link>
            &apos;na başvurabilirsiniz.
          </p>

          <h2>10. Politika Değişiklikleri</h2>
          <p>
            Bu politika zaman zaman güncellenebilir. Önemli değişiklikler Panel üzerinden
            veya e-posta yoluyla bildirilir. Güncel politikaya her zaman bu sayfadan
            ulaşabilirsiniz.
          </p>

          <h2>11. İletişim</h2>
          <p>
            Gizlilik politikasına ilişkin sorularınız için:{' '}
            <a href="mailto:destek@biletfeed.com" className="text-primary">
              destek@biletfeed.com
            </a>
          </p>
    </article>
  );
}
