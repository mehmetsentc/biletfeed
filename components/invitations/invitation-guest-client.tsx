'use client';

import Link from 'next/link';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { TicketQR } from '@/components/tickets/ticket-qr';

type InvitationData = {
  guestName: string;
  personalMessage: string | null;
  ticketCode: string;
  ticketStatus: string;
  ticketTypeName: string;
  event: {
    title: string;
    coverImage: string;
    startDate: string;
    venue: string;
    city: string;
    slug: string;
  };
  qrData: string;
  inviteUrl: string;
};

export function InvitationGuestClient({
  invitation
}: {
  invitation: InvitationData;
}) {
  const eventDate = new Date(invitation.event.startDate).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const eventTime = new Date(invitation.event.startDate).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isValid = invitation.ticketStatus === 'VALID';

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #0c1017 0%, #111827 50%, #0c1017 100%)' }}
    >
      <div className="mx-auto max-w-md">

        {/* Wordmark */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block text-lg font-bold tracking-tight text-white">
            bilet<span style={{ color: '#f5a623' }}>feed</span>
          </Link>
        </div>

        {/* Main card */}
        <div
          className="overflow-hidden rounded-3xl shadow-2xl"
          style={{ border: '1px solid rgba(245,166,35,0.2)', background: '#13191f' }}
        >
          {/* Cover image with gradient overlay */}
          {invitation.event.coverImage && (
            <div className="relative h-52 overflow-hidden">
              <img
                src={invitation.event.coverImage}
                alt={invitation.event.title}
                className="h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(19,25,31,0) 30%, rgba(19,25,31,0.95) 100%)'
                }}
              />
              {/* Davetiye badge over image */}
              <div className="absolute bottom-4 left-5">
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: 'rgba(245,166,35,0.2)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.4)' }}
                >
                  ✦ Davetiye
                </span>
              </div>
            </div>
          )}

          {/* Gold top stripe (shown when no image) */}
          {!invitation.event.coverImage && (
            <div
              className="flex items-center justify-center py-6"
              style={{ background: 'linear-gradient(135deg, #f5a623, #e09510)' }}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-black">
                ✦ Davetiye
              </span>
            </div>
          )}

          {/* Content */}
          <div className="px-6 pb-8 pt-5">

            {/* Event title + greeting */}
            <h1 className="text-xl font-bold text-white leading-tight">
              {invitation.event.title}
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Sayın{' '}
              <span className="font-semibold text-white">{invitation.guestName}</span>,
              sizi aramızda görmekten mutluluk duyacağız.
            </p>

            {/* Personal message */}
            {invitation.personalMessage && (
              <div
                className="mt-4 rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(245,166,35,0.07)',
                  borderLeft: '3px solid #f5a623'
                }}
              >
                <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  &ldquo;{invitation.personalMessage}&rdquo;
                </p>
              </div>
            )}

            {/* Event details */}
            <div
              className="mt-5 rounded-2xl px-4 py-3 space-y-2.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-start gap-3 text-sm">
                <Calendar
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: '#f5a623' }}
                />
                <div>
                  <span className="text-white">{eventDate}</span>
                  <span className="ml-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {eventTime}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="size-4 shrink-0" style={{ color: '#f5a623' }} />
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {invitation.event.venue}, {invitation.event.city}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Ticket className="size-4 shrink-0" style={{ color: '#f5a623' }} />
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {invitation.ticketTypeName}
                </span>
              </div>
            </div>

            {/* Tear-off divider */}
            <div className="relative my-6">
              <div
                className="absolute -left-6 top-1/2 size-5 -translate-y-1/2 rounded-full"
                style={{ background: '#0c1017' }}
              />
              <div
                className="border-t border-dashed"
                style={{ borderColor: 'rgba(255,255,255,0.12)' }}
              />
              <div
                className="absolute -right-6 top-1/2 size-5 -translate-y-1/2 rounded-full"
                style={{ background: '#0c1017' }}
              />
            </div>

            {/* QR section */}
            <div className="flex flex-col items-center">
              {isValid ? (
                <div
                  className="rounded-2xl bg-white p-4 shadow-lg"
                  style={{ boxShadow: '0 0 40px rgba(245,166,35,0.15)' }}
                >
                  <TicketQR data={invitation.qrData} size={190} />
                </div>
              ) : (
                <div
                  className="flex size-[200px] items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <p className="text-center text-sm px-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Bilet kullanılmış veya geçersiz
                  </p>
                </div>
              )}

              <p
                className="mt-4 font-mono text-base tracking-widest"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              >
                {invitation.ticketCode}
              </p>
              {isValid && (
                <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Girişte bu QR kodu gösterin
                </p>
              )}
            </div>

            {/* CTA button */}
            <Link
              href={`/etkinlik/${invitation.event.slug}`}
              className="mt-7 flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #f5a623, #e09510)' }}
            >
              Etkinlik Detayları
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          biletfeed.com · Güvenli etkinlik ve bilet platformu
        </p>
      </div>
    </div>
  );
}
