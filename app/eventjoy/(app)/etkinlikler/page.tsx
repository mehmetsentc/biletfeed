import { EventJoyEventsList } from '@/components/eventjoy/events-list';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Etkinliklerim',
  description: 'EventJoy ile planladığınız tüm etkinlikler.',
  path: '/eventjoy/etkinlikler'
});

export default function EventJoyEventsPage() {
  return <EventJoyEventsList />;
}
