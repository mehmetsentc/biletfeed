#!/usr/bin/env tsx
/**
 * Yayınlanmış ama kapaksız/placeholder kapaklı feed haberlerini işaretler.
 * Varsayılan: dry-run (yalnızca listeler).
 * Uygulama: status=review, isFeatured=false (soft-unpublish / editöryel kuyruk).
 *
 *   npm run feed:flag-coverless
 *   npm run feed:flag-coverless -- --apply
 */
import { prisma, isDatabaseConfigured, ensureDbConnection } from '../lib/db/prisma';
import { FEED_FALLBACK_COVER, isMissingFeedCoverImage } from '../lib/feed/constants';

const apply = process.argv.includes('--apply');

async function main() {
  if (!isDatabaseConfigured()) {
    console.error('DATABASE_URL yok — .env.local ile çalıştırın.');
    process.exit(1);
  }

  await ensureDbConnection();

  const candidates = await prisma.feedPost.findMany({
    where: {
      deletedAt: null,
      status: 'published',
      OR: [
        { coverImage: '' },
        { coverImage: { contains: 'brand/logo' } },
        { coverImage: { contains: 'og-default' } },
        { coverImage: FEED_FALLBACK_COVER }
      ]
    },
    select: {
      id: true,
      slug: true,
      title: true,
      coverImage: true,
      isFeatured: true,
      publishedAt: true
    },
    orderBy: { publishedAt: 'desc' }
  });

  // Çift doğrulama — isMissingFeedCoverImage ile aynı tanım
  const targets = candidates.filter((p) => isMissingFeedCoverImage(p.coverImage));

  console.log(
    JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        matched: targets.length,
        posts: targets.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          isFeatured: p.isFeatured,
          coverImage: p.coverImage.slice(0, 80)
        }))
      },
      null,
      2
    )
  );

  if (!apply) {
    console.error(
      `\nDry-run: ${targets.length} haber listelendi. Uygulamak için --apply ekleyin (status→review, isFeatured→false).`
    );
    await prisma.$disconnect();
    return;
  }

  if (targets.length === 0) {
    console.error('Uygulanacak kapaksız yayın yok.');
    await prisma.$disconnect();
    return;
  }

  const ids = targets.map((p) => p.id);
  const result = await prisma.feedPost.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: {
      status: 'review',
      isFeatured: false,
      editorialStage: 'review'
    }
  });

  console.error(`Uygulandı: ${result.count} haber → review + unfeatured.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
