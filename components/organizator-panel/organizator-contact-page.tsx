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
        <h1 className="text-2xl font-bold text-foreground">İletişim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bizimle iletişime geçmek için gerekli tüm bilgilere buradan ulaşabilirsiniz.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-secondary px-5 py-3">
          <p className="text-sm font-semibold text-foreground">
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
              <p className="text-sm font-medium text-foreground">
                WhatsApp Destek Hattı
              </p>
              <a
                href={platformContact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-primary hover:underline"
              >
                Mesaj gönder
              </a>
            </div>
          </div>

          <div className="space-y-5 border-t border-border pt-6 md:border-t-0 md:pt-0">
            <a
              href={`mailto:${platformContact.email}`}
              className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-muted"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Mail className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">E-posta</p>
                <p className="font-medium text-foreground">{platformContact.email}</p>
              </div>
            </a>

            <a
              href={`tel:+${platformContact.phoneE164}`}
              className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-muted"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Phone className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefon</p>
                <p className="font-medium text-foreground">{platformContact.phone}</p>
              </div>
            </a>

            <p className="text-xs text-muted-foreground">
              Destek saatleri: {platformContact.supportHours}
            </p>
          </div>
        </div>
      </div>

      <ContactCenter initialTickets={initialTickets} />
    </div>
  );
}
