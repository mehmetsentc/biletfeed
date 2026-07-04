import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import {
  renderEventBannerImage,
  type BannerVariant
} from '@/lib/banners/image-engine';

const VARIANTS = new Set<BannerVariant>(['mobile', 'tablet', 'desktop']);

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  const variantRaw = request.nextUrl.searchParams.get('v') ?? 'desktop';
  const variant = VARIANTS.has(variantRaw as BannerVariant)
    ? (variantRaw as BannerVariant)
    : 'desktop';

  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      deletedAt: null,
      status: { in: ['published', 'completed'] }
    },
    select: { coverImage: true, title: true }
  });

  if (!event?.coverImage?.startsWith('http')) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const buffer = await renderEventBannerImage(event.coverImage, variant);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'
      }
    });
  } catch {
    return NextResponse.redirect(event.coverImage, 302);
  }
}
