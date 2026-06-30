'use client';

import Link from 'next/link';
import { brandAssetUrl, brandLogos, brandTheme } from '@/lib/config/brand-theme';
import { TicketQR } from '@/components/tickets/ticket-qr';
import {
  ticketCompanyAddressLine,
  ticketCompanyContactLine,
  ticketCompanyLegalLine,
  ticketTermsEn,
  ticketTermsTr
} from '@/lib/tickets/design/terms';
import type { TicketDocumentData } from '@/lib/tickets/design/types';
import { barcodeToDataUrl } from '@/lib/tickets/design/barcode';
import { cn } from '@/lib/utils';

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary">{label}</p>
      <p className="text-[13px] font-semibold leading-snug text-white">{value}</p>
    </div>
  );
}

export function TicketWebView({
  data,
  ctaHref,
  ctaLabel = 'Etkinlik Detayları',
  footer,
  className
}: {
  data: TicketDocumentData;
  ctaHref?: string;
  ctaLabel?: string;
  footer?: React.ReactNode;
  className?: string;
}) {
  const {
    kind,
    brand = 'biletfeed',
    eventTitle,
    coverImageUrl,
    eventDate,
    eventTime,
    venue,
    city,
    ticketTypeName,
    holderName,
    ticketCode,
    qrData,
    status,
    personalMessage,
    categoryLabel,
    sectorGate
  } = data;

  const isValid = status === 'VALID';
  const isInvitation = kind === 'invitation';
  const kindLabel = isInvitation ? 'Davetiye' : 'Etkinlik Bileti';
  const codeLabel = isInvitation ? 'Davetiye Kodu' : 'Bilet Kodu';
  const barcodeUrl = barcodeToDataUrl(ticketCode, { width: 220, height: 44, barColor: '#ffffff' });

  const gridItems: Array<{ label: string; value: string }> = [
    { label: 'Tarih', value: eventDate },
    { label: 'Saat', value: eventTime },
    { label: 'Mekan', value: `${venue}, ${city}` },
    { label: isInvitation ? 'Davetiye Türü' : 'Bilet Türü', value: ticketTypeName },
    { label: 'Katılımcı', value: holderName }
  ];
  if (categoryLabel) gridItems.splice(3, 0, { label: 'Kategori', value: categoryLabel });
  if (sectorGate) gridItems.push({ label: 'Sektör / Kapı', value: sectorGate });
  if (data.priceLabel) gridItems.push({ label: 'Ücret', value: data.priceLabel });

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-primary/20 bg-[#131920] shadow-2xl',
        className
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-6 py-3.5"
        style={{
          background: `linear-gradient(135deg, ${brandTheme.orange}, ${brandTheme.orangeHover})`
        }}
      >
        {brand === 'eventjoy' ? (
          <span className="text-lg font-extrabold tracking-tight text-black">
            Event<span className="text-[#4a2f00]">Joy</span>
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brandAssetUrl(brandLogos.forDarkSurface)}
            alt="BiletFeed"
            className="h-8 w-auto"
          />
        )}
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-black">
          {isInvitation ? '✦ ' : ''}
          {kindLabel}
        </span>
      </div>

      {coverImageUrl && (
        <div className="relative h-44 sm:h-52">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImageUrl} alt={eventTitle} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131920] via-transparent to-transparent" />
        </div>
      )}

      <div className="p-6">
        {isInvitation && (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-primary">
            Sayın Davetli
          </p>
        )}

        <div className="flex items-start justify-between gap-3">
          <h1 className="flex-1 text-xl font-bold leading-tight text-white sm:text-2xl">{eventTitle}</h1>
          <span
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-[11px] font-bold',
              isValid
                ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                : 'border border-red-400/30 bg-red-400/10 text-red-400'
            )}
          >
            {isValid ? '✓ Geçerli' : 'Geçersiz'}
          </span>
        </div>

        <p className="mt-2 text-sm text-white/60">
          {isInvitation ? (
            <>
              <span className="font-semibold text-white">{holderName}</span> adına düzenlenmiştir.
            </>
          ) : (
            <>
              Sayın <span className="font-semibold text-white">{holderName}</span>
            </>
          )}
        </p>

        {personalMessage && (
          <div
            className="mt-4 rounded-xl border-l-[3px] border-primary px-4 py-3"
            style={{ background: brandTheme.orangeSoft }}
          >
            <p className="text-sm italic leading-relaxed text-white/70">
              &ldquo;{personalMessage}&rdquo;
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {gridItems.map(({ label, value }) => (
            <InfoCell key={label} label={label} value={value} />
          ))}
        </div>

        <div className="relative my-6">
          <div className="absolute -left-6 top-1/2 size-5 -translate-y-1/2 rounded-full bg-[#0c1017]" />
          <div className="border-t border-dashed border-primary/25" />
          <div className="absolute -right-6 top-1/2 size-5 -translate-y-1/2 rounded-full bg-[#0c1017]" />
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {isValid && qrData ? (
            <div
              className="shrink-0 rounded-2xl bg-white p-4 shadow-lg"
              style={{ boxShadow: `0 0 40px ${brandTheme.orangeSoft}` }}
            >
              <TicketQR data={qrData} size={180} />
            </div>
          ) : (
            <div className="flex size-[188px] shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <p className="px-4 text-center text-sm text-white/40">Bilet geçersiz veya kullanılmış</p>
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{codeLabel}</p>
            <p className="mt-1 font-mono text-lg font-extrabold tracking-widest text-white sm:text-xl">
              {ticketCode}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={barcodeUrl}
              alt=""
              width={220}
              height={44}
              className="mx-auto mt-3 block max-w-full sm:mx-0"
            />
            <p className="mt-3 text-xs leading-relaxed text-white/40">
              {isInvitation
                ? 'Girişte bu QR kodu veya davetiye kodunu gösterin.'
                : 'Girişte bu QR kodu veya bilet kodunu gösterin. Bilet yalnızca bir kez kullanılabilir.'}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-white/[0.08] pt-4">
          <p className="text-[10px] leading-relaxed text-white/40">{ticketTermsTr(kind)}</p>
          <p className="mt-1 text-[9px] italic leading-relaxed text-white/25">{ticketTermsEn(kind)}</p>
          <p className="mt-3 text-[9px] leading-relaxed text-white/25">{ticketCompanyLegalLine()}</p>
          <p className="text-[9px] text-white/25">{ticketCompanyContactLine()}</p>
        </div>

        {ctaHref && (
          <Link
            href={ctaHref}
            className="no-print mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {ctaLabel}
          </Link>
        )}

        {footer}
      </div>
    </div>
  );
}
