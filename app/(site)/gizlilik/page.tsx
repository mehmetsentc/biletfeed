import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Gizlilik Politikası',
  path: '/gizlilik'
});

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 prose prose-neutral dark:prose-invert">
      <h1>Gizlilik Politikası</h1>
      <p>Kişisel verilerinizin korunması bizim için önemlidir. Bu politika, verilerinizin nasıl toplandığını ve kullanıldığını açıklar.</p>
      <h2>Toplanan Veriler</h2>
      <p>Hesap oluşturma, bilet satın alma ve etkinlik katılımı sırasında ad, e-posta ve ödeme bilgileri toplanabilir.</p>
      <h2>Verilerin Kullanımı</h2>
      <p>Toplanan veriler yalnızca hizmet sunumu, iletişim ve yasal yükümlülükler için kullanılır.</p>
    </div>
  );
}
