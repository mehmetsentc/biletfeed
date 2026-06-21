import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GuestListClient } from '@/components/eventjoy/guest-list-client';
import { getEventJoyEvent } from '@/lib/data/mock-eventjoy';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GuestListPage({ params }: Props) {
  const { id } = await params;
  const event = getEventJoyEvent(id);
  if (!event) notFound();

  return <GuestListClient event={event} />;
}
