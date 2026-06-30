'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Camera, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ScanStatus =
  | 'VALID'
  | 'USED'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'INVALID';

type ScanResult = {
  status: ScanStatus | string;
  message: string;
  ticket?: {
    code: string;
    eventTitle: string;
    ticketType: string;
    holderName: string;
    entryCount?: number;
  };
};

const statusConfig: Record<
  string,
  { icon: typeof CheckCircle2; cardClass: string; iconClass: string; label: string }
> = {
  VALID: {
    icon: CheckCircle2,
    cardClass: 'border-emerald-500/40 bg-emerald-500/15',
    iconClass: 'text-emerald-400',
    label: 'Giriş yapıldı',
  },
  USED: {
    icon: AlertCircle,
    cardClass: 'border-amber-500/40 bg-amber-500/15',
    iconClass: 'text-amber-400',
    label: 'Daha önce kullanıldı',
  },
  REFUNDED: {
    icon: XCircle,
    cardClass: 'border-red-500/40 bg-red-500/15',
    iconClass: 'text-red-400',
    label: 'İade edilmiş',
  },
  CANCELLED: {
    icon: XCircle,
    cardClass: 'border-red-500/40 bg-red-500/15',
    iconClass: 'text-red-400',
    label: 'İptal edilmiş',
  },
  EXPIRED: {
    icon: AlertCircle,
    cardClass: 'border-amber-500/40 bg-amber-500/15',
    iconClass: 'text-amber-400',
    label: 'Süresi dolmuş',
  },
  INVALID: {
    icon: XCircle,
    cardClass: 'border-red-500/40 bg-red-500/15',
    iconClass: 'text-red-400',
    label: 'Geçersiz bilet',
  },
};

interface QrScannerProps {
  /** Tam ekran giriş tarayıcısı (koyu tema) */
  variant?: 'default' | 'entry';
  /** Kamera modunda otomatik başlat */
  autoStart?: boolean;
}

export function QrScanner({ variant = 'default', autoStart = false }: QrScannerProps) {
  const isEntry = variant === 'entry';
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const scanLockRef = useRef(false);
  const [scanning, setScanning] = useState(autoStart);
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useManual, setUseManual] = useState(false);

  const playFeedback = useCallback((status: string) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (status === 'VALID') navigator.vibrate(80);
      else navigator.vibrate([60, 40, 60]);
    }
  }, []);

  const validate = useCallback(
    async (payload: { qrRaw?: string; ticketCode?: string }) => {
      if (scanLockRef.current) return;
      scanLockRef.current = true;
      setLoading(true);
      setResult(null);
      setError(null);

      try {
        const res = await fetch('/api/tickets/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...payload, markUsed: true }),
        });
        const data = (await res.json()) as ScanResult;
        if (!res.ok) {
          setError(data.message || 'Doğrulama başarısız');
          return;
        }
        setResult(data);
        playFeedback(data.status);
        if (scannerRef.current) {
          await scannerRef.current.stop().catch(() => {});
          scannerRef.current = null;
          setScanning(false);
        }
      } catch {
        setError('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
      } finally {
        setLoading(false);
        window.setTimeout(() => {
          scanLockRef.current = false;
        }, 1200);
      }
    },
    [playFeedback]
  );

  const onScanSuccess = useCallback(
    (decoded: string) => {
      void validate({ qrRaw: decoded });
    },
    [validate]
  );

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!scanning || useManual || typeof window === 'undefined') return;

    let cancelled = false;
    const readerId = 'bf-qr-reader';

    async function start() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled || !document.getElementById(readerId)) return;

        const scanner = new Html5Qrcode(readerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 12, qrbox: { width: 280, height: 280 } },
          (text) => {
            if (!cancelled && !scanLockRef.current) onScanSuccess(text);
          },
          () => {}
        );
      } catch {
        if (!cancelled) {
          setError('Kamera açılamadı. Tarayıcı izni verin veya manuel kod girin.');
          setUseManual(true);
          setScanning(false);
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        void scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scanning, useManual, onScanSuccess]);

  const config = result ? statusConfig[result.status] ?? statusConfig.INVALID : null;
  const StatusIcon = config?.icon ?? XCircle;

  const handleNext = () => {
    setResult(null);
    setManualCode('');
    setError(null);
    if (!useManual) setScanning(true);
  };

  return (
    <div className={cn('mx-auto w-full max-w-lg space-y-4', isEntry && 'max-w-none')}>
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
            setResult(null);
            setError(null);
            setScanning(true);
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
            void stopScanner();
            setUseManual(true);
            setResult(null);
          }}
        >
          <Keyboard className="size-5" strokeWidth={2} />
          Manuel
        </Button>
      </div>

      {!useManual && scanning && (
        <div
          id="bf-qr-reader"
          className={cn(
            'overflow-hidden rounded-2xl border-2 border-primary/30 bg-black',
            isEntry && 'min-h-[min(52vh,420px)]'
          )}
        />
      )}

      {!useManual && !scanning && !result && (
        <Button
          type="button"
          className={cn(
            'h-14 w-full text-base font-semibold',
            isEntry && 'bg-primary text-primary-foreground shadow-lg'
          )}
          onClick={() => setScanning(true)}
        >
          Taramayı başlat
        </Button>
      )}

      {useManual && (
        <div className="space-y-3">
          <Input
            placeholder="Bilet kodu veya QR bağlantısı"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className={cn(
              'h-12 text-base',
              isEntry && 'border-white/20 bg-white/10 text-white placeholder:text-white/40'
            )}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualCode.trim()) {
                void validate(
                  manualCode.startsWith('http') || manualCode.startsWith('{')
                    ? { qrRaw: manualCode }
                    : { ticketCode: manualCode.trim() }
                );
              }
            }}
          />
          <Button
            type="button"
            disabled={!manualCode.trim() || loading}
            className={cn(
              'h-12 w-full font-semibold',
              isEntry && 'bg-primary text-primary-foreground'
            )}
            onClick={() =>
              void validate(
                manualCode.startsWith('http') || manualCode.startsWith('{')
                  ? { qrRaw: manualCode }
                  : { ticketCode: manualCode.trim() }
              )
            }
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

      {result && config && (
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
              {result.ticket && (
                <div className="mt-4 space-y-1 rounded-xl bg-black/20 px-3 py-3 text-sm">
                  <p className="font-semibold">{result.ticket.eventTitle}</p>
                  <p className="opacity-80">
                    {result.ticket.ticketType} · {result.ticket.holderName}
                  </p>
                  <p className="font-mono text-xs opacity-70">{result.ticket.code}</p>
                </div>
              )}
            </div>
          </div>
          <Button
            type="button"
            className={cn(
              'mt-5 h-12 w-full text-base font-semibold',
              isEntry
                ? 'bg-white text-black hover:bg-white/90'
                : ''
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
