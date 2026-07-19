'use client';

import Link from 'next/link';
import { TicketQR } from '@/components/tickets/ticket-qr';
import { TicketDownloadButton } from '@/components/tickets/ticket-download-button';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PurchaseSuccessTicketProps {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  city: string;
  category?: string;
  ticketTypeName: string;
  holderName: string;
  ticketCode: string;
  qrData: string;
  ticketId: string;
  validationToken: string;
  eventSlug: string;
  className?: string;
  mode?: 'success' | 'view';
}

export function PurchaseSuccessTicket({
  eventTitle,
  eventDate,
  eventTime,
  venue,
  city,
  category,
  ticketTypeName,
  holderName,
  ticketCode,
  qrData,
  ticketId,
  validationToken,
  eventSlug,
  className,
  mode = 'success'
}: PurchaseSuccessTicketProps) {
  const gridItems = [
    { label: 'Tarih', value: eventDate },
    { label: 'Saat', value: eventTime },
    { label: 'Mekan', value: `${venue}, ${city}` },
    ...(category ? [{ label: 'Kategori', value: category }] : []),
    { label: 'Bilet Türü', value: ticketTypeName },
    { label: 'Katılımcı', value: holderName }
  ];

  return (
    <div
      className={cn(
        'min-h-screen bg-primary px-4 py-8 md:py-12',
        className
      )}
    >
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brandAssetUrl(brandLogos.forDarkSurface)}
            alt="BiletFeed"
            className="mx-auto h-8 w-auto"
          />
          {mode === 'success' ? (
            <>
              <h1 className="mt-4 text-xl font-bold text-white">Biletiniz Hazır!</h1>
              <p className="mt-1 text-sm text-white/80">
                Girişte QR kodunuzu veya bilet kodunuzu gösterin.
              </p>
            </>
          ) : (
            <h1 className="mt-4 text-xl font-bold text-white">Etkinlik Biletiniz</h1>
          )}
        </div>

        <article className="overflow-hidden rounded-2xl bg-card text-card-foreground shadow-2xl">
          <div className="border-b border-border px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--bf-accent-ink)]">
              Etkinlik Bileti
            </p>
            <h2 className="mt-1 text-lg font-extrabold leading-snug text-foreground">
              {eventTitle}
            </h2>
          </div>

          <div className="flex flex-col items-center px-6 py-8">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-md">
              <TicketQR data={qrData} size={200} />
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Bilet Kodu
            </p>
            <p className="mt-1 font-mono text-2xl font-extrabold tracking-widest text-foreground">
              {ticketCode}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 border-t border-border bg-muted/30 px-4 py-4 sm:grid-cols-3">
            {gridItems.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--bf-accent-ink)]">
                  {label}
                </p>
                <p className="mt-0.5 text-xs font-semibold leading-snug text-foreground">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-border px-4 py-4">
            <TicketDownloadButton
              ticketCode={ticketCode}
              ticketId={ticketId}
              validationToken={validationToken}
            />
            <Link
              href={`/bilet/${encodeURIComponent(ticketCode)}?token=${encodeURIComponent(validationToken)}&id=${encodeURIComponent(ticketId)}`}
              className="block text-center text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Bilet sayfasını aç
            </Link>
          </div>
        </article>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            variant="secondary"
            className="h-12 flex-1 rounded-xl bg-card font-bold text-[var(--bf-accent-ink)] hover:bg-card/90"
          >
            <Link href="/biletlerim">Biletlerim</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 flex-1 rounded-xl border-white/40 bg-transparent font-bold text-white hover:bg-white/10 hover:text-white"
          >
            <Link href={`/etkinlik/${eventSlug}`}>Etkinlik Detayı</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
