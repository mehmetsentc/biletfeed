'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Camera, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ScanResult = {
  status: string;
  message: string;
  ticket?: {
    code: string;
    eventTitle: string;
    ticketType: string;
    holderName: string;
  };
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

  const validate = useCallback(async (payload: { qrRaw?: string; ticketCode?: string }) => {
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
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const statusIcon = {
    valid: CheckCircle2,
    already_used: AlertCircle,
    invalid: XCircle,
    cancelled: XCircle
  };

  const StatusIcon = result ? statusIcon[result.status as keyof typeof statusIcon] || XCircle : null;

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

      {result && StatusIcon && (
        <Card
          className={cn(
            result.status === 'valid' && 'border-emerald-500/50 bg-emerald-500/5',
            result.status === 'already_used' && 'border-amber-500/50 bg-amber-500/5',
            (result.status === 'invalid' || result.status === 'cancelled') &&
              'border-destructive/50 bg-destructive/5'
          )}
        >
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <StatusIcon
                className={cn(
                  'size-6 shrink-0',
                  result.status === 'valid' && 'text-emerald-600',
                  result.status === 'already_used' && 'text-amber-600',
                  (result.status === 'invalid' || result.status === 'cancelled') &&
                    'text-destructive'
                )}
              />
              <div>
                <p className="font-semibold">{result.message}</p>
                {result.ticket && (
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>{result.ticket.eventTitle}</p>
                    <p>{result.ticket.ticketType} · {result.ticket.holderName}</p>
                    <p className="font-mono">{result.ticket.code}</p>
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
