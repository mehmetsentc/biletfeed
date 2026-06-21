import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Download, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTicketById } from '@/lib/data/mock-user';
import { formatEventDate, formatEventTime } from '@/lib/data/mock-events';
import { TicketQR } from '@/components/tickets/ticket-qr';
import { createPageMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const ticket = getTicketById(id);
  return createPageMetadata({
    title: ticket?.eventTitle || 'Bilet',
    path: `/biletlerim/${id}`
  });
}

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params;
  const ticket = getTicketById(id);
  if (!ticket) notFound();

  return (
    <div className="container mx-auto max-w-lg px-4 py-10">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-xl">
        <div className="relative h-40">
          <Image src={ticket.eventImage} alt={ticket.eventTitle} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="success">Geçerli Bilet</Badge>
              <h1 className="mt-2 text-xl font-bold">{ticket.eventTitle}</h1>
            </div>
            <p className="text-lg font-bold text-primary">{ticket.price} ₺</p>
          </div>

          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Calendar className="size-4" />
              {formatEventDate(ticket.eventDate)} · {formatEventTime(ticket.eventDate)}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="size-4" />
              {ticket.venue}, {ticket.city}
            </p>
          </div>

          <div className="my-6 flex justify-center rounded-2xl bg-muted/50 p-6">
            <TicketQR data={ticket.qrData} />
          </div>

          <p className="text-center font-mono text-sm text-muted-foreground">
            {ticket.code}
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {ticket.ticketType}
          </p>

          <div className="mt-6 flex gap-2">
            <Button variant="outline" className="flex-1 gap-2">
              <Download className="size-4" />
              İndir
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <Share2 className="size-4" />
              Paylaş
            </Button>
          </div>
        </div>
      </div>
      <Link href="/biletlerim" className="mt-6 block text-center text-sm text-primary">
        ← Tüm Biletler
      </Link>
    </div>
  );
}
