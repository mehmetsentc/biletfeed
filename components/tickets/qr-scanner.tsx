'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Camera, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCameraReader } from '@/components/tickets/qr-camera-reader';
import {
  useTicketScanValidation,
  type ScanResult
} from '@/hooks/use-ticket-scan-validation';
import { resolveManualScanInput } from '@/lib/tickets/sign';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  string,
  { icon: typeof CheckCircle2; cardClass: string; iconClass: string; label: string }
> = {
  VALID: {
    icon: CheckCircle2,
    cardClass: 'border-primary/35 bg-primary/10',
    iconClass: 'text-primary',
    label: 'Giriş yapıldı'
  },
  USED: {
    icon: AlertCircle,
    cardClass: 'border-amber-500/35 bg-amber-500/10',
    iconClass: 'text-amber-600 dark:text-amber-400',
    label: 'Daha önce kullanıldı'
  },
  REFUNDED: {
    icon: XCircle,
    cardClass: 'border-destructive/35 bg-destructive/10',
    iconClass: 'text-destructive',
    label: 'İade edilmiş'
  },
  CANCELLED: {
    icon: XCircle,
    cardClass: 'border-destructive/35 bg-destructive/10',
    iconClass: 'text-destructive',
    label: 'İptal edilmiş'
  },
  EXPIRED: {
    icon: AlertCircle,
    cardClass: 'border-amber-500/35 bg-amber-500/10',
    iconClass: 'text-amber-600 dark:text-amber-400',
    label: 'Süresi dolmuş'
  },
  INVALID: {
    icon: XCircle,
    cardClass: 'border-destructive/35 bg-destructive/10',
    iconClass: 'text-destructive',
    label: 'Geçersiz bilet'
  }
};

function getEntryStatusStyle(status: string): {
  iconWrap: string;
  titleClass: string;
  messageClass: string;
} {
  if (status === 'VALID') {
    return {
      iconWrap:
        'bg-primary text-primary-foreground shadow-[0_8px_32px_rgba(235,103,43,0.4)]',
      titleClass: 'text-white',
      messageClass: 'text-white/75'
    };
  }
  if (status === 'USED' || status === 'EXPIRED') {
    return {
      iconWrap: 'bg-amber-500/15 text-amber-400 ring-2 ring-amber-500/35',
      titleClass: 'text-white',
      messageClass: 'text-white/75'
    };
  }
  return {
    iconWrap: 'bg-destructive/15 text-destructive ring-2 ring-destructive/35',
    titleClass: 'text-white',
    messageClass: 'text-white/75'
  };
}

function TicketScanDetails({
  ticket,
  compact = false
}: {
  ticket: NonNullable<ScanResult['ticket']>;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'space-y-1.5 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4 text-sm shadow-[0_12px_40px_rgba(0,0,0,0.45)]',
        compact && 'mt-5 w-full text-left'
      )}
    >
      {ticket.isInvitation && (
        <p className="mb-2 inline-flex rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/30">
          Davetiye Bileti
        </p>
      )}
      <p className={cn('font-bold text-white', compact && 'text-lg')}>
        {ticket.holderName}
      </p>
      <p className="text-white/72">{ticket.ticketType}</p>
      {!compact && (
        <p className="font-medium text-white/85">{ticket.eventTitle}</p>
      )}
      {ticket.guestEmail && (
        <p className="text-white/60">{ticket.guestEmail}</p>
      )}
      {ticket.guestPhone && (
        <p className="text-white/60">{ticket.guestPhone}</p>
      )}
      <p className="font-mono text-xs text-white/50">{ticket.code}</p>
      {ticket.entryCount != null && ticket.entryCount > 0 && (
        <p className="text-xs text-primary/90">Giriş sayısı: {ticket.entryCount}</p>
      )}
    </div>
  );
}

interface QrScannerProps {
  variant?: 'default' | 'entry';
  autoStart?: boolean;
  eventId?: string;
  scannerId?: string;
  /** Kamera açılamazsa manuel moda geç */
  defaultManual?: boolean;
}

