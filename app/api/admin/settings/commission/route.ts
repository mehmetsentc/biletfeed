import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation, guardAdminRead } from '@/lib/auth/guard-admin-api';
import {
  getDefaultCommissionRate,
  setDefaultCommissionRate
} from '@/lib/services/platform-settings';

const patchSchema = z.object({
  rate: z.number().min(0).max(1)
});

export async function GET() {
  const guard = await guardAdminRead('settings.manage');
  if ('error' in guard) return guard.error;

  const rate = await getDefaultCommissionRate();
  return NextResponse.json({ rate });
}

export async function PATCH(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'settings.manage');
  if ('error' in guard) return guard.error;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz oran (0–100 arası)' }, { status: 400 });
  }

  try {
    await setDefaultCommissionRate(parsed.data.rate);
    return NextResponse.json({ success: true, rate: parsed.data.rate });
  } catch {
    return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 });
  }
}
