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
    cardClass: 'border-emerald-500/40 bg-emerald-500/15',
    iconClass: 'text-emerald-400',
    label: 'Giriş yapıldı'
  },
  USED: {
    icon: AlertCircle,
    cardClass: 'border-amber-500/40 bg-amber-500/15',
    iconClass: 'text-amber-400',
    label: 'Daha önce kullanıldı'
  },
  REFUNDED: {
    icon: XCircle,
    cardClass: 'border-red-500/40 bg-red-500/15',
    iconClass: 'text-red-400',
    label: 'İade edilmiş'
  },
  CANCELLED: {
    icon: XCircle,
    cardClass: 'border-red-500/40 bg-red-500/15',
    iconClass: 'text-red-400',
    label: 'İptal edilmiş'
  },
  EXPIRED: {
    icon: AlertCircle,
    cardClass: 'border-amber-500/40 bg-amber-500/15',
    iconClass: 'text-amber-400',
    label: 'Süresi dolmuş'
  },
  INVALID: {
    icon: XCircle,
    cardClass: 'border-red-500/40 bg-red-500/15',
    iconClass: 'text-red-400',
    label: 'Geçersiz bilet'
  }
};

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
        'space-y-1 rounded-xl bg-black/20 px-3 py-3 text-sm',
        compact && 'mt-4 text-left text-sm font-medium opacity-90'
      )}
    >
      {ticket.isInvitation && (
        <p className="mb-2 inline-flex rounded-full bg-violet-500/25 px-2.5 py-0.5 text-xs font-semibold text-violet-200">
          Davetiye Bileti
        </p>
      )}
      <p className={cn('font-semibold', compact && 'text-base')}>{ticket.holderName}</p>
      <p className="opacity-80">{ticket.ticketType}</p>
      {!compact && <p className="font-semibold opacity-90">{ticket.eventTitle}</p>}
      {ticket.guestEmail && <p className="opacity-75">{ticket.guestEmail}</p>}
      {ticket.guestPhone && <p className="opacity-75">{ticket.guestPhone}</p>}
      <p className="font-mono text-xs opacity-70">{ticket.code}</p>
      {ticket.entryCount != null && ticket.entryCount > 0 && (
        <p className="text-xs opacity-60">Giriş sayısı: {ticket.entryCount}</p>
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

  const entryOverlayClass =
    result?.status === 'VALID'
      ? 'bg-emerald-600'
      : result?.status === 'USED'
        ? 'bg-amber-500'
        : result
          ? 'bg-red-600'
          : '';

  return (
    <div className={cn('mx-auto w-full max-w-lg space-y-4', isEntry && 'max-w-none')}>
      {isEntry && result && entryOverlayClass && (
        <div
          className={cn(
            'fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center text-white transition-colors duration-300',
            entryOverlayClass
          )}
          role="alert"
          aria-live="assertive"
        >
          <StatusIcon className="mb-4 size-24" strokeWidth={1.5} />
          <p className="text-3xl font-bold">{config?.label}</p>
          <p className="mt-2 max-w-sm text-lg opacity-90">{result.message}</p>
          {result.ticket && (
            <div className="mt-4 w-full max-w-sm">
              <TicketScanDetails ticket={result.ticket} compact />
            </div>
          )}
          <Button
            type="button"
            className="mt-10 h-14 min-w-[200px] bg-white text-lg font-bold text-black hover:bg-white/90"
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
            className={cn(
              'mt-5 h-12 w-full text-base font-semibold',
              isEntry ? 'bg-white text-black hover:bg-white/90' : ''
            )}
            variant={isEntry ? 'secondary' : 'outline'}
            onClick={handleNext}
          >
            Sonraki bilet
          </Button>
        </div>
      )}
    </div>
  );
}
