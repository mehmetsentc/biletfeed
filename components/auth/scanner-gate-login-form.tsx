'use client';

import { useState } from 'react';
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

export function ScannerGateLoginForm() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = code.replace(/\D/g, '').slice(0, 6);
    if (normalized.length !== 6) {
      setError('6 haneli kapı kodunu girin');
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
  }

  return (
    <Card className="w-full max-w-md border-white/10 bg-[#151a24] text-white">
      <CardHeader className="pb-3 text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
          <KeyRound className="size-5" strokeWidth={2} />
        </div>
        <CardTitle className="text-lg">Kapı ekibi girişi</CardTitle>
        <CardDescription className="text-white/60">
          Organizatörünüzden aldığınız 6 haneli kod ile tarama ekranına girin.
          Aynı kodu en fazla 10 kişi kullanabilir.
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
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="border-white/15 bg-[#0c1017] text-center text-lg tracking-[0.35em] text-white"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary text-black hover:bg-[var(--bf-orange-hover)]"
            disabled={loading || code.length !== 6}
          >
            {loading ? 'Giriş yapılıyor...' : 'Taramaya başla'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
