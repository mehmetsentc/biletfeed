import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, QrCode, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockPurchasedTickets } from '@/lib/data/mock-user';
import { formatEventDate } from '@/lib/data/mock-events';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Biletlerim',
  path: '/biletlerim'
});

export default function MyTicketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Biletlerim</h1>
        <p className="text-muted-foreground">Satın aldığınız biletler</p>
      </div>
      <div className="max-w-3xl space-y-4">
        {mockPurchasedTickets.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Henüz biletiniz yok.</p>
            <Link href="/etkinlikler">
              <Button className="mt-4">Etkinlikleri Keşfet</Button>
            </Link>
          </div>
        ) : (
          mockPurchasedTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/biletlerim/${ticket.id}`}
              className="flex gap-4 overflow-hidden rounded-2xl border bg-card p-4 transition-all hover:shadow-lg"
            >
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={ticket.eventImage}
                  alt={ticket.eventTitle}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{ticket.eventTitle}</h3>
                  <Badge variant={ticket.status === 'VALID' ? 'success' : 'secondary'}>
                    {ticket.status === 'VALID' ? 'Geçerli' : ticket.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{ticket.ticketType}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatEventDate(ticket.eventDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {ticket.venue}, {ticket.city}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1 text-xs text-primary">
                  <QrCode className="size-3" />
                  {ticket.code}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
