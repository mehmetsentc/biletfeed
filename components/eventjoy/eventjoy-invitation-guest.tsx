'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Calendar, Download, MapPin, User } from 'lucide-react';
import type { EventJoyPublicInvitation } from '@/lib/eventjoy/invitations';
import { formatEventJoyDateTime, getEventJoyPrintUrl } from '@/lib/eventjoy/invitations';
import { cn } from '@/lib/utils';

export function EventJoyInvitationGuest({
  invitation
}: {
  invitation: EventJoyPublicInvitation;
}) {
  const [downloading, setDownloading] = useState(false);
  const { dateLabel, timeLabel } = formatEventJoyDateTime(
    invitation.date,
    invitation.time
  );

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{ background: 'linear-gradient(135deg, var(--ticket-page-bg) 0%, #111827 50%, var(--ticket-page-bg) 100%)' }}
    >
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <Link href="/eventjoy" className="inline-block text-lg font-bold tracking-tight text-white">
            Event<span style={{ color: 'var(--bf-orange)' }}>Joy</span>
          </Link>
        </div>

        <div
          className="overflow-hidden rounded-3xl shadow-2xl"
          style={{ border: '1px solid rgba(245,166,35,0.2)', background: '#13191f' }}
        >
          {invitation.coverImage ? (
            <div className="relative h-52 overflow-hidden">
              <img
                src={invitation.coverImage}
                alt={invitation.title}
                className="h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(19,25,31,0) 30%, rgba(19,25,31,0.95) 100%)'
                }}
              />
              <div className="absolute bottom-4 left-5">
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    background: 'rgba(245,166,35,0.2)',
                    color: 'var(--bf-orange)',
                    border: '1px solid rgba(245,166,35,0.4)'
                  }}
                >
                  ✦ Davetiye
                </span>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'flex items-center justify-center bg-gradient-to-br py-8',
                invitation.coverColor
              )}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-white">
                ✦ Davetiye
              </span>
            </div>
          )}

          <div className="px-6 pb-8 pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              {invitation.type}
            </p>
            <h1 className="mt-2 text-xl font-bold leading-tight text-white">
              {invitation.title}
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <span className="font-semibold text-white">{invitation.hostName}</span> sizi
              aramızda görmekten mutluluk duyacak.
            </p>

            {invitation.personalMessage && (
              <div
                className="mt-4 rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(245,166,35,0.07)',
                  borderLeft: '3px solid var(--bf-orange)'
                }}
              >
                <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  &ldquo;{invitation.personalMessage}&rdquo;
                </p>
              </div>
            )}

            <div
              className="mt-5 space-y-2.5 rounded-2xl px-4 py-3"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)'
              }}
            >
              <div className="flex items-start gap-3 text-sm">
                <Calendar className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--bf-orange)' }} />
                <div>
                  <span className="text-white">{dateLabel}</span>
                  <span className="ml-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {timeLabel}
                  </span>
                </div>
              </div>
              {invitation.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="size-4 shrink-0" style={{ color: 'var(--bf-orange)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>{invitation.location}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <User className="size-4 shrink-0" style={{ color: 'var(--bf-orange)' }} />
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>{invitation.hostName}</span>
              </div>
            </div>

            {invitation.description && (
              <p className="mt-5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {invitation.description}
              </p>
            )}

            <button
              type="button"
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  const res = await fetch(
                    `/api/eventjoy/invitations/${encodeURIComponent(invitation.token)}/pdf`
                  );
                  if (!res.ok) throw new Error('PDF indirilemedi');
                  const blob = await res.blob();
                  const objectUrl = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = objectUrl;
                  link.download =
                    res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ??
                    `EventJoy-${invitation.title.slice(0, 30)}.pdf`;
                  link.click();
                  URL.revokeObjectURL(objectUrl);
                } catch {
                  window.open(getEventJoyPrintUrl(invitation.token), '_blank', 'noopener,noreferrer');
                } finally {
                  setDownloading(false);
                }
              }}
              className="no-print mt-7 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--bf-orange), var(--bf-orange-hover))' }}
            >
              <Download className="size-4" />
              {downloading ? 'İndiriliyor…' : 'Davetiye İndir'}
            </button>

            <Link
              href={`/eventjoy/i/${invitation.token}/print`}
              target="_blank"
              className="no-print mt-2 flex w-full items-center justify-center rounded-2xl py-2.5 text-xs font-medium text-white/45 hover:text-white/70"
            >
              Yazdır
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs no-print" style={{ color: 'rgba(255,255,255,0.2)' }}>
          EventJoy · biletfeed.com
        </p>
      </div>

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
