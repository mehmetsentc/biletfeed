import { notFound } from 'next/navigation';
import { AddGuestsClient } from '@/components/eventjoy/add-guests-client';
import { getEventJoyEvent } from '@/lib/data/mock-eventjoy';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AddGuestsPage({ params }: Props) {
  const { id } = await params;
  const event = getEventJoyEvent(id);
  if (!event) notFound();

  return <AddGuestsClient eventId={id} />;
}
