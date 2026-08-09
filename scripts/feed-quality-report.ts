#!/usr/bin/env tsx
/**
 * Feed kalite özeti — yayınlanmış kapaksız, düşük kalite, kapaksız öne çıkan sayıları.
 *
 *   npm run feed:quality-report
 *   dotenv -e .env.local -- tsx scripts/feed-quality-report.ts
 */
import { prisma, isDatabaseConfigured, ensureDbConnection } from '../lib/db/prisma';
import { FEED_FALLBACK_COVER, isMissingFeedCoverImage } from '../lib/feed/constants';
import { scoreFeedContentQuality } from '../lib/feed/quality';

async function main() {
  if (!isDatabaseConfigured()) {
    console.error('DATABASE_URL yok — .env.local ile çalıştırın.');
    process.exit(1);
  }

  await ensureDbConnection();

  const posts = await prisma.feedPost.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      coverImage: true,
      summary: true,
      content: true,
      readingTimeMinutes: true,
      isFeatured: true,
      publishedAt: true
    }
  });

  let published = 0;
  let review = 0;
  let other = 0;
  let publishedCoverless = 0;
  let featuredWithoutCover = 0;
  let lowQuality = 0;
  let lowQualityPublished = 0;

  const coverlessPublishedSamples: Array<{ slug: string; title: string }> = [];
  const featuredCoverlessSamples: Array<{ slug: string; title: string }> = [];

  for (const post of posts) {
    if (post.status === 'published') published += 1;
    else if (post.status === 'review') review += 1;
    else other += 1;

    const missingCover = isMissingFeedCoverImage(post.coverImage);
    const quality = scoreFeedContentQuality({
      content: post.content,
      coverImage: post.coverImage,
      summary: post.summary,
      readingTimeMinutes: post.readingTimeMinutes
    });

    if (quality.isLowQuality) {
      lowQuality += 1;
      if (post.status === 'published') lowQualityPublished += 1;
    }

    if (post.status === 'published' && missingCover) {
      publishedCoverless += 1;
      if (coverlessPublishedSamples.length < 15) {
        coverlessPublishedSamples.push({ slug: post.slug, title: post.title });
      }
    }

    if (post.isFeatured && missingCover) {
      featuredWithoutCover += 1;
      if (featuredCoverlessSamples.length < 15) {
        featuredCoverlessSamples.push({ slug: post.slug, title: post.title });
      }
    }
  }

  // Prisma tarafında da tutarlılık kontrolü (logo / fallback)
  const prismaCoverlessPublished = await prisma.feedPost.count({
    where: {
      deletedAt: null,
      status: 'published',
      OR: [
        { coverImage: '' },
        { coverImage: { contains: 'brand/logo' } },
        { coverImage: { contains: 'og-default' } },
        { coverImage: FEED_FALLBACK_COVER }
      ]
    }
  });

  console.log(
    JSON.stringify(
      {
        totals: {
          all: posts.length,
          published,
          review,
          other,
          publishedCoverless,
          publishedCoverlessPrisma: prismaCoverlessPublished,
          featuredWithoutCover,
          lowQuality,
          lowQualityPublished
        },
        samples: {
          publishedCoverless: coverlessPublishedSamples,
          featuredWithoutCover: featuredCoverlessSamples
        },
        hint:
          'Kapaksız yayını inceleme + unfeature için: npm run feed:flag-coverless (dry-run) veya --apply'
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
