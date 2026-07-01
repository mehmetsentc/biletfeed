import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  adminForbidden,
  requireAdminPermission
} from '@/lib/auth/admin-api';
import { approveEvent } from '@/lib/services/event-approvals';

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

  try {
    const event = await approveEvent(id);
    return NextResponse.json({ success: true, event });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onay başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
