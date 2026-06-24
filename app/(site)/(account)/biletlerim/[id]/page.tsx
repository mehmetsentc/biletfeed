import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Calendar, Download, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SettingsPageHeader } from '@/components/account/settings-form';
import { getTicketById } from '@/lib/services/tickets';
import { formatEventDate, formatEventTime } from '@/lib/data/mock-events';
import { TicketQR } from '@/components/tickets/ticket-qr';
import { verifySessionCookie } from '@/lib/auth/session';
import { createPageMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const session = await verifySessionCookie();
  const ticket = session ? await getTicketById(id, session.uid) : undefined;
  return createPageMetadata({
    title: ticket?.eventTitle || 'Bilet',
    path: `/biletlerim/${id}`
  });
}

export default async function TicketDetailPage({ params }: Props) {
  const session = await verifySessionCookie();
  if (!session) redirect(`/giris?redirect=/biletlerim`);

  const { id } = await params;
  const ticket = await getTicketById(id, session.uid);
  if (!ticket) notFound();

  const statusLabel =
    ticket.status === 'VALID'
      ? 'Geçerli Bilet'
      : ticket.status === 'USED'
        ? 'Kullanılmış'
        : ticket.status;

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Bilet Detayı"
        description={ticket.eventTitle}
      />

      <div className="mx-auto max-w-lg">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="relative h-40">
            <Image
              src={ticket.eventImage}
              alt={ticket.eventTitle}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant={ticket.status === 'VALID' ? 'success' : 'secondary'}>
                  {statusLabel}
                </Badge>
                <h2 className="mt-2 text-xl font-bold">{ticket.eventTitle}</h2>
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

            {ticket.status === 'VALID' && (
              <div className="my-6 flex justify-center rounded-xl bg-muted/50 p-6">
                <TicketQR data={ticket.qrData} />
              </div>
            )}

            <p className="text-center font-mono text-sm text-muted-foreground">
              {ticket.code}
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              {ticket.ticketType}
            </p>
          </div>
        </div>

        {ticket.validationToken && (
          <Link
            href={`/bilet/${encodeURIComponent(ticket.code)}/print?token=${encodeURIComponent(ticket.validationToken)}&id=${encodeURIComponent(ticket.id)}`}
            target="_blank"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Download className="size-4" />
            Bileti PDF olarak indir
          </Link>
        )}

        <Link
          href="/biletlerim"
          className="mt-4 block text-center text-sm font-medium text-primary hover:underline"
        >
          ← Tüm Biletler
        </Link>
      </div>
    </div>
  );
}
