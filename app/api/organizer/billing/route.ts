import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerApi } from '@/lib/auth/organizer-route';
import {
  createOrganizerBillingProfile,
  listOrganizerBillingProfiles,
  updateOrganizerAccountHolder
} from '@/lib/services/organizer-billing';

const createSchema = z.object({
  label: z.string().min(1).max(80).optional(),
  iban: z.string().min(15).max(34),
  companyLegalName: z.string().min(2).max(200),
  taxOffice: z.string().min(2).max(120),
  taxNumber: z.string().min(10).max(11),
  invoiceAddress: z.string().min(5).max(500)
});

const accountHolderSchema = z.object({
  accountHolderName: z.string().min(2).max(200)
});

export async function GET() {
  const { error, ctx } = await requireOrganizerApi();
  if (error) return error;

  try {
    const profiles = await listOrganizerBillingProfiles(ctx.organizer.id);
    return NextResponse.json({
      profiles,
      accountHolderName: ctx.organizer.accountHolderName ?? null
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yüklenemedi';
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
    const profile = await createOrganizerBillingProfile(ctx.organizer.id, parsed.data);
    return NextResponse.json({ profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kaydedilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const { error, ctx } = await requireOrganizerApi();
  if (error) return error;

  const json = await request.json();
  const parsed = accountHolderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    await updateOrganizerAccountHolder(ctx.organizer.id, parsed.data.accountHolderName);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kaydedilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
