import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { resolveOrganizerSession } from '@/lib/auth/organizer-api';

export const runtime = 'nodejs';

const bodySchema = z.object({
  eventType: z.string().optional(),
  categorySlug: z.string().optional(),
  tags: z.array(z.string()).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  isOnline: z.boolean().optional(),
  isFree: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const resolved = await resolveOrganizerSession();
  if (!resolved.ok) {
    return NextResponse.json({ error: 'Panel girişi gerekli' }, { status: 401 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    const { suggestRulesWithAI } = await import('@/lib/services/event-rules');
    const result = await suggestRulesWithAI(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Öneri alınamadı';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
