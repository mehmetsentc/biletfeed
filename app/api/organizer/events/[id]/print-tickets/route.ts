import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { PRINT_TICKET_MAX } from '@/lib/tickets/print/constants';
import {
  PrintTicketError,
  createPrintTicketBatch,
  listPrintTicketBatches
} from '@/lib/services/print-tickets';

export const runtime = 'nodejs';
export const maxDuration = 60;

const createSchema = z.object({
  ticketTypeId: z.string().uuid(),
  quantity: z.number().int().min(1).max(PRINT_TICKET_MAX)
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await context.params;
  const batches = await listPrintTicketBatches(ctx.organizer.id, id);
  return NextResponse.json({ batches });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const batch = await createPrintTicketBatch({
      organizerId: ctx.organizer.id,
      eventId: id,
      ticketTypeId: parsed.data.ticketTypeId,
      quantity: parsed.data.quantity
    });
    return NextResponse.json({
      ...batch,
      pdfUrl: `/api/organizer/events/${id}/print-tickets/${batch.orderId}/pdf`
    });
  } catch (err) {
    if (err instanceof PrintTicketError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[print-tickets] create', err);
    return NextResponse.json({ error: 'Baskı bileti oluşturulamadı' }, { status: 500 });
  }
}
