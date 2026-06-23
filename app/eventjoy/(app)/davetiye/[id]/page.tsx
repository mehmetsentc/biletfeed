'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Copy, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEventJoy } from '@/components/providers/eventjoy-provider';

export default function InvitationPage() {
  const params = useParams();
  const id = params.id as string;
  const { ready, getEvent } = useEventJoy();
  const event = getEvent(id);
  const [copied, setCopied] = useState(false);
  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/eventjoy/davetiye/${id}`
      : `/eventjoy/davetiye/${id}`;

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted mx-4" />;
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

  const formattedDate = new Date(event.date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/eventjoy/etkinlik/${id}`}
          className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-lg font-bold">Davetiye</h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {event.coverImage && (
          <img
            src={event.coverImage}
            alt=""
            className="aspect-video w-full object-cover"
          />
        )}
        <div className="p-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            {event.type}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">{event.title}</h2>
          <p className="mt-3 text-muted-foreground">
            {formattedDate} · {event.time}
          </p>
          {event.location && (
            <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>
          )}
          {event.description && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={copyLink}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Kopyalandı' : 'Linki Kopyala'}
        </Button>
        <Button variant="outline" className="gap-2" asChild>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${event.title} - ${inviteLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Share2 className="size-4" />
            Paylaş
          </a>
        </Button>
      </div>
    </div>
  );
}
