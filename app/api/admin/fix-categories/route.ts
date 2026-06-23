import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { recategorizePublishedEvents } from '@/lib/scraper/recategorize-events';

export const dynamic = 'force-dynamic';

const CATEGORY_NAMES: Record<string, string> = {
  muzik: 'Konser',
  festival: 'Festival',
  tiyatro: 'Tiyatro',
  spor: 'Spor',
  teknoloji: 'Workshop',
  online: 'Online',
  sanat: 'Sanat',
  komedi: 'Komedi',
  cocuk: 'Çocuk'
};

/** POST /api/admin/fix-categories — kategori adlarını düzeltir; ?recategorize=1 ile etkinlikleri yeniden eşleştirir */
export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  await ensureDbConnection();

  const results: Record<string, number> = {};
  for (const [slug, name] of Object.entries(CATEGORY_NAMES)) {
    const { count } = await prisma.category.updateMany({
      where: { slug },
      data: { name }
    });
    results[slug] = count;
  }

  const shouldRecategorize =
    request.nextUrl.searchParams.get('recategorize') === '1';

  const recategorized = shouldRecategorize
    ? await recategorizePublishedEvents()
    : null;

  return NextResponse.json({ ok: true, updated: results, recategorized });
}
