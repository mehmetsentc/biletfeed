'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Loader2,
  Pin,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminImageSourceField } from '@/components/admin/admin-image-source-field';
import type { HomeBannerRecord } from '@/lib/services/home-banners';
import { formatImageSpecHint, IMAGE_SPECS } from '@/lib/config/image-dimensions';
import { getSiteUrl } from '@/lib/config/domain';
import { SUPPORTED_CITIES } from '@/lib/location/cities';

/** Admin subdomaininde relative path → public site (biletfeed.com). */
function resolvePublicBannerHref(linkUrl: string): string {
  const trimmed = linkUrl.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) return trimmed;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return getSiteUrl(path);
}

function cityLabel(slug: string | null): string {
  if (!slug) return 'Tüm şehirler';
  return SUPPORTED_CITIES.find((c) => c.slug === slug)?.name ?? slug;
}

type BannerForm = {
  title: string;
  subtitle: string;
  imageMobile: string;
  imageTablet: string;
  imageDesktop: string;
  linkUrl: string;
  eventId: string;
  citySlug: string;
  isPinned: boolean;
};

const EMPTY_FORM: BannerForm = {
  title: '',
  subtitle: '',
  imageMobile: '',
  imageTablet: '',
  imageDesktop: '',
  linkUrl: '',
  eventId: '',
  citySlug: '',
  isPinned: false
};

type EventOption = {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
};

