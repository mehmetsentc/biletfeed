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
import { useTranslations } from '@/components/providers';

function normalizeGateInput(value: string): string {
  const trimmed = value.trim();
  const gateParam = trimmed.match(/[?&]gate=([^&#]+)/i)?.[1];
  if (gateParam) {
    return decodeURIComponent(gateParam).trim().replace(/\s+/g, '');
  }
  return trimmed.replace(/\s+/g, '');
}

export function ScannerGateLoginForm() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCodeTip, setShowCodeTip] = useState(false);

  const redeemCode = useCallback(
    async (rawCode: string) => {
      const normalized = normalizeGateInput(rawCode);
      if (normalized.length < 6) {
        setError(t.gate.pasteCodeHint);
        setShowCodeTip(false);
        return;
      }

      if (/^\d{6}$/.test(normalized)) {
        setError(t.gate.pasteFullCodeError);
        setShowCodeTip(true);
        return;
      }

      setLoading(true);
      setError(null);
      setShowCodeTip(false);

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
          setError(data.error ?? t.gate.errorInvalidGate);
          return;
        }

        const redirect =
          searchParams.get('redirect') || data.redirect || '/tarayici';
        window.location.replace(redirect);
      } catch {
        setError(t.gate.connectionError);
      } finally {
        setLoading(false);
      }
    },
    [searchParams, t]
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
        <CardTitle className="text-lg">{t.gate.staffLoginTitle}</CardTitle>
        <CardDescription className="text-white/60">
          {t.gate.staffLoginSubtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 rounded-md bg-destructive/20 p-3 text-sm text-red-300">
            <p>{error}</p>
            {showCodeTip && (
              <p className="mt-1.5 text-xs text-white/60">
                💡 {t.gate.qrLinkTip}
              </p>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="scanner-gate-code">{t.gate.codeLabel}</Label>
            <Input
              id="scanner-gate-code"
              autoComplete="one-time-code"
              placeholder={t.gate.codePlaceholder}
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
            {loading ? t.gate.submitting : t.gate.startScanning}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
