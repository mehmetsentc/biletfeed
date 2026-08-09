'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  Download,
  ImagePlus,
  Loader2,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FEED_COVER_REQUIRED_MESSAGE,
  FEED_POST_TYPE_LABELS,
  isMissingFeedCoverImage
} from '@/lib/feed/constants';
import { resolveFeedEditor } from '@/lib/feed/editors/router';
import type { FeedEditorId } from '@/lib/feed/editors/types';
import type { AdminFeedPostEditor, FeedMediaInput } from '@/lib/services/feed';
import type { FeedPostStatus, FeedPostType } from '@prisma/client';
import { adminHref, getSiteUrl } from '@/lib/config/domain';

type CategoryOption = { id: string; slug: string; name: string };

type AiDraftMeta = {
  editorId: FeedEditorId;
  editorLabel: string;
  provider: string;
  model: string;
};

type AiDraftResponse = {
  title: string;
  slug?: string;
  headline: string;
  summary: string;
  content: string;
  contentType: FeedPostType;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords?: string[];
  readingTimeMinutes?: number;
  isFeatured?: boolean;
  meta?: AiDraftMeta;
};

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

  const [brief, setBrief] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [lastEditorLabel, setLastEditorLabel] = useState<string | null>(
    typeof initial?.aiMetadata?.editorLabel === 'string'
      ? (initial.aiMetadata.editorLabel as string)
      : null
  );
  const [aiMeta, setAiMeta] = useState<AiDraftMeta | null>(
    initial?.aiProvider && initial?.aiModel
      ? {
          editorId: (typeof initial.aiMetadata?.editorId === 'string'
            ? initial.aiMetadata.editorId
            : 'general') as FeedEditorId,
          editorLabel:
            typeof initial.aiMetadata?.editorLabel === 'string'
              ? (initial.aiMetadata.editorLabel as string)
              : 'AI Editör',
          provider: initial.aiProvider,
          model: initial.aiModel
        }
      : null
  );
  const [readingTimeMinutes, setReadingTimeMinutes] = useState<number | undefined>(
    initial?.readingTimeMinutes
  );

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
    status: (initial?.status ?? 'review') as FeedPostStatus,
    // Eski AI taslaklarında SEO alanları sınırı aşmış olabilir — düzenleme
    // ekranında da kaydetme hatası vermemesi için baştan kırpılır.
    seoTitle: (initial?.seo?.title ?? '').slice(0, 70),
    seoDescription: (initial?.seo?.description ?? '').slice(0, 200),
    seoKeywords: (initial?.seo?.keywords ?? []).join(', ')
  });

  const selectedCategorySlug =
    props.categories.find((c) => c.id === form.feedCategoryId)?.slug ?? null;
  const activeEditor = resolveFeedEditor({
    contentType: form.contentType,
    categorySlug: selectedCategorySlug
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

  async function pullCoverFromSource() {
    if (props.mode !== 'edit' || !props.post.sourceUrl?.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch-cover', postId: props.post.id })
      });
      const data = (await res.json()) as {
        error?: string;
        coverImage?: string;
        fetched?: boolean;
      };
      if (!res.ok || !data.fetched || !data.coverImage) {
        throw new Error(
          data.error ??
            'Kaynakta og:image bulunamadı. Manuel kapak ekleyin; kapaksız yayınlanamaz.'
        );
      }
      setForm((f) => ({ ...f, coverImage: data.coverImage! }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kapak çekilemedi');
    } finally {
      setUploading(false);
    }
  }

  async function generateBrandedCover() {
    if (props.mode !== 'edit') return;
    setUploading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-branded-cover', postId: props.post.id })
      });
      const data = (await res.json()) as {
        error?: string;
        coverImage?: string;
        generated?: boolean;
      };
      if (!res.ok || !data.generated || !data.coverImage) {
        throw new Error(
          data.error ?? 'Marka kapak üretilemedi. Manuel kapak ekleyin; kapaksız yayınlanamaz.'
        );
      }
      setForm((f) => ({ ...f, coverImage: data.coverImage! }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Marka kapak üretilemedi');
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

  function applyAiDraft(draft: AiDraftResponse, editorLabel?: string) {
    const coverOk = !isMissingFeedCoverImage(form.coverImage);
    setForm((f) => ({
      ...f,
      title: draft.title,
      headline: draft.headline,
      summary: draft.summary,
      content: draft.content,
      contentType: draft.contentType,
      tags: draft.tags.map((t) => t.replace(/^#/, '')).join(', '),
      seoTitle: draft.seoTitle.slice(0, 70),
      seoDescription: draft.seoDescription.slice(0, 200),
      seoKeywords: (draft.seoKeywords ?? []).join(', '),
      // AI isFeatured yalnızca kapak varken öneri olarak uygulanır
      isFeatured: coverOk && draft.isFeatured === true ? true : f.isFeatured && coverOk
    }));
    if (draft.readingTimeMinutes) setReadingTimeMinutes(draft.readingTimeMinutes);
    if (draft.meta) {
      setAiMeta(draft.meta);
      setLastEditorLabel(draft.meta.editorLabel);
    } else if (editorLabel) {
      setLastEditorLabel(editorLabel);
    }
  }

  async function handleGenerateWithAi() {
    if (!brief.trim() || brief.trim().length < 10) {
      setAiError('Lütfen en az birkaç cümlelik bir haber içeriği/notu girin');
      return;
    }
    setGenerating(true);
    setAiError(null);
    try {
      const res = await fetch('/api/admin/feed/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: brief.trim(),
          contentType: form.contentType,
          categorySlug: selectedCategorySlug
        })
      });
      const data = (await res.json()) as {
        draft?: AiDraftResponse;
        editor?: { id: string; label: string };
        error?: string;
      };
      if (!res.ok || !data.draft) throw new Error(data.error ?? 'AI oluşturma başarısız');
      applyAiDraft(data.draft, data.editor?.label);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI oluşturma başarısız');
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerateAsMagazineEditor() {
    if (props.mode !== 'edit') return;
    if (
      !confirm(
        `Bu haberin başlığı, manşeti, özeti, gövde metni, etiketleri ve SEO alanları DeepSeek + ${activeEditor.label} tarafından tamamen yeniden yazılacak. Formu doldurduktan sonra kaydetmeden önce gözden geçirebilirsiniz. Devam edilsin mi?`
      )
    ) {
      return;
    }
    setRegenerating(true);
    setRegenerateError(null);
    try {
      const res = await fetch(`/api/admin/feed/${props.post.id}/ai-regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: form.contentType,
          categorySlug: selectedCategorySlug
        })
      });
      const data = (await res.json()) as {
        draft?: AiDraftResponse;
        editor?: { id: string; label: string };
        error?: string;
      };
      if (!res.ok || !data.draft) throw new Error(data.error ?? 'AI yeniden oluşturma başarısız');
      applyAiDraft(data.draft, data.editor?.label);
    } catch (err) {
      setRegenerateError(err instanceof Error ? err.message : 'AI yeniden oluşturma başarısız');
    } finally {
      setRegenerating(false);
    }
  }

  function buildPayload() {
    const keywords = form.seoKeywords
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12);
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
      seo: {
        title: form.seoTitle.trim().slice(0, 70) || undefined,
        description: form.seoDescription.trim().slice(0, 200) || undefined,
        ...(keywords.length ? { keywords } : {})
      },
      ...(readingTimeMinutes ? { readingTimeMinutes } : {}),
      ...(aiMeta
        ? {
            aiProvider: aiMeta.provider,
            aiModel: aiMeta.model,
            aiMetadata: {
              editorId: aiMeta.editorId,
              editorLabel: aiMeta.editorLabel,
              ranAt: new Date().toISOString()
            }
          }
        : {}),
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

  const missingCover = isMissingFeedCoverImage(form.coverImage);
  const canPullCover =
    props.mode === 'edit' &&
    missingCover &&
    Boolean(props.post.sourceUrl?.trim());
  const canBrandedCover =
    props.mode === 'edit' && missingCover && Boolean(form.title.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingCover && (form.status === 'published' || form.isFeatured)) {
      setError(FEED_COVER_REQUIRED_MESSAGE);
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
      {/* AI Editör */}
      <section className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            AI Editör — Haberi Otomatik Oluştur
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Ham haber notunu yapıştırın. Aktif specialty:{' '}
          <span className="font-medium text-foreground">{activeEditor.label}</span>
          {' — '}
          içerik türü ve kategori seçimine göre Konser / Party / Festival / Müzik / Trend editörü
          çalışır. Zod şema + DeepSeek; kaydetmeden önce gözden geçirin.
        </p>
        <p className="text-[11px] text-muted-foreground">
          İpucu: Konser → içerik türü &quot;Konser Haberi&quot; veya kategori &quot;Konser
          Haberleri&quot;. Party → &quot;Eğlence Haberi&quot; / kategori &quot;Eğlence Haberi&quot;.
        </p>
        <textarea
          rows={4}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Örn: Mabel Matiz, 15 Ağustos'ta Harbiye Açıkhava'da sahne alacak. Bilet fiyatları 500 TL'den başlıyor..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {aiError && <p className="text-sm text-destructive">{aiError}</p>}
        {lastEditorLabel && (
          <p className="text-xs text-muted-foreground">Son çalışan editör: {lastEditorLabel}</p>
        )}
        <Button type="button" size="sm" disabled={generating} onClick={() => void handleGenerateWithAi()}>
          {generating ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 size-4" />
          )}
          {generating ? 'Oluşturuluyor…' : `AI ile Oluştur (${activeEditor.label})`}
        </Button>

        {props.mode === 'edit' && (
          <div className="mt-2 border-t border-primary/20 pt-4">
            <p className="mb-2 text-xs text-muted-foreground">
              Mevcut haberi DeepSeek + {activeEditor.label} ile sıfırdan yeniden yazdırın — başlık,
              manşet, özet, H2 gövde, etiketler ve SEO alanları yeniden oluşturulur.
            </p>
            {regenerateError && <p className="mb-2 text-sm text-destructive">{regenerateError}</p>}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={regenerating}
              onClick={() => void handleRegenerateAsMagazineEditor()}
              className="border-primary/40"
            >
              {regenerating ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              {regenerating
                ? 'Yeniden yazılıyor…'
                : `${activeEditor.label} — Yeniden Oluştur`}
            </Button>
          </div>
        )}
      </section>

      {/* Kapak */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Kapak Görseli</h2>
        {missingCover && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">Görsel eksik</p>
              <p className="mt-0.5 text-[13px] leading-snug opacity-90">
                Kapak olmadan yayınlayamaz veya öne çıkaramazsınız. Taslak / incelemede
                kaydedebilirsiniz; feed&apos;de görünmesi için gerçek bir kapak ekleyin.
                {canPullCover
                  ? ' Kaynak URL varsa “Kaynaktan kapak çek” ile og:image denenebilir.'
                  : ''}
              </p>
            </div>
          </div>
        )}
        {props.mode === 'edit' && (props.post.viewCount > 0 || props.post.ctaClickCount > 0) && (
          <p className="text-xs text-muted-foreground">
            Görüntülenme: {props.post.viewCount.toLocaleString('tr-TR')}
            {' · '}
            CTA tıklama: {props.post.ctaClickCount.toLocaleString('tr-TR')}
          </p>
        )}
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
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => coverInputRef.current?.click()}
              >
                {uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ImagePlus className="mr-2 size-4" />}
                Görsel Yükle
              </Button>
              {canPullCover && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => void pullCoverFromSource()}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 size-4" />
                  )}
                  Kaynaktan kapak çek
                </Button>
              )}
              {canBrandedCover && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => void generateBrandedCover()}
                  title="Koyu BiletFeed marka kapağı üret"
                >
                  {uploading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Palette className="mr-2 size-4" />
                  )}
                  Marka kapak üret
                </Button>
              )}
            </div>
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
              onChange={(e) => {
                const next = e.target.value as FeedPostStatus;
                if (missingCover && next === 'published') {
                  setError(FEED_COVER_REQUIRED_MESSAGE);
                  return;
                }
                setForm((f) => ({ ...f, status: next }));
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="review">İncelemede</option>
              <option value="published" disabled={missingCover}>
                Yayında{missingCover ? ' (görsel gerekli)' : ''}
              </option>
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
            disabled={missingCover}
            onChange={(e) => {
              if (missingCover && e.target.checked) {
                setError(FEED_COVER_REQUIRED_MESSAGE);
                return;
              }
              setForm((f) => ({ ...f, isFeatured: e.target.checked }));
            }}
          />
          Öne çıkan haber
          {missingCover ? (
            <span className="text-xs text-amber-700 dark:text-amber-300">(görsel gerekli)</span>
          ) : null}
        </label>
      </section>

      {/* SEO */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">SEO</h2>
        <div>
          <Label htmlFor="seoTitle">SEO Başlık</Label>
          <Input
            id="seoTitle"
            value={form.seoTitle}
            onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
            placeholder={form.title || 'Arama sonuçlarında görünecek başlık'}
            maxLength={70}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">{form.seoTitle.length}/70</p>
        </div>
        <div>
          <Label htmlFor="seoDescription">SEO Açıklama</Label>
          <textarea
            id="seoDescription"
            rows={2}
            value={form.seoDescription}
            onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
            placeholder={form.summary || 'Arama sonuçlarında görünecek açıklama'}
            maxLength={200}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">{form.seoDescription.length}/200</p>
        </div>
        <div>
          <Label htmlFor="seoKeywords">SEO Anahtar Kelimeler</Label>
          <Input
            id="seoKeywords"
            value={form.seoKeywords}
            onChange={(e) => setForm((f) => ({ ...f, seoKeywords: e.target.value }))}
            placeholder="konser, istanbul, festival"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">Virgülle ayırın (en fazla 12)</p>
        </div>
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
              <a href={getSiteUrl(`/feed/${props.post.slug}`)} target="_blank" rel="noreferrer">
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
