import { EventJoyPanelHome } from '@/components/eventjoy/panel-home';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'EventJoy Panel',
  description: 'Etkinliklerinizi planlayın, misafir yanıtlarını takip edin.',
  path: '/eventjoy/panel'
});

export default function EventJoyHomePage() {
  return <EventJoyPanelHome />;
}
