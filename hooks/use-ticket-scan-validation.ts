'use client';

import { useCallback, useRef, useState } from 'react';

export type ScanStatus =
  | 'VALID'
  | 'USED'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'INVALID';

export type ScanResult = {
  status: ScanStatus | string;
  message: string;
  ticket?: {
    code: string;
    eventTitle: string;
    ticketType: string;
    holderName: string;
    entryCount?: number;
    isInvitation?: boolean;
    guestEmail?: string | null;
    guestPhone?: string | null;
    inviteStatus?: string;
  };
};

function playScanSound(status: string) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (status === 'VALID') {
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (status === 'USED') {
      osc.frequency.value = 440;
      gain.gain.value = 0.12;
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.frequency.value = 220;
      gain.gain.value = 0.12;
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
    window.setTimeout(() => void ctx.close(), 500);
  } catch {
    /* ses desteklenmiyorsa sessiz devam */
  }
}

export function useTicketScanValidation(options: {
  eventId?: string;
  scannerId?: string;
  onValidated?: () => void;
}) {
  const { eventId, scannerId, onValidated } = options;
  const scanLockRef = useRef(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playFeedback = useCallback((status: string) => {
    playScanSound(status);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (status === 'VALID') navigator.vibrate(80);
      else if (status === 'USED') navigator.vibrate([40, 30, 40]);
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
          body: JSON.stringify({
            ...payload,
            markUsed: true,
            eventId,
            scannerId
          })
        });
        const data = (await res.json()) as ScanResult & { error?: string };
        if (!res.ok) {
          setError(data.message || data.error || 'Doğrulama başarısız');
          return;
        }
        setResult(data);
        playFeedback(data.status);
        onValidated?.();
      } catch {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          const { enqueueScan } = await import('@/lib/tickets/offline-scan-queue');
          await enqueueScan({
            ...payload,
            eventId,
            scannerId: scannerId ?? 'unknown'
          });
          setError('Çevrimdışı — tarama kuyruğa alındı. Bağlantı gelince senkronize edilir.');
        } else {
          setError('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
        }
      } finally {
        setLoading(false);
        window.setTimeout(() => {
          scanLockRef.current = false;
        }, 1200);
      }
    },
    [eventId, onValidated, playFeedback, scannerId]
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    validate,
    result,
    loading,
    error,
    setError,
    clearResult
  };
}
