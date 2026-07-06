import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  resolveOrganizerSession,
  type OrganizerSessionDenyReason
} from '@/lib/auth/organizer-api';
import { zodErrorMessage } from '@/lib/api/zod-validation';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getEventRuleSet } from '@/lib/services/event-rules-query';
import { saveEventRuleSet } from '@/lib/services/event-rules-persist';

const selectedRuleSchema = z.object({
  ruleId: z.string().uuid(),
  parameterValue: z.string().max(500).optional()
});

const announcementSchema = z.object({
  id: z.string().uuid().optional(),
  titleTr: z.string().min(1).max(200),
  titleEn: z.string().max(200).optional(),
  contentTr: z.string().min(1).max(20000),
  contentEn: z.string().max(20000).optional(),
  sortOrder: z.number().int().optional()
});

const putSchema = z.object({
  selectedRules: z.array(selectedRuleSchema).max(100),
  customRules: z.array(z.string().max(500)).max(50),
  appliedTemplateId: z.string().uuid().nullable().optional(),
  announcements: z.array(announcementSchema).max(20).optional()
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

function organizerSessionError(reason: OrganizerSessionDenyReason): NextResponse {
  switch (reason) {
    case 'no_session':
      return NextResponse.json({ error: 'Panel girişi gerekli' }, { status: 401 });
    case 'no_user':
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 401 });
    case 'no_organizer':
      return NextResponse.json(
        { error: 'Organizatör profili bulunamadı. Kurulumu tamamlayın.' },
        { status: 403 }
      );
    case 'suspended':
      return NextResponse.json({ error: 'Hesabınız askıya alındı.' }, { status: 403 });
  }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolved = await resolveOrganizerSession();
  if (!resolved.ok) {
    return organizerSessionError(resolved.reason);
  }

  const { id } = await params;
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id, organizerId: resolved.ctx.organizer.id, deletedAt: null },
    select: { id: true }
  });
  if (!event) {
    return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  }

  const data = await getEventRuleSet(id);
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const resolved = await resolveOrganizerSession();
  if (!resolved.ok) {
    return organizerSessionError(resolved.reason);
  }

  const { id } = await params;
  const json = await request.json();
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const result = await saveEventRuleSet(id, resolved.ctx.organizer.id, parsed.data);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kayıt başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
