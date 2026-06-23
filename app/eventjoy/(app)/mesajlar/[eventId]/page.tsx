import { EventJoyChatPage } from '@/components/eventjoy/event-sub-pages';

export default function EventChatPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  return <EventJoyChatPage params={params} />;
}
