import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Kullanım Koşulları',
  path: '/kosullar'
});

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 prose prose-neutral dark:prose-invert">
      <h1>Kullanım Koşulları</h1>
      <p>Platformumuzu kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.</p>
      <h2>Hizmet Kapsamı</h2>
      <p>Platform, etkinlik keşfi ve bilet satın alma hizmetleri sunar. EventJoy ile küçük etkinlik planlama araçları sağlanır.</p>
      <h2>Bilet İptali</h2>
      <p>Bilet iptal koşulları etkinlik organizatörüne göre değişiklik gösterebilir.</p>
    </div>
  );
}
