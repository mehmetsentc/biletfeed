import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FeedPostType } from '@prisma/client';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { generateArticleFromBrief } from '@/lib/feed/ai-editor';
import { isScraperAiReady } from '@/lib/scraper/ai/config';

const schema = z.object({
  brief: z.string().min(10).max(6000),
  contentType: z.nativeEnum(FeedPostType).optional()
});

export async function POST(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'feed.manage');
  if ('error' in guard) return guard.error;

  if (!isScraperAiReady()) {
    return NextResponse.json(
      { error: 'AI sağlayıcısı yapılandırılmamış (API anahtarı eksik)' },
      { status: 503 }
    );
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Geçersiz veri', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const draft = await generateArticleFromBrief(
      parsed.data.brief,
      parsed.data.contentType
    );
    return NextResponse.json({ success: true, draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI oluşturma başarısız';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
