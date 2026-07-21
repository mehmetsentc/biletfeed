'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ImagePlus, Loader2, Plus, Trash2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FEED_POST_TYPE_LABELS } from '@/lib/feed/constants';
import type { AdminFeedPostEditor, FeedMediaInput } from '@/lib/services/feed';
import type { FeedPostStatus, FeedPostType } from '@prisma/client';
import { adminHref, siteHref } from '@/lib/config/domain';

type CategoryOption = { id: string; slug: string; name: string };

type FeedEditorFormProps =
  | { mode: 'create'; categories: CategoryOption[] }
  | { mode: 'edit'; post: AdminFeedPostEditor; categories: CategoryOption[] };

type MediaRow = FeedMediaInput & { key: string };

function newMediaRow(partial?: Partial<FeedMediaInput>): MediaRow {
  return {
    key: crypto.randomUUID(),
    type: partial?.type ?? 'image',
    url: partial?.url ?? '',
    thumbnail: partial?.thumbnail ?? null,
    alt: partial?.alt ?? null,
    caption: partial?.caption ?? null
  };
}

export function FeedEditorForm(props: FeedEditorFormProps) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const initial = props.mode === 'edit' ? props.post : null;

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: initial?.title ?? '',
    headline: initial?.headline ?? '',
    summary: initial?.summary ?? '',
    content: initial?.content ?? '',
    contentType: (initial?.contentType ?? 'concert_news') as FeedPostType,
    coverImage: initial?.coverImage ?? '',
    tags: (initial?.tags ?? []).join(', '),
    isFeatured: initial?.isFeatured ?? false,
    feedCategoryId: initial?.feedCategoryId ?? '',
    status: (initial?.status ?? 'review') as FeedPostStatus
  });

  const [media, setMedia] = useState<MediaRow[]>(
    initial?.media.map((m) =>
      newMediaRow({
        type: m.type as FeedMediaInput['type'],
        url: m.url,
        thumbnail: m.thumbnail,
        alt: m.alt,
        caption: m.caption
      })
    ) ?? []
  );

  async function uploadCover(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('scope', 'feed');
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Yükleme başarısız');
      setForm((f) => ({ ...f, coverImage: data.url! }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kapak yüklenemedi');
    } finally {
      setUploading(false);
    }
  }

  async function uploadGalleryFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/feed/upload', { method: 'POST', body: fd });
      const data = (await res.json()) as { url?: string; type?: 'image' | 'video'; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Yükleme başarısız');
      setMedia((rows) => [
        ...rows,
        newMediaRow({
          type: data.type === 'video' ? 'video' : 'image',
          url: data.url!,
          alt: file.name
        })
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Medya yüklenemedi');
    } finally {
      setUploading(false);
    }
  }

  function buildPayload() {
    return {
      title: form.title.trim(),
      headline: form.headline.trim() || undefined,
      summary: form.summary.trim(),
      content: form.content.trim(),
      contentType: form.contentType,
      coverImage: form.coverImage,
      tags: form.tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
      isFeatured: form.isFeatured,
      feedCategoryId: form.feedCategoryId || null,
      status: form.status,
      media: media
        .filter((m) => m.url.trim())
        .map(({ type, url, thumbnail, alt, caption }) => ({
          type,
          url: url.trim(),
          thumbnail: thumbnail ?? null,
          alt: alt ?? null,
          caption: caption ?? null
        }))
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.coverImage) {
      setError('Kapak görseli zorunludur');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = buildPayload();

      if (props.mode === 'create') {
        const res = await fetch('/api/admin/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', ...payload })
        });
        const data = (await res.json()) as { id?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Oluşturulamadı');
        router.push(adminHref(`/feed/${data.id}`));
        router.refresh();
        return;
      }

      const res = await fetch(`/api/admin/feed/${props.post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Kaydedilemedi');
      router.push(adminHref('/feed'));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (props.mode !== 'edit') return;
    if (!confirm('Bu haber silinsin mi?')) return;
    await fetch(`/api/admin/feed/${props.post.id}`, { method: 'DELETE' });
    router.push(adminHref('/feed'));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
      {/* Kapak */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Kapak Görseli</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted sm:max-w-xs">
            {form.coverImage ? (
              <Image src={form.coverImage} alt="Kapak" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                Görsel seçin
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadCover(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => coverInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ImagePlus className="mr-2 size-4" />}
              Görsel Yükle
            </Button>
            <div>
              <Label htmlFor="coverUrl">veya URL</Label>
              <Input
                id="coverUrl"
                type="url"
                value={form.coverImage}
                onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </section>

      {/* İçerik */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Haber İçeriği</h2>
        <div>
          <Label htmlFor="title">Başlık *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="headline">Manşet (isteğe bağlı)</Label>
          <Input
            id="headline"
            value={form.headline}
            onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="summary">Özet *</Label>
          <textarea
            id="summary"
            rows={2}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="content">Metin *</Label>
          <textarea
            id="content"
            rows={12}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono leading-relaxed"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Paragraflar arasında boş satır bırakın. ## Alt başlık için markdown kullanabilirsiniz."
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="contentType">İçerik türü</Label>
            <select
              id="contentType"
              value={form.contentType}
              onChange={(e) =>
                setForm((f) => ({ ...f, contentType: e.target.value as FeedPostType }))
              }
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(FEED_POST_TYPE_LABELS).map(([slug, label]) => (
                <option key={slug} value={slug}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="category">Kategori</Label>
            <select
              id="category"
              value={form.feedCategoryId}
              onChange={(e) => setForm((f) => ({ ...f, feedCategoryId: e.target.value }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Seçiniz</option>
              {props.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="status">Durum</Label>
            <select
              id="status"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as FeedPostStatus }))
              }
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="review">İncelemede</option>
              <option value="published">Yayında</option>
              <option value="discovered">Taslak</option>
            </select>
          </div>
          <div>
            <Label htmlFor="tags">Etiketler</Label>
            <Input
              id="tags"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="konser, istanbul, festival"
              className="mt-1"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
          />
          Öne çıkan haber
        </label>
      </section>

      {/* Galeri */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Galeri — Görsel & Video
          </h2>
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadGalleryFile(file);
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => mediaInputRef.current?.click()}
            >
              <Video className="mr-1 size-3.5" />
              Yükle
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setMedia((rows) => [...rows, newMediaRow()])}
            >
              <Plus className="mr-1 size-3.5" />
              URL Ekle
            </Button>
          </div>
        </div>

        {media.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Habere ek görsel veya video ekleyin. Dosya yükleyebilir veya YouTube / harici URL girebilirsiniz.
          </p>
        )}

        <div className="space-y-4">
          {media.map((row, index) => (
            <div key={row.key} className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Medya {index + 1} · {row.type}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive"
                  onClick={() => setMedia((rows) => rows.filter((r) => r.key !== row.key))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Tür</Label>
                  <select
                    value={row.type}
                    onChange={(e) =>
                      setMedia((rows) =>
                        rows.map((r) =>
                          r.key === row.key
                            ? { ...r, type: e.target.value as FeedMediaInput['type'] }
                            : r
                        )
                      )
                    }
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="image">Görsel</option>
                    <option value="video">Video</option>
                    <option value="embed">Embed (YouTube vb.)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label>URL</Label>
                  <Input
                    value={row.url}
                    onChange={(e) =>
                      setMedia((rows) =>
                        rows.map((r) => (r.key === row.key ? { ...r, url: e.target.value } : r))
                      )
                    }
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Altyazı</Label>
                  <Input
                    value={row.caption ?? ''}
                    onChange={(e) =>
                      setMedia((rows) =>
                        rows.map((r) =>
                          r.key === row.key ? { ...r, caption: e.target.value } : r
                        )
                      )
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              {row.type === 'image' && row.url && (
                <div className="relative mt-3 aspect-video max-w-xs overflow-hidden rounded-md border">
                  <Image src={row.url} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? 'Kaydediliyor…' : props.mode === 'create' ? 'Haber Oluştur' : 'Güncelle'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={adminHref('/feed')}>İptal</Link>
        </Button>
        {props.mode === 'edit' && (
          <>
            <Button type="button" variant="outline" asChild>
              <a href={siteHref(`/feed/${props.post.slug}`)} target="_blank" rel="noreferrer">
                Önizle
              </a>
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleDelete()}>
              Sil
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
