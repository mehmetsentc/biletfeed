import { NextResponse } from 'next/server';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';

export async function requireOrganizerApi() {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return {
      error: NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 }),
      ctx: null as never
    };
  }
  return { error: null, ctx };
}
