import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerApi } from '@/lib/auth/organizer-route';
import {
  createOrganizerVenue,
  getOrganizerVenues
} from '@/lib/services/organizer-panel';
import { seatPlanSchema } from '@/lib/api/seat-plan-schema';

const createSchema = z.object({
  name: z.string().min(2).max(120),
  address: z.string().min(2).max(300),
  citySlug: z.string().min(1),
  capacity: z.number().int().min(1).max(100000).optional(),
  description: z.string().max(500).optional(),
  seatPlan: seatPlanSchema.optional()
});

export async function GET() {
  const { error, ctx } = await requireOrganizerApi();
  if (error) return error;

  try {
    const venues = await getOrganizerVenues(ctx.organizer.id);
    return NextResponse.json({ venues });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mekanlar yüklenemedi';
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
    const venue = await createOrganizerVenue(ctx.organizer.id, parsed.data);
    return NextResponse.json({ venue });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mekan oluşturulamadı';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
