'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, QrCode } from 'lucide-react';
import { AccountProfileTabs } from '@/components/account/account-profile-tabs';
import { Badge } from '@/components/ui/badge';
import { formatEventDate } from '@/lib/data/mock-events';
import type { MockPurchasedTicket } from '@/lib/data/mock-user';
import { cn } from '@/lib/utils';

type TicketTab = 'active' | 'past' | 'refunds';

const tabs: { id: TicketTab; label: string }[] = [
  { id: 'active', label: 'Aktif Etkinlikler' },
  { id: 'past', label: 'Geçmiş Etkinlikler' },
  { id: 'refunds', label: 'İade Taleplerim' }
];

const emptyCopy: Record<
  TicketTab,
  { title: string; description: string }
> = {
  active: {
    title: 'Henüz bilet bulunamadı',
    description: 'Etkinliklere göz atıp bilet satın alabilirsiniz.'
  },
  past: {
    title: 'Geçmiş etkinlik bileti yok',
    description: 'Katıldığınız etkinlikler burada listelenir.'
  },
  refunds: {
    title: 'İade talebi bulunamadı',
    description: 'İade sürecindeki biletleriniz burada görünür.'
  }
};

function filterTickets(
  tickets: MockPurchasedTicket[],
  tab: TicketTab
): MockPurchasedTicket[] {
  const now = Date.now();

  switch (tab) {
    case 'active':
      return tickets.filter(
        (ticket) =>
          ticket.status === 'VALID' && new Date(ticket.eventDate).getTime() >= now
      );
    case 'past':
      return tickets.filter(
        (ticket) =>
          ticket.status === 'USED' ||
          (ticket.status !== 'CANCELLED' &&
            new Date(ticket.eventDate).getTime() < now)
      );
    case 'refunds':
      return tickets.filter((ticket) => ticket.status === 'CANCELLED');
    default:
      return tickets;
  }
}

function TicketCard({ ticket }: { ticket: MockPurchasedTicket }) {
  const isPast =
    ticket.status === 'USED' ||
    ticket.status === 'CANCELLED' ||
    new Date(ticket.eventDate).getTime() < Date.now();

  return (
    <Link
      href={`/biletlerim/${ticket.id}`}
      className="flex gap-4 overflow-hidden rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={ticket.eventImage}
          alt={ticket.eventTitle}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">{ticket.eventTitle}</h3>
          <Badge
            variant={
              ticket.status === 'VALID' && !isPast ? 'success' : 'secondary'
            }
          >
            {ticket.status === 'VALID'
              ? isPast
                ? 'Süresi Doldu'
                : 'Geçerli'
              : ticket.status === 'USED'
                ? 'Kullanıldı'
                : 'İptal'}
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
  );
}

export function MyTicketsPageClient({
  tickets
}: {
  tickets: MockPurchasedTicket[];
}) {
  const [tab, setTab] = useState<TicketTab>('active');
  const filteredTickets = useMemo(
    () => filterTickets(tickets, tab),
    [tickets, tab]
  );
  const empty = emptyCopy[tab];

  return (
    <div className="max-w-6xl">
      <AccountProfileTabs />

      <section className="mt-2 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <h1 className="text-xl font-bold tracking-tight">Biletlerim</h1>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4',
                  tab === item.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-14 md:px-6 md:py-20">
          {filteredTickets.length === 0 ? (
            <div className="mx-auto max-w-md text-center">
              <p className="text-lg font-semibold text-foreground/90">
                {empty.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {empty.description}
              </p>
              {tab === 'active' && (
                <Link
                  href="/etkinlikler"
                  className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline"
                >
                  Etkinliklere Göz At
                </Link>
              )}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {filteredTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
