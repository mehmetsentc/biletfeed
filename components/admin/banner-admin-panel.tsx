'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical, ExternalLink } from 'lucide-react';

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
};

// Banners stored in localStorage for now (no DB model yet).
// To persist: add Banner model to Prisma + API route.
const DEMO_BANNERS: Banner[] = [
  {
    id: '1',
    title: 'Yaz Festivalleri Başlıyor',
    subtitle: 'Türkiye\'nin en büyük müzik festivalleri biletfeed\'de',
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    linkUrl: '/etkinlikler?kategori=festival',
    active: true
  },
  {
    id: '2',
    title: 'Konser Biletleri',
    subtitle: 'Favori sanatçılarının biletleri için hemen tıkla',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    linkUrl: '/etkinlikler?kategori=muzik',
    active: true
  }
];

export function BannerAdminPanel() {
  const [banners, setBanners] = useState<Banner[]>(DEMO_BANNERS);
  const [showNew, setShowNew] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '' });

  function addBanner() {
    if (!newBanner.title || !newBanner.imageUrl) return;
    const banner: Banner = {
      id: Date.now().toString(),
      ...newBanner,
      active: true
    };
    setBanners((prev) => [...prev, banner]);
    setNewBanner({ title: '', subtitle: '', imageUrl: '', linkUrl: '' });
    setShowNew(false);
  }

  function toggleActive(id: string) {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b)));
  }

  function deleteBanner(id: string) {
    if (!confirm('Bu banner silinsin mi?')) return;
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Not:</strong> Bannerlar şu an oturum bazlı saklanmaktadır. Kalıcı depolama için
        Prisma şemasına <code>Banner</code> modeli ekleyin.
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowNew(true)} className="gap-2">
          <Plus className="size-4" /> Yeni Banner
        </Button>
      </div>

      {showNew && (
        <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
          <p className="mb-3 text-sm font-semibold">Yeni Banner</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Başlık *</Label>
              <Input className="mt-1 h-8 text-sm" value={newBanner.title}
                onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Alt Başlık</Label>
              <Input className="mt-1 h-8 text-sm" value={newBanner.subtitle}
                onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Görsel URL *</Label>
              <Input className="mt-1 h-8 text-sm" placeholder="https://..." value={newBanner.imageUrl}
                onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Link URL</Label>
              <Input className="mt-1 h-8 text-sm" placeholder="/etkinlikler?..." value={newBanner.linkUrl}
                onChange={(e) => setNewBanner({ ...newBanner, linkUrl: e.target.value })} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={addBanner} className="h-8">Ekle</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNew(false)} className="h-8">İptal</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={`flex items-center gap-4 rounded-xl border p-3 transition-opacity ${
              banner.active ? '' : 'opacity-50'
            }`}
          >
            <GripVertical className="size-4 shrink-0 text-muted-foreground" />

            {banner.imageUrl && (
              <img
                src={banner.imageUrl}
                alt=""
                className="h-16 w-28 shrink-0 rounded-lg object-cover"
              />
            )}

            <div className="flex-1 min-w-0">
              <p className="font-semibold">{banner.title}</p>
              <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
              {banner.linkUrl && (
                <a
                  href={banner.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="size-3" />
                  {banner.linkUrl}
                </a>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => toggleActive(banner.id)}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                  banner.active ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-card shadow transition-transform ${
                    banner.active ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-red-500 hover:text-red-700"
                onClick={() => deleteBanner(banner.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
