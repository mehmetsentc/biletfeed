'use client';

import { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

class CameraErrorBoundary extends Component<
  { children: ReactNode; onFailed: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error('QR camera render error', error, info);
    }
    this.props.onFailed();
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-5 text-center text-sm text-amber-100">
          <p className="font-semibold">Kamera başlatılamadı</p>
          <p className="mt-2 opacity-90">
            Manuel sekmesinden bilet kodunu girebilirsiniz.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-white/30 bg-transparent text-white hover:bg-white/10"
            onClick={() => {
              this.setState({ failed: false });
            }}
          >
            Tekrar dene
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface QrCameraReaderProps {
  active: boolean;
  isEntry?: boolean;
  onScan: (decoded: string) => void;
  onFailed: () => void;
}

function QrCameraReaderInner({
  active,
  isEntry,
  onScan,
  onFailed
}: QrCameraReaderProps) {
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const scanLockRef = useRef(false);

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    let cancelled = false;
    const readerId = 'bf-qr-reader';

    async function start() {
      try {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        if (cancelled || !document.getElementById(readerId)) return;

        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled || !document.getElementById(readerId)) return;

        const scanner = new Html5Qrcode(readerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text) => {
            if (!cancelled && !scanLockRef.current) {
              scanLockRef.current = true;
              onScan(text);
              window.setTimeout(() => {
                scanLockRef.current = false;
              }, 1200);
            }
          },
          () => {}
        );
      } catch {
        if (!cancelled) onFailed();
      }
    }

    void start();

    return () => {
      cancelled = true;
      const activeScanner = scannerRef.current;
      scannerRef.current = null;
      if (activeScanner) {
        void activeScanner.stop().catch(() => {});
      }
    };
  }, [active, onFailed, onScan]);

  if (!active) return null;

  return (
    <div
      id="bf-qr-reader"
      className={cn(
        'overflow-hidden rounded-2xl border-2 border-primary/30 bg-black',
        isEntry && 'min-h-[min(52vh,420px)]'
      )}
    />
  );
}

export function QrCameraReader(props: QrCameraReaderProps) {
  return (
    <CameraErrorBoundary onFailed={props.onFailed}>
      <QrCameraReaderInner {...props} />
    </CameraErrorBoundary>
  );
}
