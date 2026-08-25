'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MultiImagePicker } from '@/components/organizator-panel/multi-image-picker';
import {
  IMAGE_SPECS,
  formatImageSpecHint
} from '@/lib/config/image-dimensions';
import type { SeatPlan } from '@/lib/services/organizer-panel';

type City = { slug: string; name: string };
type VenueRow = {
  id: string;
  name: string;
  address: string;
  capacity: number | null;
  image?: string | null;
  gallery?: string[];
  seatPlan: SeatPlan;
  seatPlanDraft?: SeatPlan | null;
  city: { name: string; slug: string };
};

export function VenuesManager({
  cities,
  initialVenues
}: {
  cities: City[];
  initialVenues: VenueRow[];
}) {
  const [venues, setVenues] = useState(initialVenues);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [citySlug, setCitySlug] = useState(cities[0]?.slug || 'istanbul');
  const [capacity, setCapacity] = useState('500');
  const [rows, setRows] = useState('10');
  const [seatsPerRow, setSeatsPerRow] = useState('20');
  const [imageUrl, setImageUrl] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mediaVenueId, setMediaVenueId] = useState<string | null>(null);
  const [mediaImage, setMediaImage] = useState('');
  const [mediaGallery, setMediaGallery] = useState<string[]>([]);
  const [mediaSaving, setMediaSaving] = useState(false);
  const [aiBusyId, setAiBusyId] = useState<string | null>(null);
  const [mapUrlByVenue, setMapUrlByVenue] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    const res = await fetch('/api/organizer/venues', { credentials: 'same-origin' });
    const data = await res.json();
    if (res.ok) setVenues(data.venues);
  }, []);

  async function createVenue(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const seatPlan: SeatPlan = {
      layout: 'general',
      rows: Number(rows) || 10,
      seatsPerRow: Number(seatsPerRow) || 20
    };
    const res = await fetch('/api/organizer/venues', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        address,
        citySlug,
        capacity: Number(capacity) || undefined,
        seatPlan,
        ...(imageUrl.trim().startsWith('http') ? { image: imageUrl.trim() } : {}),
        gallery
      })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Mekan eklenemedi');
      return;
    }
    setName('');
    setAddress('');
    setImageUrl('');
    setGallery([]);
    await reload();
  }

  async function saveSeatPlan(venueId: string, plan: SeatPlan, cap: number) {
    setEditingId(venueId);
    const res = await fetch(`/api/organizer/venues/${venueId}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatPlan: plan, capacity: cap })
    });
    setEditingId(null);
    if (res.ok) await reload();
  }

  function openMediaEditor(venue: VenueRow) {
    setMediaVenueId(venue.id);
    setMediaImage(venue.image ?? '');
    setMediaGallery((venue.gallery ?? []).filter((u) => u.startsWith('http')).slice(0, 4));
  }

  async function saveMedia() {
    if (!mediaVenueId) return;
    setMediaSaving(true);
    setError(null);
    const res = await fetch(`/api/organizer/venues/${mediaVenueId}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: mediaImage.trim().startsWith('http') ? mediaImage.trim() : null,
        gallery: mediaGallery
      })
    });
    const data = await res.json();
    setMediaSaving(false);
    if (!res.ok) {
      setError(data.error || 'Görseller kaydedilemedi');
      return;
    }
    setMediaVenueId(null);
    await reload();
  }

  async function runAiGenerate(venue: VenueRow) {
    setAiBusyId(venue.id);
    setError(null);
    const mapImageUrl =
      mapUrlByVenue[venue.id]?.trim() ||
      venue.seatPlan?.mapImageUrl ||
      undefined;
    const res = await fetch(`/api/organizer/venues/${venue.id}/seat-plan?action=generate`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapImageUrl ? { mapImageUrl } : {})
    });
    const data = await res.json();
    setAiBusyId(null);
    if (!res.ok) {
      setError(data.error || 'AI taslak üretilemedi');
      return;
    }
    await reload();
  }

  async function runAiConfirm(venueId: string) {
    setAiBusyId(venueId);
    setError(null);
    const res = await fetch(`/api/organizer/venues/${venueId}/seat-plan?action=confirm`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    setAiBusyId(null);
    if (!res.ok) {
      setError(data.error || 'Taslak onaylanamadı');
      return;
    }
    await reload();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni Mekan Ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createVenue} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Mekan Adı</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Şehir</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={citySlug}
                onChange={(e) => setCitySlug(e.target.value)}
              >
                {cities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Adres</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Kapasite</Label>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Koltuk — Sıra × Koltuk</Label>
              <div className="flex gap-2">
                <Input type="number" value={rows} onChange={(e) => setRows(e.target.value)} placeholder="Sıra" />
                <Input
                  type="number"
                  value={seatsPerRow}
                  onChange={(e) => setSeatsPerRow(e.target.value)}
                  placeholder="Koltuk"
                />
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Kapak görseli URL</Label>
              <p className="text-xs text-muted-foreground">
                {formatImageSpecHint(IMAGE_SPECS.venueHero)}
              </p>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Galeri (en fazla 4)</Label>
              <MultiImagePicker
                urls={gallery}
                onChange={setGallery}
                maxCount={4}
                spec={IMAGE_SPECS.venueGallery}
              />
            </div>
            {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Kaydediliyor…' : 'Mekan Kaydet'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {mediaVenueId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mekan görselleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Kapak URL</Label>
              <p className="text-xs text-muted-foreground">
                {formatImageSpecHint(IMAGE_SPECS.venueHero)}
              </p>
              <Input value={mediaImage} onChange={(e) => setMediaImage(e.target.value)} />
            </div>
            <MultiImagePicker
              urls={mediaGallery}
              onChange={setMediaGallery}
              maxCount={4}
              spec={IMAGE_SPECS.venueGallery}
            />
            <div className="flex gap-2">
              <Button type="button" onClick={saveMedia} disabled={mediaSaving}>
                {mediaSaving ? 'Kaydediliyor…' : 'Kaydet'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setMediaVenueId(null)}>
                İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted text-left">
            <tr>
              <th className="p-3 font-medium">Mekan</th>
              <th className="p-3 font-medium">Şehir</th>
              <th className="p-3 font-medium">Kapasite</th>
              <th className="p-3 font-medium">Koltuk Planı</th>
              <th className="p-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((venue) => {
              const plan = (venue.seatPlan || {}) as SeatPlan;
              const draft = venue.seatPlanDraft;
              const zoneCount = plan.zones?.length ?? 0;
              const unitCount =
                plan.zones?.reduce((n, z) => n + (z.units?.length ?? 0), 0) ?? 0;
              const totalSeats =
                unitCount > 0
                  ? unitCount
                  : plan.rows && plan.seatsPerRow
                    ? plan.rows * plan.seatsPerRow
                    : venue.capacity ?? 0;
              return (
                <tr key={venue.id} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{venue.name}</p>
                    <p className="text-xs text-muted-foreground">{venue.address}</p>
                    <Input
                      className="mt-2 h-8 text-xs"
                      placeholder="Harita görseli URL (AI için)"
                      value={mapUrlByVenue[venue.id] ?? plan.mapImageUrl ?? ''}
                      onChange={(e) =>
                        setMapUrlByVenue((prev) => ({
                          ...prev,
                          [venue.id]: e.target.value
                        }))
                      }
                    />
                  </td>
                  <td className="p-3">{venue.city.name}</td>
                  <td className="p-3">{(venue.capacity ?? totalSeats) || '—'}</td>
                  <td className="p-3">
                    {zoneCount > 0 ? (
                      <Badge variant="secondary">
                        {zoneCount} bölge · {unitCount} koltuk
                      </Badge>
                    ) : plan.rows && plan.seatsPerRow ? (
                      <Badge variant="secondary">
                        {plan.rows} sıra × {plan.seatsPerRow} koltuk
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Plan yok</span>
                    )}
                    {draft?.zones?.length ? (
                      <p className="mt-1 text-xs text-amber-700">
                        AI taslak: {draft.zones.length} bölge — onay bekliyor
                      </p>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openMediaEditor(venue)}>
                        Görseller
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={aiBusyId === venue.id}
                        onClick={() => void runAiGenerate(venue)}
                      >
                        {aiBusyId === venue.id ? 'AI…' : 'AI taslak'}
                      </Button>
                      {draft?.zones?.length ? (
                        <Button
                          size="sm"
                          disabled={aiBusyId === venue.id}
                          onClick={() => void runAiConfirm(venue.id)}
                        >
                          Taslağı onayla
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={editingId === venue.id}
                        onClick={() =>
                          saveSeatPlan(
                            venue.id,
                            {
                              layout: 'general',
                              rows: plan.rows || 10,
                              seatsPerRow: plan.seatsPerRow || 20,
                              mapImageUrl: plan.mapImageUrl
                            },
                            totalSeats || venue.capacity || 500
                          )
                        }
                      >
                        Grid plan
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {venues.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Henüz mekan yok. Yukarıdan ekleyin veya etkinlik oluştururken mekan tanımlayın.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
