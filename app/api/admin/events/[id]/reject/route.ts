import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  adminForbidden,
  requireAdminPermission
} from '@/lib/auth/admin-api';
import { rejectEvent } from '@/lib/services/event-approvals';

const bodySchema = z.object({
  reason: z.string().max(500).optional()
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireAdminPermission('events.approve');
  if (!ctx) return adminForbidden();

  const { id } = await params;
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);

  try {
    const event = await rejectEvent(id);
    return NextResponse.json({
      success: true,
      event,
      reason: parsed.success ? parsed.data.reason : undefined
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reddetme başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