export function QrScanner({
  variant = 'default',
  autoStart = false,
  eventId,
  scannerId,
  defaultManual = false
}: QrScannerProps) {
  const isEntry = variant === 'entry';
  const [useManual, setUseManual] = useState(defaultManual);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const stopCamera = useCallback(() => setCameraActive(false), []);

  const { validate, result, loading, error, clearResult } = useTicketScanValidation({
    eventId,
    scannerId,
    onValidated: stopCamera
  });

  useEffect(() => {
    if (autoStart && !defaultManual) {
      setCameraActive(true);
    }
  }, [autoStart, defaultManual]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncQueue = () => {
      void import('@/lib/tickets/offline-scan-queue').then(({ flushScanQueue }) =>
        flushScanQueue(async (payload) => {
          const res = await fetch('/api/tickets/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
          });
          return res.json() as Promise<{ status: string }>;
        })
      );
    };

    window.addEventListener('online', syncQueue);
    if (navigator.onLine) syncQueue();
    return () => window.removeEventListener('online', syncQueue);
  }, []);

  const submitManual = useCallback(() => {
    const value = manualCode.trim();
    if (!value) return;
    const resolved = resolveManualScanInput(value);
    if (resolved.inviteToken || resolved.validationToken || resolved.ticketId) {
      void validate({
        ticketCode: resolved.ticketCode,
        ...(resolved.ticketId ? { ticketId: resolved.ticketId } : {}),
        ...(resolved.validationToken ? { validationToken: resolved.validationToken } : {}),
        ...(resolved.inviteToken
          ? { qrRaw: `https://biletfeed.com/davetiye/${resolved.inviteToken}` }
          : {})
      });
      return;
    }
    void validate(
      value.startsWith('http') || value.startsWith('{') || value.includes('/bilet/') || value.includes('/davetiye/')
        ? { qrRaw: value.startsWith('/') ? `https://biletfeed.com${value}` : value }
        : { ticketCode: resolved.ticketCode ?? value }
    );
  }, [manualCode, validate]);

  const handleCameraFailed = useCallback(() => {
    setCameraActive(false);
    setUseManual(true);
  }, []);

  const handleNext = () => {
    clearResult();
    setManualCode('');
    if (!useManual) setCameraActive(true);
  };

  const config = result ? statusConfig[result.status] ?? statusConfig.INVALID : null;
  const StatusIcon = config?.icon ?? XCircle;
  const entryStyle = result ? getEntryStatusStyle(result.status) : null;

  return (
    <div className={cn('mx-auto w-full max-w-lg space-y-4', isEntry && 'max-w-none')}>
      {isEntry && result && entryStyle && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center transition-colors duration-300"
          role="alert"
          aria-live="assertive"
        >
          <div
            className={cn(
              'mb-5 flex size-24 items-center justify-center rounded-full',
              entryStyle.iconWrap
            )}
          >
            <StatusIcon className="size-14" strokeWidth={1.75} />
          </div>
          <p className={cn('text-3xl font-bold tracking-tight', entryStyle.titleClass)}>
            {config?.label}
          </p>
          <p className={cn('mt-2 max-w-sm text-lg', entryStyle.messageClass)}>
            {result.message}
          </p>
          {result.ticket && (
            <div className="mt-1 w-full max-w-sm">
              <TicketScanDetails ticket={result.ticket} compact />
            </div>
          )}
          <Button
            type="button"
            className="mt-10 h-14 min-w-[220px] rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-[0_8px_24px_rgba(235,103,43,0.35)] hover:bg-[var(--bf-orange-hover)]"
            onClick={handleNext}
          >
            Sonraki bilet
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant={!useManual ? 'default' : 'outline'}
          className={cn(
            'h-12 flex-1 gap-2 text-base font-semibold',
            isEntry && !useManual && 'bg-primary text-primary-foreground',
            isEntry && useManual && 'border-white/20 bg-transparent text-white hover:bg-white/10'
          )}
          onClick={() => {
            setUseManual(false);
            clearResult();
            setCameraActive(true);
          }}
        >
          <Camera className="size-5" strokeWidth={2} />
          Kamera
        </Button>
        <Button
          type="button"
          variant={useManual ? 'default' : 'outline'}
          className={cn(
            'h-12 flex-1 gap-2 text-base font-semibold',
            isEntry && useManual && 'bg-primary text-primary-foreground',
            isEntry && !useManual && 'border-white/20 bg-transparent text-white hover:bg-white/10'
          )}
          onClick={() => {
            setCameraActive(false);
            setUseManual(true);
            clearResult();
          }}
        >
          <Keyboard className="size-5" strokeWidth={2} />
          Manuel
        </Button>
      </div>

      {!useManual && (
        <>
          {cameraActive ? (
            <QrCameraReader
              active={cameraActive}
              isEntry={isEntry}
              onScan={(decoded) => void validate({ qrRaw: decoded })}
              onFailed={handleCameraFailed}
            />
          ) : (
            !result && (
              <Button
                type="button"
                className={cn(
                  'h-14 w-full text-base font-semibold',
                  isEntry && 'bg-primary text-primary-foreground shadow-lg'
                )}
                onClick={() => setCameraActive(true)}
              >
                Taramayı başlat
              </Button>
            )
          )}
        </>
      )}

      {useManual && (
        <div className="space-y-3">
          <Input
            placeholder="BF-XXXX bilet kodu, davetiye linki veya token"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className={cn(
              'h-12 text-base',
              isEntry && 'border-white/20 bg-white/10 text-white placeholder:text-white/40'
            )}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitManual();
            }}
          />
          <Button
            type="button"
            disabled={!manualCode.trim() || loading}
            className={cn(
              'h-12 w-full font-semibold',
              isEntry && 'bg-primary text-primary-foreground'
            )}
            onClick={submitManual}
          >
            Bileti doğrula
          </Button>
        </div>
      )}

      {loading && (
        <p
          className={cn(
            'text-center text-sm',
            isEntry ? 'text-white/70' : 'text-muted-foreground'
          )}
        >
          Doğrulanıyor…
        </p>
      )}

      {error && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-2xl border px-4 py-4',
            isEntry
              ? 'border-red-500/40 bg-red-500/10 text-red-200'
              : 'border-destructive/50 bg-destructive/10 text-destructive'
          )}
        >
          <XCircle className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm leading-relaxed">{error}</p>
        </div>
      )}

      {result && config && !isEntry && (
        <div
          className={cn(
            'rounded-2xl border-2 p-5 transition-colors',
            config.cardClass,
            isEntry && 'text-white'
          )}
        >
          <div className="flex items-start gap-4">
            <StatusIcon className={cn('size-10 shrink-0', config.iconClass)} strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold">{config.label}</p>
              <p className="mt-1 text-sm opacity-90">{result.message}</p>
              {result.ticket && <TicketScanDetails ticket={result.ticket} />}
            </div>
          </div>
          <Button
            type="button"
            className="mt-5 h-12 w-full rounded-xl text-base font-semibold"
            variant="outline"
            onClick={handleNext}
          >
            Sonraki bilet
          </Button>
        </div>
      )}
    </div>
  );
}
