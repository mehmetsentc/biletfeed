import { EventJoyGuestListPage } from '@/components/eventjoy/guest-list-page';

export default function GuestListPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  return <EventJoyGuestListPage params={params} />;
}
