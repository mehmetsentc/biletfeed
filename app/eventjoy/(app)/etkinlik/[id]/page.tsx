import { EventJoyDetailPage } from '@/components/eventjoy/event-detail';

export default function EventDetailRoute({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  return <EventJoyDetailPage params={params} />;
}
