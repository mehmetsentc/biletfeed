import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'İade ve İptal Politikası',
  path: '/iade-iptal'
});

export default function RefundPolicyPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>İade ve İptal Politikası</h1>

      <h2>Genel İlkeler</h2>
      <p>
        Bilet iadeleri etkinlik organizatörünün politikasına ve yürürlükteki
        mevzuata tabidir. Bilet Feed aracı hizmet sağlayıcısıdır.
      </p>

      <h2>İptal Edilen Etkinlikler</h2>
      <p>
        Etkinlik organizatör tarafından iptal edilirse bilet bedeli iade edilir
        veya organizatörün belirlediği alternatif haklar sunulur.
      </p>

      <h2>Kullanıcı İptali</h2>
      <p>
        Etkinlik tarihinden belirli süre öncesine kadar iade talebi
        değerlendirilebilir. Her etkinlik için son iade tarihi bilet satın alma
        ekranında gösterilir.
      </p>

      <h2>İade Süreci</h2>
      <p>
        Onaylanan iadeler, ödemenin yapıldığı yönteme 5–10 iş günü içinde
        yansıtılır.
      </p>

      <h2>İletişim</h2>
      <p>
        İade talepleri için <Link href="/yardim">Yardım</Link> sayfasından bize
        ulaşabilirsiniz.
      </p>
    </article>
  );
}
