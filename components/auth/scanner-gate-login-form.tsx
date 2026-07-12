'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

const SIX_DIGIT_ERROR =
  "Sadece numarayı değil, 'Kodu kopyala' ile gelen tam kodu yapıştırın";

function normalizeGateInput(value: string): string {
  const trimmed = value.trim();
  const gateParam = trimmed.match(/[?&]gate=([^&#]+)/i)?.[1];
  if (gateParam) {
    return decodeURIComponent(gateParam).trim().replace(/\s+/g, '');
  }
  return trimmed.replace(/\s+/g, '');
}

export function ScannerGateLoginForm() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redeemCode = useCallback(
    async (rawCode: string) => {
      const normalized = normalizeGateInput(rawCode);
      if (normalized.length < 6) {
        setError('Organizatörden aldığınız kapı kodunu yapıştırın');
        return;
      }

      if (/^\d{6}$/.test(normalized)) {
        setError(SIX_DIGIT_ERROR);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/auth/scanner-gate-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ code: normalized })
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          redirect?: string;
        };

        if (!res.ok) {
          setError(data.error ?? 'Kapı kodu geçersiz');
          return;
        }

        const redirect =
          searchParams.get('redirect') || data.redirect || '/tarayici';
        window.location.replace(redirect);
      } catch {
        setError('Bağlantı hatası. Tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    },
    [searchParams]
  );

  useEffect(() => {
    const gate = searchParams.get('gate');
    if (gate) {
      setCode(gate);
      void redeemCode(gate);
    }
  }, [searchParams, redeemCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await redeemCode(code);
  }

  return (
    <Card className="w-full max-w-md border-white/10 bg-[#151a24] text-white">
      <CardHeader className="pb-3 text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
          <KeyRound className="size-5" strokeWidth={2} />
        </div>
        <CardTitle className="text-lg">Kapı ekibi girişi</CardTitle>
        <CardDescription className="text-white/60">
          Organizatörün &quot;Kodu kopyala&quot; veya &quot;Giriş linki&quot; ile
          gönderdiği kodu yapıştırın. Aynı kodu 10 kişiye kadar paylaşabilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 rounded-md bg-destructive/20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="scanner-gate-code">Kapı kodu</Label>
            <Input
              id="scanner-gate-code"
              autoComplete="one-time-code"
              placeholder="Tam kodu yapıştırın (AB12CD34.…)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border-white/15 bg-[#0c1017] text-sm text-white"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary text-black hover:bg-[var(--bf-orange-hover)]"
            disabled={loading || normalizeGateInput(code).length < 6}
          >
            {loading ? 'Giriş yapılıyor...' : 'Taramaya başla'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
