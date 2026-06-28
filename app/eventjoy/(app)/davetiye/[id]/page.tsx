'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EventJoyInvitationShare } from '@/components/eventjoy/invitation-share-panel';
import { useEventJoy } from '@/components/providers/eventjoy-provider';

export default function InvitationPage() {
  const params = useParams();
  const id = params.id as string;
  const { ready, getEvent } = useEventJoy();
  const event = getEvent(id);

  if (!ready) {
    return <div className="mx-4 h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (!event) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Etkinlik bulunamadı.</p>
        <Link href="/eventjoy/panel">
          <Button className="mt-4">Panele Dön</Button>
        </Link>
      </div>
    );
  }

  return <EventJoyInvitationShare event={event} />;
}
