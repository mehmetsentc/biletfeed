import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerApi } from '@/lib/auth/organizer-route';
import {
  createOrganizerSupportTicket,
  getOrganizerSupportTickets
} from '@/lib/services/organizer-panel';

const createSchema = z.object({
  subject: z.string().min(3).max(160),
  body: z.string().min(10).max(4000)
});

export async function GET() {
  const { error, ctx } = await requireOrganizerApi();
  if (error) return error;

  try {
    const tickets = await getOrganizerSupportTickets(ctx.organizer.id);
    return NextResponse.json({ tickets });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Talepler yüklenemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const { error, ctx } = await requireOrganizerApi();
  if (error) return error;

  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    const ticket = await createOrganizerSupportTicket(ctx.organizer.id, parsed.data);
    return NextResponse.json({ ticket });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Talep oluşturulamadı';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
