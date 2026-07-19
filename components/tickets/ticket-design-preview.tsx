'use client';

import { TicketDocument } from '@/components/tickets/design/ticket-document';
import type { TicketDocumentData } from '@/lib/tickets/design/types';

type MockData = {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  city: string;
  ticketTypeName: string;
  holderName: string;
  ticketCode: string;
  orderNumber: string;
  categoryLabel: string;
  sectorGate: string;
  personalMessage: string;
  inviteUrl: string;
};

export function TicketDesignPreview({
  mock,
  logoSrc,
  qrInvite,
  qrTicket,
  invitationEmailHtml,
  purchaseEmailHtml
}: {
  mock: MockData;
  logoSrc: string;
  qrInvite: string;
  qrTicket: string;
  invitationEmailHtml: string;
  purchaseEmailHtml: string;
}) {
  const invitationDoc: TicketDocumentData = {
    kind: 'invitation',
    eventTitle: mock.eventTitle,
    eventDate: mock.eventDate,
    eventTime: mock.eventTime,
    venue: mock.venue,
    city: mock.city,
    ticketTypeName: mock.ticketTypeName,
    holderName: mock.holderName,
    ticketCode: mock.ticketCode,
    qrDataUrl: qrInvite,
    status: 'VALID',
    personalMessage: mock.personalMessage,
    categoryLabel: mock.categoryLabel,
    sectorGate: mock.sectorGate,
    inviteUrl: mock.inviteUrl
  };

  const ticketDoc: TicketDocumentData = {
    kind: 'ticket',
    eventTitle: mock.eventTitle,
    eventDate: mock.eventDate,
    eventTime: mock.eventTime,
    venue: mock.venue,
    city: mock.city,
    ticketTypeName: mock.ticketTypeName,
    holderName: mock.holderName,
    ticketCode: mock.ticketCode,
    qrDataUrl: qrTicket,
    status: 'VALID',
    categoryLabel: mock.categoryLabel,
    sectorGate: mock.sectorGate,
    orderNumber: mock.orderNumber
  };

  return (
    <div className="min-h-screen bg-zinc-100 py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--bf-accent-ink)]">Önizleme — henüz yayında değil</p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">Bilet &amp; Davetiye Tasarımı</h1>
          <p className="mt-2 text-sm text-zinc-600">
            BiletFeed marka renkleri (#FF8A00) ve logo. Onayınızdan sonra deploy edilecek.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800">PDF / İndirilebilir Bilet</h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <TicketDocument data={ticketDoc} rootId="preview-ticket" logoSrc={logoSrc} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800">PDF / İndirilebilir Davetiye</h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <TicketDocument data={invitationDoc} rootId="preview-invitation" logoSrc={logoSrc} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800">E-posta — Bilet Satın Alma</h2>
          <div className="overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
            <iframe
              title="Bilet e-posta önizleme"
              srcDoc={purchaseEmailHtml}
              className="h-[900px] w-full border-0 bg-zinc-900"
              sandbox=""
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800">E-posta — Davetiye</h2>
          <div className="overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
            <iframe
              title="Davetiye e-posta önizleme"
              srcDoc={invitationEmailHtml}
              className="h-[900px] w-full border-0 bg-zinc-900"
              sandbox=""
            />
          </div>
        </section>
      </div>
    </div>
  );
}
