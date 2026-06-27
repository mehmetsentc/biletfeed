import { EventJoyMessagesList } from '@/components/eventjoy/messages-list';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Mesajlar',
  description: 'EventJoy misafir mesajları ve iletişim.',
  path: '/eventjoy/mesajlar'
});

export default function MessagesPage() {
  return <EventJoyMessagesList />;
}
