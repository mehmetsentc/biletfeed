'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Plus, X, Check } from 'lucide-react';

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  eventCount: number;
};

type EditState = {
  name: string;
  image: string;
  description: string;
};

export function CategoryAdminPanel({ categories }: { categories: Category[] }) {
  const [list, setList] = useState(categories);
  const [editing, setEditing] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: '', image: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newCat, setNewCat] = useState({ slug: '', name: '', image: '', description: '' });

  function startEdit(cat: Category) {
    setEditing(cat.id);
    setEditState({ name: cat.name, image: cat.image ?? '', description: cat.description ?? '' });
  }

  async function saveEdit(cat: Category) {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: cat.slug, ...editState })
      });
      if (res.ok) {
        setList((prev) =>
          prev.map((c) =>
            c.id === cat.id
              ? { ...c, name: editState.name, image: editState.image || null, description: editState.description || null }
              : c
          )
        );
        setEditing(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveNew() {
    if (!newCat.slug || !newCat.name) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      });
      if (res.ok) {
        const data = (await res.json()) as { category: Category };
        setList((prev) => [...prev, { ...data.category, eventCount: 0 }]);
        setNewCat({ slug: '', name: '', image: '', description: '' });
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
          <Plus className="size-4" /> Yeni Kategori
        </Button>
      </div>

      {showNew && (
        <div className="rounded-lg border border-dashed border-[#f5a623]/50 bg-[#f5a623]/5 p-4">
          <p className="mb-3 font-semibold text-sm">Yeni Kategori</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Slug *</Label>
              <Input className="mt-1 h-8 text-sm" placeholder="muzik" value={newCat.slug}
                onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Ad *</Label>
              <Input className="mt-1 h-8 text-sm" placeholder="Konser / Müzik" value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Görsel URL</Label>
              <Input className="mt-1 h-8 text-sm" placeholder="https://..." value={newCat.image}
                onChange={(e) => setNewCat({ ...newCat, image: e.target.value })} />
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
              <th className="p-3 font-medium">Açıklama</th>
              <th className="p-3 font-medium text-right">Etkinlik</th>
              <th className="p-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {list.map((cat) => (
              <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="p-3">
                  {cat.image ? (
                    <img src={cat.image} alt="" className="size-10 rounded object-cover" />
                  ) : (
                    <div className="size-10 rounded bg-muted" />
                  )}
                </td>
                <td className="p-3 font-mono text-xs text-muted-foreground">{cat.slug}</td>
                <td className="p-3">
                  {editing === cat.id ? (
                    <Input className="h-7 text-sm" value={editState.name}
                      onChange={(e) => setEditState({ ...editState, name: e.target.value })} />
                  ) : (
                    <span className="font-medium">{cat.name}</span>
                  )}
                </td>
                <td className="p-3 max-w-xs">
                  {editing === cat.id ? (
                    <Input className="h-7 text-sm" placeholder="Açıklama..." value={editState.description}
                      onChange={(e) => setEditState({ ...editState, description: e.target.value })} />
                  ) : (
                    <span className="text-xs text-muted-foreground line-clamp-2">{cat.description ?? '—'}</span>
                  )}
                </td>
                <td className="p-3 text-right font-semibold">{cat.eventCount}</td>
                <td className="p-3">
                  {editing === cat.id ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 px-2" disabled={loading}
                        onClick={() => void saveEdit(cat)}>
                        <Check className="size-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2"
                        onClick={() => setEditing(null)}>
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-7 px-2"
                      onClick={() => startEdit(cat)}>
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
