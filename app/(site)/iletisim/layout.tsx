import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'İletişim',
  description:
    'Sorularınız, önerileriniz ve iş birliği talepleriniz için Bilet Feed ekibiyle iletişime geçin.',
  path: '/iletisim',
  keywords: ['iletişim', 'destek', 'müşteri hizmetleri', 'bilet feed']
});

export default function ContactLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
