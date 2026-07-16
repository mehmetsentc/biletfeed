'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCommissionRatePercent } from '@/lib/config/commission';
import { Percent } from 'lucide-react';

interface CommissionSettingsCardProps {
  initialRate: number;
}

export function CommissionSettingsCard({ initialRate }: CommissionSettingsCardProps) {
  const [rate, setRate] = useState(initialRate);
  const [input, setInput] = useState(String(Math.round(initialRate * 100)));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    const parsed = parseFloat(input) / 100;
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) {
      setMessage('Geçerli bir yüzde girin (0–100).');
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings/commission', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: parsed })
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Kaydedilemedi');
      }
      setRate(parsed);
      setMessage('Varsayılan hizmet bedeli güncellendi.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Percent className="size-4" />
          Varsayılan Hizmet Bedeli
        </CardTitle>
        <CardDescription>
          Organizatöre özel oran tanımlanmamışsa uygulanır. Müşteriye gösterilmez; platform
          komisyonu olarak organizatör hakedişinden düşülür.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="default-commission" className="text-sm font-medium">
              Oran (%)
            </label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                id="default-commission"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <Button onClick={() => void save()} disabled={loading}>
            {loading ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Aktif varsayılan:{' '}
          <Badge variant="secondary">%{formatCommissionRatePercent(rate)}</Badge>
        </p>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}
