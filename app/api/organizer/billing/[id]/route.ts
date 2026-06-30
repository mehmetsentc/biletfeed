import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerApi } from '@/lib/auth/organizer-route';
import {
  deleteOrganizerBillingProfile,
  updateOrganizerBillingProfile
} from '@/lib/services/organizer-billing';

const patchSchema = z.object({
  label: z.string().min(1).max(80).optional(),
  iban: z.string().min(15).max(34).optional(),
  companyLegalName: z.string().min(2).max(200).optional(),
  taxOffice: z.string().min(2).max(120).optional(),
  taxNumber: z.string().min(10).max(11).optional(),
  invoiceAddress: z.string().min(5).max(500).optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const { error, ctx } = await requireOrganizerApi();
  if (error) return error;

  const { id } = await params;
  const json = await request.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    const profile = await updateOrganizerBillingProfile(
      ctx.organizer.id,
      id,
      parsed.data
    );
    return NextResponse.json({ profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Güncellenemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const { error, ctx } = await requireOrganizerApi();
  if (error) return error;

  const { id } = await params;

  try {
    await deleteOrganizerBillingProfile(ctx.organizer.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Silinemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
