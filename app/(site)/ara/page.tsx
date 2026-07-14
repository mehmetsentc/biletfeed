import { getAllEvents } from '@/lib/services/events';
import { SearchPageClient } from './search-page-client';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Etkinlik Ara',
  description:
    'İstanbul, Ankara, İzmir ve tüm Türkiye genelindeki konser, festival, tiyatro ve daha fazla etkinliği arayın. Sanatçı, mekan veya tarihe göre filtreleyin.',
  path: '/ara',
  keywords: ['etkinlik ara', 'konser ara', 'festival ara', 'bilet ara', 'etkinlik bul']
});

export default async function SearchPage() {
  const events = await getAllEvents();
  return <SearchPageClient events={events} />;
}
