import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Ticket, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { TicketQR } from '@/components/tickets/ticket-qr';
import { TicketDownloadButton } from '@/components/tickets/ticket-download-button';
import { getPublicTicketByCode } from '@/lib/services/tickets';

interface Props {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string; id?: string }>;
}

export default async function PublicTicketPage({ params, searchParams }: Props) {
  const { code } = await params;
  const { token = '', id = '' } = await searchParams;

  const ticketCode = decodeURIComponent(code);
  const validationToken = decodeURIComponent(token);
  const ticketId = decodeURIComponent(id);

  if (!validationToken || !ticketId) notFound();

  const ticket = await getPublicTicketByCode(ticketCode, validationToken, ticketId);
  if (!ticket) notFound();

  // If this is an invitation redirect to the invitation page for richer view
  if (ticket.isInvitation && ticket.inviteToken) {
    const { redirect } = await import('next/navigation');
    redirect(`/davetiye/${ticket.inviteToken}`);
  }

  const eventDate = new Date(ticket.event.startDate).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const statusConfig = {
    VALID: {
      label: 'Bilet Geçerli',
      sublabel: 'Girişte bu QR kodu gösterin',
      icon: CheckCircle2,
      color: 'text-[var(--bf-success)]',
      bg: 'bg-[var(--bf-success-soft)] border-[var(--bf-success)]/30'
    },
    USED: {
      label: 'Bilet Kullanıldı',
      sublabel: 'Bu bilet daha önce taratılmış',
      icon: Clock,
      color: 'text-[var(--bf-warning)]',
      bg: 'bg-[var(--bf-warning-soft)] border-[var(--bf-warning)]/30'
    },
    CANCELLED: {
      label: 'Bilet İptal Edildi',
      sublabel: 'Bu bilet artık geçerli değil',
      icon: XCircle,
      color: 'text-[var(--bf-danger)]',
      bg: 'bg-[var(--bf-danger-soft)] border-[var(--bf-danger)]/30'
    },
    REFUNDED: {
      label: 'Bilet İade Edildi',
      sublabel: 'Bu bilet iade işlemi yapılmış',
      icon: XCircle,
      color: 'text-[var(--bf-danger)]',
      bg: 'bg-[var(--bf-danger-soft)] border-[var(--bf-danger)]/30'
    }
  };

  const s = statusConfig[ticket.status as keyof typeof statusConfig] ?? statusConfig.VALID;
  const StatusIcon = s.icon;
  const isValid = ticket.status === 'VALID';

  return (
    <div className="min-h-screen bg-ticket-page px-4 py-10">
      <div className="mx-auto max-w-lg">

        {/* Header */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block text-xl font-bold text-white tracking-tight">
            bilet<span className="text-primary">feed</span>
          </Link>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-ticket-card shadow-2xl">

          {/* Event cover */}
          {ticket.event.coverImage && (
            <div className="relative">
              <img
                src={ticket.event.coverImage}
                alt={ticket.event.title}
                className="aspect-video w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ticket-card-bg)] via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6">
            {/* Status badge */}
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${s.bg}`}>
              <StatusIcon className={`size-5 shrink-0 ${s.color}`} />
              <div>
                <p className={`font-semibold ${s.color}`}>{s.label}</p>
                <p className="text-xs text-white/50">{s.sublabel}</p>
              </div>
            </div>

            {/* Event info */}
            <h1 className="mt-5 text-xl font-bold text-white">{ticket.event.title}</h1>
            <p className="mt-1 text-sm text-white/60">
              Sayın <span className="text-white font-medium">{ticket.holderName}</span>
            </p>

            <div className="mt-4 space-y-2 text-sm text-white/60">
              <p className="flex items-center gap-2">
                <Calendar className="size-4 shrink-0 text-primary" />
                {eventDate}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-primary" />
                {ticket.event.venue}, {ticket.event.city}
              </p>
              <p className="flex items-center gap-2">
                <Ticket className="size-4 shrink-0 text-primary" />
                {ticket.ticketTypeName}
              </p>
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-dashed border-white/10" />

            {/* QR code */}
            <div className="flex flex-col items-center">
              {isValid ? (
                <div className="rounded-2xl bg-white p-5 shadow-lg">
                  <TicketQR data={ticket.qrData} size={200} />
                </div>
              ) : (
                <div className="flex size-[210px] items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <p className="text-center text-sm text-white/40 px-4">{s.sublabel}</p>
                </div>
              )}
              <p className="mt-4 font-mono text-base tracking-widest text-white/80">
                {ticket.ticketCode}
              </p>
              {isValid && (
                <p className="mt-1 text-xs text-white/40">Girişte bu kodu gösterin</p>
              )}
            </div>

            {/* Footer link */}
            <Link
              href={`/etkinlik/${ticket.event.slug}`}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors no-print"
            >
              Etkinlik Detayları
            </Link>

            {/* PDF download button */}
            <TicketDownloadButton
              ticketCode={ticket.ticketCode}
              ticketId={ticketId}
              validationToken={validationToken}
            />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/30 no-print">
          biletfeed.com · Güvenli bilet sistemi
        </p>
      </div>

      {/* Print CSS — inline style tag allowed in Server Components */}
      <style>{`
        @media print {
          body { background: var(--ticket-page-bg) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          nav, footer, header { display: none !important; }
        }
      `}</style>
    </div>
  );
}
