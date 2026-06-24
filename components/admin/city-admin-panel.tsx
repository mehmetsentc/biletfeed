'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Plus, X, Check } from 'lucide-react';

type City = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  eventCount: number;
  country: string;
};

export function CityAdminPanel({ cities }: { cities: City[] }) {
  const [list, setList] = useState(cities);
  const [editing, setEditing] = useState<string | null>(null);
  const [editState, setEditState] = useState({ name: '', image: '' });
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newCity, setNewCity] = useState({ slug: '', name: '', image: '' });

  async function saveEdit(city: City) {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: city.slug, name: editState.name, image: editState.image })
      });
      if (res.ok) {
        setList((prev) =>
          prev.map((c) =>
            c.id === city.id ? { ...c, name: editState.name, image: editState.image || null } : c
          )
        );
        setEditing(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveNew() {
    if (!newCity.slug || !newCity.name) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCity)
      });
      if (res.ok) {
        const data = (await res.json()) as { city: City };
        setList((prev) => [...prev, { ...data.city, eventCount: 0 }]);
        setNewCity({ slug: '', name: '', image: '' });
        setShowNew(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowNew(true)} className="gap-2">
          <Plus className="size-4" /> Yeni Şehir
        </Button>
      </div>

      {showNew && (
        <div className="rounded-lg border border-dashed border-[#f5a623]/50 bg-[#f5a623]/5 p-4">
          <p className="mb-3 text-sm font-semibold">Yeni Şehir</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Slug *</Label>
              <Input className="mt-1 h-8 text-sm" placeholder="istanbul" value={newCity.slug}
                onChange={(e) => setNewCity({ ...newCity, slug: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Ad *</Label>
              <Input className="mt-1 h-8 text-sm" placeholder="İstanbul" value={newCity.name}
                onChange={(e) => setNewCity({ ...newCity, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Görsel URL</Label>
              <Input className="mt-1 h-8 text-sm" placeholder="https://..." value={newCity.image}
                onChange={(e) => setNewCity({ ...newCity, image: e.target.value })} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={loading} onClick={() => void saveNew()} className="h-8">Kaydet</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNew(false)} className="h-8">İptal</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Görsel</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Ad</th>
              <th className="p-3 font-medium">Ülke</th>
              <th className="p-3 font-medium text-right">Etkinlik</th>
              <th className="p-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {list.map((city) => (
              <tr key={city.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="p-3">
                  {city.image ? (
                    <img src={city.image} alt="" className="h-10 w-16 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-16 rounded bg-muted" />
                  )}
                </td>
                <td className="p-3 font-mono text-xs text-muted-foreground">{city.slug}</td>
                <td className="p-3">
                  {editing === city.id ? (
                    <Input className="h-7 text-sm" value={editState.name}
                      onChange={(e) => setEditState({ ...editState, name: e.target.value })} />
                  ) : (
                    <span className="font-medium">{city.name}</span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">{city.country}</td>
                <td className="p-3 text-right font-semibold">{city.eventCount}</td>
                <td className="p-3">
                  {editing === city.id ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 px-2" disabled={loading}
                        onClick={() => void saveEdit(city)}>
                        <Check className="size-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2"
                        onClick={() => setEditing(null)}>
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-7 px-2"
                      onClick={() => { setEditing(city.id); setEditState({ name: city.name, image: city.image ?? '' }); }}>
                      <Pencil className="size-3" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
