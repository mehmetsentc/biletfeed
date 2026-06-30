'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ORGANIZATOR_BRAND } from '@/components/organizator-panel/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { siteConfig } from '@/lib/config/site';
import { panelHref } from '@/lib/config/domain';

export function OrganizatorSetupForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/organizer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          organizationName: name,
          description
        })
      });

      const text = await res.text();
      let data: { error?: string } = {};
      try {
        data = text ? (JSON.parse(text) as { error?: string }) : {};
      } catch {
        throw new Error(
          res.ok
            ? 'Sunucudan geçersiz yanıt alındı'
            : `Sunucu hatası (${res.status}). Lütfen tekrar deneyin.`
        );
      }

      if (!res.ok) throw new Error(data.error || 'Kurulum başarısız');

      window.location.href = panelHref('/organizator-panel/baslangic');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
      setLoading(false);
    }
  }

  return (
    <div className="bg-organizer-header flex min-h-screen items-center justify-center px-4">
      <div className="bg-organizer-sidebar w-full max-w-md rounded-[var(--radius-card)] border border-[var(--ticket-border)] p-8 text-white shadow-xl">
        <p className="text-sm text-primary">{siteConfig.name}</p>
        <h1 className="mt-1 text-2xl font-bold">{ORGANIZATOR_BRAND}</h1>
        <p className="text-organizer-chrome-muted mt-2 text-sm">
          Organizasyon profilinizi oluşturun ve etkinlik satmaya başlayın.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name" className="text-organizer-chrome">
              Organizasyon Adı
            </Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Let Us Event"
              required
              minLength={2}
              className="border-[var(--ticket-border)] bg-organizer-header text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-desc" className="text-organizer-chrome">
              Kısa Açıklama (isteğe bağlı)
            </Label>
            <Input
              id="org-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Konser ve festival organizasyonu"
              className="border-[var(--ticket-border)] bg-organizer-header text-white"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Oluşturuluyor...' : 'Organizatör Paneline Geç'}
          </Button>
        </form>

        <p className="text-organizer-chrome-muted mt-6 text-center text-xs">
          <Link href="/" className="hover:text-white">
            Ana sayfaya dön
          </Link>
        </p>
      </div>
    </div>
  );
}
