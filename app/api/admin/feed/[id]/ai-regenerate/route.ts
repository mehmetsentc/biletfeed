import { NextRequest, NextResponse } from 'next/server';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { getAdminFeedPostById } from '@/lib/services/feed';
import { regeneratePostAsMagazineEditor } from '@/lib/feed/ai-editor';
import { isScraperAiReady } from '@/lib/scraper/ai/config';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Tek tuşla "Festival & Parti Dergisi Editörü" — mevcut haberi DeepSeek ile
 * tamamen yeniden oluşturur (başlık, manşet, özet, H2/H3/H4 yapılandırılmış
 * gövde, etiketler, SEO). Sonucu doğrudan kaydetmez; admin ekranı taslağı
 * forma doldurur, kaydetmek için yine "Güncelle" gerekir.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'feed.manage');
  if ('error' in guard) return guard.error;

  if (!isScraperAiReady()) {
    return NextResponse.json(
      { error: 'AI sağlayıcısı yapılandırılmamış (API anahtarı eksik)' },
      { status: 503 }
    );
  }

  const { id } = await params;
  const post = await getAdminFeedPostById(id);
  if (!post) {
    return NextResponse.json({ error: 'Haber bulunamadı' }, { status: 404 });
  }

  try {
    const draft = await regeneratePostAsMagazineEditor({
      title: post.title,
      headline: post.headline,
      summary: post.summary,
      content: post.content,
      contentType: post.contentType,
      tags: post.tags
    });
    return NextResponse.json({ success: true, draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI yeniden oluşturma başarısız';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
