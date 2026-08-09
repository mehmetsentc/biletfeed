import { describe, expect, it } from 'vitest';
import { resolveFeedEditor } from '@/lib/feed/editors/router';
import {
  extractJsonObject,
  feedAiOutputSchema,
  parseFeedAiOutput
} from '@/lib/feed/editors/schema';
import { finalizeAiDraft, stripLeakedH1 } from '@/lib/feed/editors/base';
import { CONCERT_EDITOR } from '@/lib/feed/editors/concert';
import { PARTY_EDITOR } from '@/lib/feed/editors/party';

describe('resolveFeedEditor', () => {
  it('picks concert from contentType', () => {
    expect(resolveFeedEditor({ contentType: 'concert_news' }).id).toBe('concert');
  });

  it('picks party from eglence category', () => {
    expect(resolveFeedEditor({ categorySlug: 'eglence-haberleri' }).id).toBe('party');
  });

  it('prefers category over contentType', () => {
    expect(
      resolveFeedEditor({
        contentType: 'concert_news',
        categorySlug: 'festival-haberleri'
      }).id
    ).toBe('festival');
  });

  it('prefers explicit editorId', () => {
    expect(
      resolveFeedEditor({
        contentType: 'concert_news',
        categorySlug: 'konser-haberleri',
        editorId: 'party'
      }).id
    ).toBe('party');
  });

  it('maps music + trend', () => {
    expect(resolveFeedEditor({ contentType: 'music_news' }).id).toBe('music');
    expect(resolveFeedEditor({ contentType: 'artist_news' }).id).toBe('music');
    expect(resolveFeedEditor({ categorySlug: 'trend-hikayeler' }).id).toBe('trend');
  });
});

describe('feedAiOutputSchema / parse', () => {
  const sample = {
    title: 'Harbiye’de Yaz Konseri',
    slug: 'harbiyede-yaz-konseri',
    headline: 'Açıkhava sahnesinde büyük buluşma',
    summary: 'Sanatçı bu yaz Harbiye Açıkhava’da sahne alacak. Biletler yakında satışta.',
    content:
      'Lead paragraf buraya gelir ve başlığı tekrarlamaz.\n\n## Kim Sahneye Çıkıyor?\n\nDetay.\n\n## Ne Zaman ve Nerede?\n\nTarih bilgisi.\n\n## Bilet ve Katılım\n\n- Erken bilet\n- Kapı saati',
    excerpt: 'Yaz konseri duyurusu',
    tags: ['konser', 'istanbul', 'harbiye'],
    seoTitle: 'Harbiye Yaz Konseri – Biletler',
    seoDescription:
      'Harbiye Açıkhava yaz konseri tarihi, mekân ve bilet bilgileri BiletFeed’de. Sahne öncesi bilmeniz gerekenler.',
    seoKeywords: ['harbiye konser', 'yaz konseri', 'istanbul konser', 'bilet'],
    isFeatured: true
  };

  it('accepts valid sample output', () => {
    const parsed = parseFeedAiOutput(sample);
    expect(parsed.title).toContain('Harbiye');
    expect(parsed.seoKeywords.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects missing seoKeywords', () => {
    const result = feedAiOutputSchema.safeParse({ ...sample, seoKeywords: [] });
    expect(result.success).toBe(false);
  });

  it('extracts JSON from fenced response', () => {
    const raw = '```json\n' + JSON.stringify(sample) + '\n```';
    const obj = extractJsonObject(raw);
    expect(parseFeedAiOutput(obj).headline).toBe(sample.headline);
  });

  it('finalize strips H1 and builds meta', () => {
    const withH1 = {
      ...sample,
      content: `# ${sample.title}\n\n${sample.content}`
    };
    const draft = finalizeAiDraft(parseFeedAiOutput(withH1), {
      title: 'fallback',
      contentType: 'concert_news',
      editor: CONCERT_EDITOR,
      chat: { provider: 'deepseek', model: 'deepseek-chat' }
    });
    expect(draft.content.startsWith('# ')).toBe(false);
    expect(draft.meta.editorId).toBe('concert');
    expect(draft.slug.length).toBeGreaterThan(3);
    expect(PARTY_EDITOR.id).toBe('party');
  });
});

describe('stripLeakedH1', () => {
  it('removes only single-hash headings', () => {
    const out = stripLeakedH1('# Başlık\n\n## Alt\n\nmetin');
    expect(out).not.toMatch(/^# /m);
    expect(out).toContain('## Alt');
  });
});
