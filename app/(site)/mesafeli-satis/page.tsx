import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Mesafeli Satış Sözleşmesi',
  path: '/mesafeli-satis'
});

export default function DistanceSalesPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 prose prose-neutral dark:prose-invert">
      <h1>Mesafeli Satış Sözleşmesi</h1>
      <p>
        Bu sözleşme, Bilet Feed üzerinden dijital etkinlik bileti satın alımına
        ilişkin tarafların hak ve yükümlülüklerini düzenler.
      </p>

      <h2>Satıcı Bilgileri</h2>
      <p>
        Şirket unvanı, vergi dairesi ve MERSİS numarası ödeme kuruluşu başvurusu
        tamamlandığında bu sayfaya eklenecektir.
      </p>

      <h2>Konu</h2>
      <p>
        Alıcı, platform üzerinden seçtiği etkinliğe ait elektronik bileti satın
        alır. Bilet, ödeme onayı sonrası kullanıcı hesabında QR kod olarak
        sunulur.
      </p>

      <h2>Ödeme</h2>
      <p>
        Ödemeler onaylı ödeme kuruluşu (iyzico, PayTR vb.) aracılığıyla 3D Secure
        ile alınır. Kart bilgileri Bilet Feed sunucularında saklanmaz.
      </p>

      <h2>Cayma Hakkı</h2>
      <p>
        Etkinlik tarihine ve etkinlik türüne göre cayma hakkı istisnaları
        uygulanabilir. Detaylar için{' '}
        <Link href="/iade-iptal">İade ve İptal Politikası</Link> sayfasına
        bakınız.
      </p>

      <h2>Uyuşmazlık</h2>
      <p>
        Uyuşmazlıklarda Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri
        yetkilidir.
      </p>
    </div>
  );
}
