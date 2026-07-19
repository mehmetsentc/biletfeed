'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, QrCode, Search } from 'lucide-react';
import { AccountProfileTabs } from '@/components/account/account-profile-tabs';
import { useTranslations } from '@/components/providers';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatEventDate } from '@/lib/data/mock-events';
import type { MockPurchasedTicket } from '@/lib/data/mock-user';
import { cn } from '@/lib/utils';

type TicketTab = 'active' | 'past' | 'refunds' | 'invitations' | 'transferred';

function statusLabel(
  ticket: MockPurchasedTicket,
  isPast: boolean,
  t: ReturnType<typeof useTranslations>
): string {
  if (ticket.status === 'REFUNDED') return t.tickets.status.REFUNDED;
  if (ticket.status === 'CANCELLED') return t.tickets.cancelledShort;
  if (ticket.status === 'USED') return t.tickets.status.USED;
  if (ticket.status === 'VALID') return isPast ? t.tickets.expired : t.tickets.status.VALID;
  return ticket.status;
}

function filterTickets(
  tickets: MockPurchasedTicket[],
  tab: TicketTab,
  search: string,
  transferTicketIds: Set<string>
): MockPurchasedTicket[] {
  const now = Date.now();
  const q = search.trim().toLowerCase();

  let filtered: MockPurchasedTicket[];
  switch (tab) {
    case 'active':
      filtered = tickets.filter(
        (ticket) =>
          !transferTicketIds.has(ticket.id) &&
          (ticket.status === 'VALID' || ticket.status === 'USED') &&
          new Date(ticket.eventEndDate ?? ticket.eventDate).getTime() >= now
      );
      break;
    case 'past':
      filtered = tickets.filter(
        (ticket) =>
          ticket.status === 'USED' ||
          (ticket.status !== 'CANCELLED' &&
            ticket.status !== 'REFUNDED' &&
            new Date(ticket.eventEndDate ?? ticket.eventDate).getTime() < now)
      );
      break;
    case 'invitations':
      filtered = tickets.filter((ticket) => ticket.isInvitation);
      break;
    case 'transferred':
      filtered = tickets.filter((ticket) => transferTicketIds.has(ticket.id));
      break;
    case 'refunds':
      filtered = tickets.filter(
        (ticket) => ticket.status === 'REFUNDED' || ticket.status === 'CANCELLED'
      );
      break;
    default:
      filtered = tickets;
  }

  if (!q) return filtered;
  return filtered.filter(
    (t) =>
      t.eventTitle.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.venue.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q)
  );
}

function TicketCard({
  ticket,
  t
}: {
  ticket: MockPurchasedTicket;
  t: ReturnType<typeof useTranslations>;
}) {
  const isPast =
    ticket.status === 'USED' ||
    ticket.status === 'CANCELLED' ||
    ticket.status === 'REFUNDED' ||
    new Date(ticket.eventEndDate ?? ticket.eventDate).getTime() < Date.now();

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
          <div className="flex shrink-0 flex-col items-end gap-1">
            {ticket.isInvitation && (
              <Badge variant="outline" className="text-[10px]">
                {t.tickets.invitationBadge}
              </Badge>
            )}
            <Badge
              variant={
                ticket.status === 'VALID' && !isPast ? 'success' : 'secondary'
              }
            >
              {statusLabel(ticket, isPast, t)}
            </Badge>
          </div>
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
        <p className="mt-2 flex items-center gap-1 text-xs text-[var(--bf-accent-ink)]">
          <QrCode className="size-3" />
          {ticket.code}
        </p>
      </div>
    </Link>
  );
}

export function MyTicketsPageClient({
  tickets,
  transferredTicketIds = []
}: {
  tickets: MockPurchasedTicket[];
  transferredTicketIds?: string[];
}) {
  const t = useTranslations();
  const tabs: { id: TicketTab; label: string }[] = [
    { id: 'active', label: t.tickets.active },
    { id: 'past', label: t.tickets.past },
    { id: 'invitations', label: t.tickets.invitations },
    { id: 'transferred', label: t.tickets.transfers },
    { id: 'refunds', label: t.tickets.refunds }
  ];
  const emptyCopy: Record<TicketTab, { title: string; description: string }> = {
    active: {
      title: t.tickets.noTicketsFound,
      description: t.tickets.emptyActiveDescription
    },
    past: {
      title: t.tickets.emptyPastTitle,
      description: t.tickets.emptyPastDescription
    },
    refunds: {
      title: t.tickets.emptyRefundsTitle,
      description: t.tickets.emptyRefundsDescription
    },
    invitations: {
      title: t.tickets.emptyInvitationsTitle,
      description: t.tickets.emptyInvitationsDescription
    },
    transferred: {
      title: t.tickets.emptyTransfersTitle,
      description: t.tickets.transfersHint
    }
  };
  const [tab, setTab] = useState<TicketTab>('active');
  const [search, setSearch] = useState('');
  const transferSet = useMemo(
    () => new Set(transferredTicketIds),
    [transferredTicketIds]
  );
  const filteredTickets = useMemo(
    () => filterTickets(tickets, tab, search, transferSet),
    [tickets, tab, search, transferSet]
  );
  const empty = emptyCopy[tab];

  return (
    <div className="max-w-6xl">
      <AccountProfileTabs />

      <section className="mt-2 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <h1 className="text-xl font-bold tracking-tight">{t.tickets.title}</h1>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4',
                  tab === item.id
                    ? 'text-[var(--bf-accent-ink)]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-border px-5 py-3 md:px-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.tickets.searchPlaceholder}
              className="pl-9"
            />
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
                  className="mt-5 inline-flex text-sm font-semibold text-[var(--bf-accent-ink)] hover:underline"
                >
                  {t.account.browseEvents}
                </Link>
              )}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {filteredTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} t={t} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
