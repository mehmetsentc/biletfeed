import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FeedPostType } from '@prisma/client';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { generateArticleFromBrief } from '@/lib/feed/ai-editor';
import { resolveFeedEditor, type FeedEditorId } from '@/lib/feed/editors';
import { isScraperAiReady } from '@/lib/scraper/ai/config';
import { zodErrorMessage } from '@/lib/api/zod-validation';

const editorIdSchema = z.enum(['concert', 'party', 'festival', 'music', 'trend', 'general']);

const schema = z.object({
  brief: z.string().min(10).max(6000),
  contentType: z.nativeEnum(FeedPostType).optional(),
  categorySlug: z.string().max(80).optional().nullable(),
  editorId: editorIdSchema.optional().nullable()
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
      { error: zodErrorMessage(parsed.error), details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const editor = resolveFeedEditor({
    contentType: parsed.data.contentType,
    categorySlug: parsed.data.categorySlug,
    editorId: parsed.data.editorId as FeedEditorId | null | undefined
  });

  try {
    const draft = await generateArticleFromBrief(parsed.data.brief, {
      contentTypeHint: parsed.data.contentType,
      categorySlug: parsed.data.categorySlug,
      editorId: parsed.data.editorId as FeedEditorId | null | undefined
    });
    return NextResponse.json({
      success: true,
      draft,
      editor: { id: editor.id, label: editor.label }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI oluşturma başarısız';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
