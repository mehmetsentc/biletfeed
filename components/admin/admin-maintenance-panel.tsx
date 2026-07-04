'use client';

import { useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminMaintenancePanel() {
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function runSeedEventRules() {
    setSeeding(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/seed-event-rules', {
        method: 'POST',
        credentials: 'same-origin'
      });
      const data = (await res.json()) as {
        ok?: boolean;
        categories?: number;
        rules?: number;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Seed başarısız');
      }
      setMessage(
        `Kural kataloğu güncellendi: ${data.categories ?? 0} kategori, ${data.rules ?? 0} kural.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Seed başarısız');
    } finally {
      setSeeding(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Bakım İşlemleri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Production deploy sonrası etkinlik oluşturma sihirbazı kurallarını
          senkronize edin. Cron:{' '}
          <code className="text-xs">POST /api/cron/seed-event-rules</code>
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={seeding}
          onClick={() => void runSeedEventRules()}
          className="gap-2"
        >
          {seeding ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Database className="size-4" />
          )}
          Etkinlik Kurallarını Seed Et
        </Button>
        {message && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
