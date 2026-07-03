import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import {
  deleteOrganizerTemplate,
  listOrganizerTemplates,
  saveOrganizerTemplate
} from '@/lib/services/event-rules';

const selectedRuleSchema = z.object({
  ruleId: z.string().uuid(),
  parameterValue: z.string().max(500).optional()
});

const postSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  selectedRules: z.array(selectedRuleSchema).max(100),
  customRules: z.array(z.string().max(500)).max(50)
});

export async function GET(_request: NextRequest) {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const templates = await listOrganizerTemplates(ctx.organizer.id);
    return NextResponse.json({ templates });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Şablonlar yüklenemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const json = await request.json();
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    const template = await saveOrganizerTemplate(ctx.organizer.id, parsed.data);
    return NextResponse.json({ success: true, template });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kayıt başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const templateId = request.nextUrl.searchParams.get('id');
  if (!templateId) {
    return NextResponse.json({ error: 'Şablon ID gerekli' }, { status: 400 });
  }

  try {
    await deleteOrganizerTemplate(ctx.organizer.id, templateId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Silme başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
