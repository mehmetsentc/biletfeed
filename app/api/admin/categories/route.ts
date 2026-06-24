import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifySessionCookie, sessionHasRole } from '@/lib/auth/session';
import { upsertCategory } from '@/lib/services/admin-dashboard';

const schema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  image: z.string().url().optional().or(z.literal('')),
  description: z.string().optional()
});

export async function POST(request: NextRequest) {
  const session = await verifySessionCookie();
  if (!session || !sessionHasRole(session, 'ROLE_ADMIN')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });

  try {
    const cat = await upsertCategory(parsed.data);
    return NextResponse.json({ success: true, category: cat });
  } catch {
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 });
  }
}
