import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Arama',
  description: 'Etkinlik, konser ve festival arayın',
  path: '/ara',
  noIndex: true
});

export default function SearchLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
