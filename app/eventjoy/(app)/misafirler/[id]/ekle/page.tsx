import { EventJoyAddGuestsPage } from '@/components/eventjoy/event-sub-pages';

export default function AddGuestsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  return <EventJoyAddGuestsPage params={params} />;
}
