'use client';

import Link from 'next/link';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { TicketQR } from '@/components/tickets/ticket-qr';
import { Button } from '@/components/ui/button';

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
  const eventDate = new Date(invitation.event.startDate).toLocaleDateString(
    'tr-TR',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  );

  const isValid = invitation.ticketStatus === 'VALID';

  return (
    <div className="min-h-screen bg-[#0c1017] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#151b24] shadow-2xl">
          {invitation.event.coverImage && (
            <img
              src={invitation.event.coverImage}
              alt=""
              className="aspect-video w-full object-cover"
            />
          )}

          <div className="p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f5a623]">
              Davetiye
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">
              {invitation.event.title}
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Sayın <span className="font-medium text-white">{invitation.guestName}</span>,
              sizi aramızda görmekten mutluluk duyarız.
            </p>

            {invitation.personalMessage && (
              <p className="mt-4 rounded-lg bg-white/5 p-4 text-sm italic text-white/80">
                “{invitation.personalMessage}”
              </p>
            )}

            <div className="mt-5 space-y-2 text-sm text-white/70">
              <p className="flex items-center justify-center gap-2">
                <Calendar className="size-4 text-[#f5a623]" />
                {eventDate}
              </p>
              <p className="flex items-center justify-center gap-2">
                <MapPin className="size-4 text-[#f5a623]" />
                {invitation.event.venue}, {invitation.event.city}
              </p>
              <p className="flex items-center justify-center gap-2">
                <Ticket className="size-4 text-[#f5a623]" />
                {invitation.ticketTypeName}
              </p>
            </div>

            <div className="mt-8 inline-block rounded-2xl bg-white p-5">
              {isValid ? (
                <TicketQR data={invitation.qrData} size={200} />
              ) : (
                <div className="flex size-[200px] items-center justify-center text-sm text-zinc-500">
                  Bilet kullanılmış veya geçersiz
                </div>
              )}
            </div>

            <p className="mt-4 font-mono text-sm text-white/80">
              {invitation.ticketCode}
            </p>
            <p className="mt-2 text-xs text-white/50">
              Girişte bu QR kodu gösterin
            </p>

            <Button asChild className="mt-6 w-full bg-[#f5a623] hover:bg-[#e09510]">
              <Link href={`/etkinlik/${invitation.event.slug}`}>
                Etkinlik Detayları
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
