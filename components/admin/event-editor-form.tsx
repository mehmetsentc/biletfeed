'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MockEvent } from '@/lib/data/mock-events';

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const ist = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
}

interface EventEditorFormProps {
  event: MockEvent;
}

export function EventEditorForm({ event }: EventEditorFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: event.title,
    description: event.description,
    shortDescription: event.shortDescription,
    coverImage: event.coverImage,
    venue: event.venue,
    address: event.address,
    cityName: event.city,
    categorySlug: event.categorySlug || 'diger',
    startDate: toDatetimeLocalValue(event.startDate),
    endDate: toDatetimeLocalValue(event.endDate),
    basePrice: String(event.price),
    isFree: event.isFree,
    externalUrl: event.externalUrl || ''
  });

  const CATEGORIES = [
    { slug: 'muzik', label: '🎵 Konser / Müzik' },
    { slug: 'tiyatro', label: '🎭 Tiyatro' },
    { slug: 'festival', label: '🎪 Festival' },
    { slug: 'spor', label: '⚽ Spor' },
    { slug: 'sanat', label: '🎨 Sanat' },
    { slug: 'komedi', label: '😄 Komedi' },
    { slug: 'cocuk', label: '🧒 Çocuk / Aile' },
    { slug: 'teknoloji', label: '💻 Workshop / Atölye' },
    { slug: 'online', label: '🌐 Online' },
    { slug: 'diger', label: '📌 Diğer' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          shortDescription: form.shortDescription,
          coverImage: form.coverImage,
          venue: form.venue,
          address: form.address,
          cityName: form.cityName,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          basePrice: Number(form.basePrice) || 0,
          categorySlug: form.categorySlug,
          isFree: form.isFree,
          externalUrl: form.externalUrl,
          tags: event.tags.filter(
            (t) => t !== 'eksik-gorsel' && t !== 'eksik-aciklama'
          )
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Kaydedilemedi');
      }

      router.push('/admin/etkinlikler');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Bu etkinlik silinsin mi?')) return;
    await fetch(`/api/admin/events/${event.id}`, { method: 'DELETE' });
    router.push('/admin/etkinlikler');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start gap-6">
        <div className="relative size-32 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {form.coverImage ? (
            <Image
              src={form.coverImage}
              alt={form.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              Görsel yok
            </div>
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="coverImage">Kapak görseli URL</Label>
            <Input
              id="coverImage"
              type="url"
              value={form.coverImage}
              onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="categorySlug">Kategori</Label>
          <select
            id="categorySlug"
            value={form.categorySlug}
            onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="cityName">Şehir</Label>
          <Input
            id="cityName"
            value={form.cityName}
            onChange={(e) => setForm({ ...form, cityName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="venue">Mekan</Label>
          <Input
            id="venue"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address">Adres</Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="startDate">Başlangıç</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="endDate">Bitiş</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="basePrice">Fiyat (₺)</Label>
          <Input
            id="basePrice"
            type="number"
            min={0}
            value={form.basePrice}
            onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            disabled={form.isFree}
          />
        </div>
        <div className="flex items-end gap-2 pb-2">
          <input
            id="isFree"
            type="checkbox"
            checked={form.isFree}
            onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
          />
          <Label htmlFor="isFree">Ücretsiz</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="shortDescription">Kısa açıklama</Label>
        <Input
          id="shortDescription"
          value={form.shortDescription}
          onChange={(e) =>
            setForm({ ...form, shortDescription: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="description">Açıklama</Label>
        <textarea
          id="description"
          rows={8}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="externalUrl">Bilet linki (kaynak)</Label>
        <Input
          id="externalUrl"
          type="url"
          value={form.externalUrl}
          onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          İptal
        </Button>
        <Button type="button" variant="destructive" onClick={handleDelete}>
          Sil
        </Button>
      </div>
    </form>
  );
}
