'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Copy, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getEventJoyEvent } from '@/lib/data/mock-eventjoy';

export default function InvitationPage() {
  const params = useParams();
  const id = params.id as string;
  const event = getEventJoyEvent(id);
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
    <div className="space-y-6">
      <Link
        href={`/eventjoy/etkinlik/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Etkinliğe Dön
      </Link>
      <div>
        <h1 className="text-xl font-bold">Davetiye Oluştur</h1>
        <p className="text-sm text-muted-foreground">Misafirlerinize davetiye gönderin</p>
      </div>

      <div
        className={`overflow-hidden rounded-2xl border bg-gradient-to-br ${event.coverColor} p-6 text-white`}
      >
        <p className="text-sm opacity-80">Sizi davet ediyoruz!</p>
        <h2 className="mt-2 text-2xl font-bold">{event.title}</h2>
        <p className="mt-3 text-sm opacity-90">
          {formattedDate} · {event.time}
        </p>
        <p className="text-sm opacity-90">{event.location}</p>
        <Button className="mt-6 w-full bg-white text-foreground hover:bg-white/90">
          Katılacağım
        </Button>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-4">
        <div className="space-y-2">
          <Label>Davet Mesajı</Label>
          <textarea
            className="flex min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
            defaultValue={`Merhaba! ${event.title} etkinliğime davetlisin. Seni görmek isterim! 🎉`}
          />
        </div>
        <div className="space-y-2">
          <Label>Davet Linki</Label>
          <div className="flex gap-2">
            <Input value={inviteLink} readOnly className="text-xs" />
            <Button variant="outline" size="icon" onClick={copyLink}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>
        <Button className="w-full gap-2 rounded-full">
          <Share2 className="size-4" />
          Davetiyeyi Paylaş
        </Button>
      </div>
    </div>
  );
}
