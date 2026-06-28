'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SeatPlan } from '@/lib/services/organizer-panel';

type City = { slug: string; name: string };
type VenueRow = {
  id: string;
  name: string;
  address: string;
  capacity: number | null;
  seatPlan: SeatPlan;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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
        seatPlan
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
                <Input type="number" value={seatsPerRow} onChange={(e) => setSeatsPerRow(e.target.value)} placeholder="Koltuk" />
              </div>
            </div>
            {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={loading} className="">
                {loading ? 'Kaydediliyor…' : 'Mekan Kaydet'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
              const totalSeats =
                plan.rows && plan.seatsPerRow
                  ? plan.rows * plan.seatsPerRow
                  : venue.capacity ?? 0;
              return (
                <tr key={venue.id} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{venue.name}</p>
                    <p className="text-xs text-muted-foreground">{venue.address}</p>
                  </td>
                  <td className="p-3">{venue.city.name}</td>
                  <td className="p-3">{(venue.capacity ?? totalSeats) || '—'}</td>
                  <td className="p-3">
                    {plan.rows && plan.seatsPerRow ? (
                      <Badge variant="secondary">
                        {plan.rows} sıra × {plan.seatsPerRow} koltuk
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Genel giriş</span>
                    )}
                  </td>
                  <td className="p-3">
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
                            seatsPerRow: plan.seatsPerRow || 20
                          },
                          totalSeats || venue.capacity || 500
                        )
                      }
                    >
                      Planı Onayla
                    </Button>
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
