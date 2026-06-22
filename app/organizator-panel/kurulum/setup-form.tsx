'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ORGANIZATOR_BRAND } from '@/components/organizator-panel/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { siteConfig } from '@/lib/config/site';

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
        body: JSON.stringify({
          organizationName: name,
          description
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kurulum başarısız');

      window.location.href = '/organizator-panel/baslangic';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1f2327] px-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#2b3035] p-8 text-white shadow-xl">
        <p className="text-sm text-[#f5a623]">{siteConfig.name}</p>
        <h1 className="mt-1 text-2xl font-bold">{ORGANIZATOR_BRAND}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Organizasyon profilinizi oluşturun ve etkinlik satmaya başlayın.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name" className="text-zinc-200">
              Organizasyon Adı
            </Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Let Us Event"
              required
              minLength={2}
              className="border-white/10 bg-[#1f2327] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-desc" className="text-zinc-200">
              Kısa Açıklama (isteğe bağlı)
            </Label>
            <Input
              id="org-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Konser ve festival organizasyonu"
              className="border-white/10 bg-[#1f2327] text-white"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-[#f5a623] text-black hover:bg-[#e09510]"
            disabled={loading}
          >
            {loading ? 'Oluşturuluyor...' : 'Organizatör Paneline Geç'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">
            Ana sayfaya dön
          </Link>
        </p>
      </div>
    </div>
  );
}
