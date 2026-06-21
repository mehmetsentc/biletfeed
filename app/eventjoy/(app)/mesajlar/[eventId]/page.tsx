import { notFound } from 'next/navigation';
import { MessageChatClient } from '@/components/eventjoy/message-chat-client';
import { getEventJoyEvent } from '@/lib/data/mock-eventjoy';

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function MessageChatPage({ params }: Props) {
  const { eventId } = await params;
  const event = getEventJoyEvent(eventId);
  if (!event) notFound();

  return <MessageChatClient event={event} />;
}