export function BannerAdminPanel() {
  const [banners, setBanners] = useState<HomeBannerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM);
  const [eventQuery, setEventQuery] = useState('');
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);

  const loadBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/banners', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Bannerlar yüklenemedi');
      const data = (await res.json()) as { banners: HomeBannerRecord[] };
      setBanners(data.banners);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBanners();
  }, [loadBanners]);

  useEffect(() => {
    if (!eventQuery.trim() || eventQuery.length < 2) {
      setEventOptions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetch(
        `/api/admin/banners/events?q=${encodeURIComponent(eventQuery)}`,
        { credentials: 'same-origin' }
      )
        .then((res) => res.json())
        .then((data: { events?: EventOption[] }) => {
          setEventOptions(data.events ?? []);
        })
        .catch(() => setEventOptions([]));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [eventQuery]);

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.title.trim() &&
          form.imageMobile.trim() &&
          form.imageTablet.trim() &&
          form.imageDesktop.trim()
      ),
    [form]
  );

  function applyEvent(event: EventOption) {
    setForm((prev) => ({
      ...prev,
      title: prev.title || event.title,
      linkUrl: `/etkinlik/${event.slug}`,
      eventId: event.id,
      imageMobile: prev.imageMobile || event.coverImage,
      imageTablet: prev.imageTablet || event.coverImage,
      imageDesktop: prev.imageDesktop || event.coverImage
    }));
    setEventQuery(event.title);
    setEventOptions([]);
  }

  function fillAllFromMobile() {
    if (!form.imageMobile) return;
    setForm((prev) => ({
      ...prev,
      imageTablet: prev.imageTablet || prev.imageMobile,
      imageDesktop: prev.imageDesktop || prev.imageMobile
    }));
  }

  async function addBanner() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || null,
          imageMobile: form.imageMobile.trim(),
          imageTablet: form.imageTablet.trim(),
          imageDesktop: form.imageDesktop.trim(),
          linkUrl: form.linkUrl.trim() || null,
          eventId: form.eventId.trim() || null,
          citySlug: form.citySlug.trim() || null,
          isPinned: form.isPinned
        })
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Eklenemedi');
      }
      setForm(EMPTY_FORM);
      setEventQuery('');
      setShowNew(false);
      await loadBanners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eklenemedi');
    } finally {
      setSaving(false);
    }
  }

  async function patchBanner(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/banners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    });
    if (res.ok) await loadBanners();
  }

  async function toggleActive(banner: HomeBannerRecord) {
    await patchBanner(banner.id, { isActive: !banner.isActive });
  }

  async function togglePinned(banner: HomeBannerRecord) {
    await patchBanner(banner.id, { isPinned: !banner.isPinned });
  }

  async function setBannerCity(banner: HomeBannerRecord, citySlug: string) {
    await patchBanner(banner.id, { citySlug: citySlug || null });
  }

  async function deleteBanner(id: string) {
    if (!confirm('Bu banner silinsin mi?')) return;
    const res = await fetch(`/api/admin/banners/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    if (res.ok) await loadBanners();
  }

  async function moveBanner(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= banners.length) return;
    const ordered = [...banners];
    const [item] = ordered.splice(index, 1);
    ordered.splice(target, 0, item);
    setBanners(ordered);
    await fetch('/api/admin/banners/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ orderedIds: ordered.map((b) => b.id) })
    });
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <p>
          Her banner için <strong>mobil</strong>, <strong>tablet</strong> ve{' '}
          <strong>web</strong> görseli ayrı ekleyin. Etkinlik arayıp bağlayarak
          görselleri otomatik doldurabilirsiniz.
        </p>
        <p className="mt-2">
          <strong>Şehir:</strong> yalnızca o şehir seçildiğinde görünür (ör.
          Antalya → BLOK3). <strong>Sabit:</strong> o şehirde carousel dönmez,
          yalnızca bu banner kalır.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowNew(true)} className="gap-2">
          <Plus className="size-4" /> Yeni Banner
        </Button>
      </div>

      {showNew && (
        <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 md:p-6">
          <p className="mb-4 text-sm font-semibold">Yeni öne çıkan banner</p>

          <div className="mb-4">
            <Label className="text-xs">Etkinlik ara (isteğe bağlı)</Label>
            <Input
              className="mt-1"
              placeholder="Konser veya etkinlik adı…"
              value={eventQuery}
              onChange={(e) => setEventQuery(e.target.value)}
            />
            {eventOptions.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-auto rounded-md border bg-background text-sm">
                {eventOptions.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted"
                      onClick={() => applyEvent(event)}
                    >
                      {event.coverImage ? (
                        <img
                          src={event.coverImage}
                          alt=""
                          className="size-10 rounded object-cover"
                        />
                      ) : null}
                      <span>{event.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs">Başlık *</Label>
              <Input
                className="mt-1"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Alt başlık</Label>
              <Input
                className="mt-1"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Şehir</Label>
              <select
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.citySlug}
                onChange={(e) => setForm({ ...form, citySlug: e.target.value })}
              >
                <option value="">Tüm şehirler</option>
                {SUPPORTED_CITIES.map((city) => (
                  <option key={city.slug} value={city.slug}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) =>
                    setForm({ ...form, isPinned: e.target.checked })
                  }
                  className="size-4 rounded border-border"
                />
                <span className="flex items-center gap-1.5">
                  <Pin className="size-3.5 text-[var(--bf-accent-ink)]" />
                  Sabit banner (carousel dönmesin)
                </span>
              </label>
            </div>
            <div className="md:col-span-2">
              <AdminImageSourceField
                label="Mobil görsel *"
                hint={formatImageSpecHint(IMAGE_SPECS.spotlightMobile)}
                value={form.imageMobile}
                onChange={(url) => setForm({ ...form, imageMobile: url })}
                uploadScope="banners"
              />
            </div>
            <div className="md:col-span-2">
              <AdminImageSourceField
                label="Tablet görsel *"
                hint={formatImageSpecHint(IMAGE_SPECS.spotlightTablet)}
                value={form.imageTablet}
                onChange={(url) => setForm({ ...form, imageTablet: url })}
                uploadScope="banners"
              />
            </div>
            <div className="md:col-span-2">
              <AdminImageSourceField
                label="Web görsel *"
                hint={formatImageSpecHint(IMAGE_SPECS.spotlightDesktop)}
                value={form.imageDesktop}
                onChange={(url) => setForm({ ...form, imageDesktop: url })}
                uploadScope="banners"
              />
            </div>
            <div>
              <Label className="text-xs">Link (boşsa etkinlik linki kullanılır)</Label>
              <Input
                className="mt-1"
                placeholder="/etkinlik/…"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void addBanner()} disabled={!canSubmit || saving}>
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
            <Button size="sm" variant="outline" onClick={fillAllFromMobile}>
              Tablet/web = mobil görsel
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowNew(false);
                setForm(EMPTY_FORM);
                setEventQuery('');
              }}
            >
              İptal
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {banners.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz banner yok. Öne çıkarmak istediğiniz etkinlik için banner
            ekleyin — örneğin Antalya + sabit = BLOK3.
          </p>
        ) : null}

        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
              banner.isActive ? '' : 'opacity-50'
            }`}
          >
            <div className="flex shrink-0 gap-2">
              <img
                src={banner.imageDesktop}
                alt=""
                className="hidden h-16 w-28 rounded-lg object-cover lg:block"
              />
              <img
                src={banner.imageMobile}
                alt=""
                className="h-16 w-28 rounded-lg object-cover lg:hidden"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{banner.title}</p>
                {banner.isPinned ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    <Pin className="size-3" />
                    Sabit
                  </span>
                ) : null}
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {cityLabel(banner.citySlug)}
                </span>
              </div>
              {banner.subtitle ? (
                <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
              ) : null}
              {banner.linkUrl ? (
                <a
                  href={resolvePublicBannerHref(banner.linkUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="size-3" />
                  {banner.linkUrl}
                </a>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  value={banner.citySlug ?? ''}
                  onChange={(e) => void setBannerCity(banner, e.target.value)}
                  aria-label="Şehir"
                >
                  <option value="">Tüm şehirler</option>
                  {SUPPORTED_CITIES.map((city) => (
                    <option key={city.slug} value={city.slug}>
                      {city.name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant={banner.isPinned ? 'default' : 'outline'}
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => void togglePinned(banner)}
                >
                  <Pin className="size-3.5" />
                  {banner.isPinned ? 'Sabit' : 'Sabitle'}
                </Button>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={() => void moveBanner(index, -1)}
                disabled={index === 0}
                aria-label="Yukarı taşı"
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={() => void moveBanner(index, 1)}
                disabled={index === banners.length - 1}
                aria-label="Aşağı taşı"
              >
                <ArrowDown className="size-4" />
              </Button>
              <button
                type="button"
                onClick={() => void toggleActive(banner)}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                  banner.isActive ? 'bg-primary' : 'bg-muted'
                }`}
                aria-label="Aktif/pasif"
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-card shadow transition-transform ${
                    banner.isActive ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-red-500 hover:text-red-700"
                onClick={() => void deleteBanner(banner.id)}
                aria-label="Sil"
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
