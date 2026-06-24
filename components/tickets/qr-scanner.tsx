'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Camera, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  { icon: typeof CheckCircle2; className: string; label: string }
> = {
  VALID: {
    icon: CheckCircle2,
    className: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600',
    label: 'Giriş Onaylandı'
  },
  USED: {
    icon: AlertCircle,
    className: 'border-amber-500/50 bg-amber-500/10 text-amber-600',
    label: 'Daha Önce Kullanıldı'
  },
  REFUNDED: {
    icon: XCircle,
    className: 'border-destructive/50 bg-destructive/10 text-destructive',
    label: 'İade Edilmiş'
  },
  CANCELLED: {
    icon: XCircle,
    className: 'border-destructive/50 bg-destructive/10 text-destructive',
    label: 'İptal Edilmiş'
  },
  EXPIRED: {
    icon: AlertCircle,
    className: 'border-amber-500/50 bg-amber-500/10 text-amber-600',
    label: 'Süresi Dolmuş'
  },
  INVALID: {
    icon: XCircle,
    className: 'border-destructive/50 bg-destructive/10 text-destructive',
    label: 'Geçersiz Bilet'
  }
};

export function QrScanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const [scanning, setScanning] = useState(false);
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
      setLoading(true);
      setResult(null);
      setError(null);
      try {
        const res = await fetch('/api/tickets/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, markUsed: true })
        });
        const data = (await res.json()) as ScanResult;
        if (!res.ok) {
          setError(data.message || 'Doğrulama başarısız');
          return;
        }
        setResult(data);
        playFeedback(data.status);
      } catch {
        setError('Bağlantı hatası');
      } finally {
        setLoading(false);
      }
    },
    [playFeedback]
  );

  const onScanSuccess = useCallback(
    (decoded: string) => {
      void validate({ qrRaw: decoded });
      if (scannerRef.current) {
        void scannerRef.current.stop();
        setScanning(false);
      }
    },
    [validate]
  );

  useEffect(() => {
    if (!scanning || useManual || !containerRef.current) return;

    let cancelled = false;

    async function start() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text) => {
            if (!cancelled) onScanSuccess(text);
          },
          () => {}
        );
      } catch {
        setError('Kamera açılamadı. Manuel kod girişi kullanın.');
        setUseManual(true);
        setScanning(false);
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

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex gap-2">
        <Button
          variant={!useManual ? 'default' : 'outline'}
          className="flex-1 gap-2"
          onClick={() => {
            setUseManual(false);
            setScanning(true);
            setResult(null);
          }}
        >
          <Camera className="size-4" />
          Kamera
        </Button>
        <Button
          variant={useManual ? 'default' : 'outline'}
          className="flex-1 gap-2"
          onClick={() => {
            setUseManual(true);
            setScanning(false);
            if (scannerRef.current) void scannerRef.current.stop();
          }}
        >
          <Keyboard className="size-4" />
          Manuel
        </Button>
      </div>

      {!useManual && (
        <div
          id="qr-reader"
          ref={containerRef}
          className={cn(
            'overflow-hidden rounded-xl border bg-black',
            !scanning && 'hidden'
          )}
        />
      )}

      {!scanning && !useManual && (
        <Button className="w-full" onClick={() => setScanning(true)}>
          Taramayı Başlat
        </Button>
      )}

      {useManual && (
        <div className="flex gap-2">
          <Input
            placeholder="Bilet kodu veya QR içeriği"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualCode.trim()) {
                void validate(
                  manualCode.startsWith('http') || manualCode.startsWith('{')
                    ? { qrRaw: manualCode }
                    : { ticketCode: manualCode }
                );
              }
            }}
          />
          <Button
            disabled={!manualCode.trim() || loading}
            onClick={() =>
              void validate(
                manualCode.startsWith('http') || manualCode.startsWith('{')
                  ? { qrRaw: manualCode }
                  : { ticketCode: manualCode }
              )
            }
          >
            Kontrol
          </Button>
        </div>
      )}

      {loading && (
        <p className="text-center text-sm text-muted-foreground">Doğrulanıyor...</p>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-3 py-4 text-destructive">
            <XCircle className="size-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && config && (
        <Card className={cn('border-2 transition-colors', config.className.split(' ')[0], config.className.split(' ')[1])}>
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <StatusIcon className={cn('size-8 shrink-0', config.className.split(' ').slice(2).join(' '))} />
              <div>
                <p className="text-lg font-bold">{config.label}</p>
                <p className="text-sm opacity-90">{result.message}</p>
                {result.ticket && (
                  <div className="mt-3 space-y-1 text-sm opacity-80">
                    <p>{result.ticket.eventTitle}</p>
                    <p>
                      {result.ticket.ticketType} · {result.ticket.holderName}
                    </p>
                    <p className="font-mono">{result.ticket.code}</p>
                    {result.ticket.entryCount != null && result.ticket.entryCount > 0 && (
                      <p>Giriş sayısı: {result.ticket.entryCount}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={() => {
                setResult(null);
                setManualCode('');
                if (!useManual) setScanning(true);
              }}
            >
              Sonraki Bilet
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
