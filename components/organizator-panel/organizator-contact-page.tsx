'use client';

import { Mail, Phone } from 'lucide-react';
import { platformContact } from '@/lib/config/contact';
import { WhatsAppQr } from '@/components/organizator-panel/whatsapp-qr';
import { ContactCenter } from '@/components/organizator-panel/contact-center';

type TicketRow = {
  id: string;
  subject: string;
  body: string;
  status: string;
  reply: string | null;
  createdAt: string;
};

export function OrganizatorContactPage({
  initialTickets
}: {
  initialTickets: TicketRow[];
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-800">İletişim</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Bizimle iletişime geçmek için gerekli tüm bilgilere buradan ulaşabilirsiniz.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-100 px-5 py-3">
          <p className="text-sm font-semibold text-zinc-700">
            {platformContact.companyName}
          </p>
        </div>

        <div className="grid gap-8 p-6 md:grid-cols-[auto_1fr] md:items-start">
          <div className="flex flex-col items-center gap-4 sm:flex-row md:flex-col">
            <a
              href={platformContact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 transition-opacity hover:opacity-90"
              aria-label="WhatsApp destek hattı"
            >
              <WhatsAppQr url={platformContact.whatsappUrl} />
            </a>
            <div className="text-center sm:text-left md:text-center">
              <p className="text-sm font-medium text-zinc-800">
                WhatsApp Destek Hattı
              </p>
              <a
                href={platformContact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-[#f5a623] hover:underline"
              >
                Mesaj gönder
              </a>
            </div>
          </div>

          <div className="space-y-5 border-t border-zinc-100 pt-6 md:border-t-0 md:pt-0">
            <a
              href={`mailto:${platformContact.email}`}
              className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-zinc-50"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <Mail className="size-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">E-posta</p>
                <p className="font-medium text-zinc-800">{platformContact.email}</p>
              </div>
            </a>

            <a
              href={`tel:+${platformContact.phoneE164}`}
              className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-zinc-50"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <Phone className="size-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Telefon</p>
                <p className="font-medium text-zinc-800">{platformContact.phone}</p>
              </div>
            </a>

            <p className="text-xs text-zinc-500">
              Destek saatleri: {platformContact.supportHours}
            </p>
          </div>
        </div>
      </div>

      <ContactCenter initialTickets={initialTickets} />
    </div>
  );
}
