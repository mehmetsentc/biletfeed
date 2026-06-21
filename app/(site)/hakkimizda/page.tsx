import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Hakkımızda',
  description: 'Etkinlik keşif platformumuz hakkında bilgi edinin',
  path: '/hakkimizda'
});

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">Hakkımızda</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        Özenle seçilmiş etkinlikleri keşfetmenizi, bilet almanızı ve unutulmaz
        anılar biriktirmenizi sağlayan modern bir etkinlik platformuyuz.
        Konserlerden festivallere, tiyatrodan spor etkinliklerine kadar geniş
        bir yelpazede hizmet veriyoruz.
      </p>
    </div>
  );
}
