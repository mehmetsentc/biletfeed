'use client';

import Image from 'next/image';
import { Calendar, MapPin } from 'lucide-react';
import { TicketQR } from '@/components/tickets/ticket-qr';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PremiumTicketCardProps {
  eventTitle: string;
  eventImage: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  city: string;
  ticketType: string;
  holderName: string;
  ticketCode: string;
  qrData: string;
  status: string;
  priceLabel?: string;
  variant?: 'dark' | 'light';
  className?: string;
  id?: string;
}

export function PremiumTicketCard({
  eventTitle,
  eventImage,
  eventDate,
  eventTime,
  venue,
  city,
  ticketType,
  holderName,
  ticketCode,
  qrData,
  status,
  priceLabel,
  variant = 'dark',
  className,
  id
}: PremiumTicketCardProps) {
  const isDark = variant === 'dark';
  const isValid = status === 'VALID';

  return (
    <div
      id={id}
      className={cn(
        'overflow-hidden rounded-2xl border shadow-xl backdrop-blur-sm',
        isDark
          ? 'border-white/10 bg-ticket-page/95 text-white'
          : 'border-border bg-card text-foreground',
        className
      )}
    >
      <div className="relative h-44 sm:h-52">
        <Image
          src={eventImage}
          alt={eventTitle}
          fill
          className="object-cover"
          unoptimized
        />
        <div
          className={cn(
            'absolute inset-0',
            isDark
              ? 'bg-gradient-to-t from-[var(--ticket-page-bg)] via-[var(--ticket-page-bg)]/40 to-transparent'
              : 'bg-gradient-to-t from-card via-card/30 to-transparent'
          )}
        />
        <div className="absolute left-4 top-4 text-lg font-bold tracking-tight">
          bilet<span className="text-primary">feed</span>
        </div>
        <Badge
          variant={isValid ? 'success' : 'secondary'}
          className="absolute right-4 top-4"
        >
          {isValid ? 'Geçerli' : status}
        </Badge>
      </div>

      <div className="relative px-5 pb-5 pt-2 sm:px-6">
        <div className="absolute -top-3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <h2 className="text-xl font-bold leading-tight sm:text-2xl">{eventTitle}</h2>
        <p className={cn('mt-1 text-sm', isDark ? 'text-white/60' : 'text-muted-foreground')}>
          Sayın <span className="font-medium text-inherit">{holderName}</span>
        </p>

        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p className={cn('flex items-center gap-2', isDark ? 'text-white/70' : 'text-muted-foreground')}>
            <Calendar className="size-4 shrink-0 text-primary" />
            {eventDate} · {eventTime}
          </p>
          <p className={cn('flex items-center gap-2', isDark ? 'text-white/70' : 'text-muted-foreground')}>
            <MapPin className="size-4 shrink-0 text-primary" />
            {venue}, {city}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {ticketType}
          </span>
          {priceLabel && (
            <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-foreground')}>
              {priceLabel}
            </span>
          )}
        </div>

        {isValid && (
          <div
            className={cn(
              'my-5 flex justify-center rounded-2xl p-5',
              isDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-muted/40'
            )}
          >
            <TicketQR data={qrData} />
          </div>
        )}

        <p className="text-center font-mono text-sm tracking-widest">{ticketCode}</p>
        <p className={cn('mt-2 text-center text-xs', isDark ? 'text-white/40' : 'text-muted-foreground')}>
          Girişte QR kodunuzu gösterin · Powered by BiletFeed
        </p>
      </div>
    </div>
  );
}
