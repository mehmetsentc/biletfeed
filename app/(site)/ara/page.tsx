import { getAllEvents } from '@/lib/services/events';
import { SearchPageClient } from './search-page-client';

export default async function SearchPage() {
  const events = await getAllEvents();
  return <SearchPageClient events={events} />;
}
