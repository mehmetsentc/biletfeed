'use client';

import Link from 'next/link';
import { useTranslations } from '@/components/providers';
import { brandAssetUrl, brandLogos, brandTheme } from '@/lib/config/brand-theme';
import { TicketQR } from '@/components/tickets/ticket-qr';
import {
  ticketCompanyContactLine,
  ticketCompanyLegalLine,
  ticketTermsEn,
  ticketTermsTr
} from '@/lib/tickets/design/terms';
import type { TicketDocumentData } from '@/lib/tickets/design/types';
import { barcodeToDataUrl } from '@/lib/tickets/design/barcode';
import { cn } from '@/lib/utils';

function InfoCell({
  label,
  value,
  surface
}: {
  label: string;
  value: string;
  surface: 'dark' | 'light';
}) {
  if (surface === 'light') {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--bf-accent-ink)]">{label}</p>
        <p className="text-[13px] font-semibold leading-snug break-words text-zinc-900">{value}</p>
      </div>
    );
  }
  return (
    <div className="rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--bf-accent-ink)]">{label}</p>
      <p className="text-[13px] font-semibold leading-snug break-words text-white">{value}</p>
    </div>
  );
}

export function TicketWebView({
  data,
  ctaHref,
  ctaLabel,
  footer,
  className,
  surface = 'dark'
}: {
  data: TicketDocumentData;
  ctaHref?: string;
  ctaLabel?: string;
  footer?: React.ReactNode;
  className?: string;
  /** dark: mevcut koyu kart; light: BiletFeed beyaz bilet kartı */
  surface?: 'dark' | 'light';
}) {
  const t = useTranslations();
  const resolvedCtaLabel = ctaLabel ?? t.tickets.eventDetails;
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
  const kindLabel = isInvitation ? t.tickets.invitation : t.tickets.eventTicket;
  const codeLabel = isInvitation ? t.tickets.invitationCode : t.tickets.ticketCode;
  const barcodeUrl = barcodeToDataUrl(ticketCode, { width: 220, height: 44, barColor: '#ffffff' });

  const gridItems: Array<{ label: string; value: string }> = [
    { label: t.events.date, value: eventDate },
    { label: t.events.time, value: eventTime },
    { label: t.events.venue, value: `${venue}, ${city}` },
    {
      label: isInvitation ? t.tickets.invitationType : t.tickets.ticketType,
      value: ticketTypeName
    },
    { label: t.tickets.participant, value: holderName }
  ];
  if (categoryLabel) gridItems.splice(3, 0, { label: t.tickets.category, value: categoryLabel });
  if (sectorGate) gridItems.push({ label: t.tickets.sectorGate, value: sectorGate });
  if (data.priceLabel) gridItems.push({ label: t.tickets.fee, value: data.priceLabel });

  const isLight = surface === 'light';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl shadow-2xl',
        isLight
          ? 'border border-zinc-200 bg-white shadow-orange-100/50'
          : 'border border-primary/20 bg-[#131920]',
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
            src={brandAssetUrl(isLight ? brandLogos.forLightSurface : brandLogos.forDarkSurface)}
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

      <div className={cn('p-6', isLight && 'text-zinc-900')}>
        {isInvitation && (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--bf-accent-ink)]">
            {t.tickets.dearGuest}
          </p>
        )}

        <div className="flex items-start justify-between gap-3">
          {ctaHref ? (
            <Link
              href={ctaHref}
              className={cn(
                'flex-1 text-xl font-bold leading-tight transition-colors hover:text-[var(--bf-accent-ink)] sm:text-2xl',
                isLight ? 'text-zinc-900' : 'text-white'
              )}
            >
              {eventTitle}
            </Link>
          ) : (
            <h1
              className={cn(
                'flex-1 text-xl font-bold leading-tight sm:text-2xl',
                isLight ? 'text-zinc-900' : 'text-white'
              )}
            >
              {eventTitle}
            </h1>
          )}
          <span
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-[11px] font-bold',
              isValid
                ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                : 'border border-red-400/30 bg-red-400/10 text-red-400'
            )}
          >
            {isValid ? t.tickets.validBadge : t.tickets.invalid}
          </span>
        </div>

        <p className={cn('mt-2 text-sm', isLight ? 'text-zinc-600' : 'text-white/60')}>
          {isInvitation ? (
            t.tickets.issuedFor(holderName)
          ) : (
            <>
              {t.tickets.dear}{' '}
              <span className={cn('font-semibold', isLight ? 'text-zinc-900' : 'text-white')}>
                {holderName}
              </span>
            </>
          )}
        </p>

        {personalMessage && (
          <div
            className="mt-4 rounded-xl border-l-[3px] border-primary px-4 py-3"
            style={{ background: brandTheme.orangeSoft }}
          >
            <p
              className={cn(
                'text-sm italic leading-relaxed',
                isLight ? 'text-zinc-700' : 'text-white/70'
              )}
            >
              &ldquo;{personalMessage}&rdquo;
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {gridItems.map(({ label, value }) => (
            <InfoCell key={label} label={label} value={value} surface={surface} />
          ))}
        </div>

        <div className="relative my-6">
          <div
            className={cn(
              'absolute -left-6 top-1/2 size-5 -translate-y-1/2 rounded-full',
              isLight ? 'bg-[#FFF4E8]' : 'bg-[#0c1017]'
            )}
          />
          <div className="border-t border-dashed border-primary/25" />
          <div
            className={cn(
              'absolute -right-6 top-1/2 size-5 -translate-y-1/2 rounded-full',
              isLight ? 'bg-[#FFF4E8]' : 'bg-[#0c1017]'
            )}
          />
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
              <p className="px-4 text-center text-sm text-white/40">{t.tickets.invalidOrUsed}</p>
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <p
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider',
                isLight ? 'text-zinc-500' : 'text-white/40'
              )}
            >
              {codeLabel}
            </p>
            <p
              className={cn(
                'mt-1 font-mono text-lg font-extrabold tracking-widest sm:text-xl',
                isLight ? 'text-[var(--bf-accent-ink)]' : 'text-white'
              )}
            >
              {ticketCode}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={barcodeUrl}
              alt=""
              width={220}
              height={44}
              className={cn('mx-auto mt-3 block max-w-full sm:mx-0', isLight && 'invert')}
            />
            <p
              className={cn(
                'mt-3 text-xs leading-relaxed',
                isLight ? 'text-zinc-500' : 'text-white/40'
              )}
            >
              {isInvitation ? t.tickets.qrHintInvitation : t.tickets.qrHintTicket}
            </p>
          </div>
        </div>

        <div className={cn('mt-6 border-t pt-4', isLight ? 'border-zinc-200' : 'border-white/[0.08]')}>
          <p className={cn('text-[10px] leading-relaxed', isLight ? 'text-zinc-500' : 'text-white/40')}>
            {ticketTermsTr(kind)}
          </p>
          <p
            className={cn(
              'mt-1 text-[9px] italic leading-relaxed',
              isLight ? 'text-zinc-400' : 'text-white/25'
            )}
          >
            {ticketTermsEn(kind)}
          </p>
          <p className={cn('mt-3 text-[9px] leading-relaxed', isLight ? 'text-zinc-400' : 'text-white/25')}>
            {ticketCompanyLegalLine()}
          </p>
          <p className={cn('text-[9px]', isLight ? 'text-zinc-400' : 'text-white/25')}>
            {ticketCompanyContactLine()}
          </p>
        </div>

        {ctaHref && (
          <Link
            href={ctaHref}
            className="no-print mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {resolvedCtaLabel}
          </Link>
        )}

        {footer}
      </div>
    </div>
  );
}
