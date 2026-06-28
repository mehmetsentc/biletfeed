'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Settings = {
  name: string;
  description: string;
  contactEmail: string | null;
  contactPhone: string | null;
  notifyEmail: boolean;
  notifySms: boolean;
  instagram?: string;
  website?: string;
};

export function OrganizerSettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    const res = await fetch('/api/organizer/profile', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        notifyEmail: form.notifyEmail,
        notifySms: form.notifySms,
        socialLinks: {
          instagram: form.instagram || '',
          website: form.website || ''
        }
      })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Kaydedilemedi');
      return;
    }
    setSaved(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organizasyon Ayarları</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid max-w-xl gap-4">
          <div className="space-y-2">
            <Label>Organizasyon Adı</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Açıklama</Label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>İletişim E-postası</Label>
            <Input
              type="email"
              value={form.contactEmail || ''}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefon</Label>
            <Input
              value={form.contactPhone || ''}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input
              value={form.instagram || ''}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="@letusevent"
            />
          </div>
          <div className="space-y-2">
            <Label>Web Sitesi</Label>
            <Input
              value={form.website || ''}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.notifyEmail}
              onChange={(e) => setForm({ ...form, notifyEmail: e.target.checked })}
            />
            E-posta bildirimleri
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.notifySms}
              onChange={(e) => setForm({ ...form, notifySms: e.target.checked })}
            />
            SMS bildirimleri
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-[var(--bf-success)]">Ayarlar kaydedildi.</p>}
          <Button type="submit" disabled={loading} className="w-fit">
            {loading ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
