import { prisma } from '@/lib/db/prisma';
import { mapCategory, categorySlugToEventType } from '@/lib/scraper/normalize';

const CATEGORY_NAMES: Record<string, string> = {
  muzik: 'Konser',
  festival: 'Festival',
  tiyatro: 'Tiyatro',
  spor: 'Spor',
  teknoloji: 'Workshop',
  online: 'Online',
  sanat: 'Sanat',
  komedi: 'Komedi',
  cocuk: 'Çocuk',
  party: 'Party',
  diger: 'Diğer'
};

async function resolveCategoryId(categorySlug: string): Promise<string> {
  const slug = categorySlug.toLowerCase();
  const name =
    CATEGORY_NAMES[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
  const category = await prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { slug, name }
  });
  return category.id;
}

/** Mevcut etkinlikleri başlık/açıklamaya göre yeniden kategorize eder */
export async function recategorizePublishedEvents(): Promise<{
  scanned: number;
  updated: number;
  samples: Array<{ title: string; from: string; to: string }>;
}> {
  const events = await prisma.event.findMany({
    where: { deletedAt: null, status: 'published' },
    select: {
      id: true,
      title: true,
      description: true,
      eventType: true,
      category: { select: { slug: true } },
      venue: { select: { name: true } }
    }
  });

  let updated = 0;
  const samples: Array<{ title: string; from: string; to: string }> = [];

  for (const event of events) {
    // Venue adını da metin havuzuna ekle — "Açıkhava" gibi mekan adları kategoriyi belirler
    const textCorpus = [event.title, event.description || '', event.venue?.name || ''].join(' ');
    const { categorySlug } = mapCategory(event.title, textCorpus);
    if (categorySlug === event.category.slug) continue;

    const categoryId = await resolveCategoryId(categorySlug);
    const eventType = categorySlugToEventType(categorySlug);

    await prisma.event.update({
      where: { id: event.id },
      data: { categoryId, eventType }
    });

    updated += 1;
    if (samples.length < 15) {
      samples.push({
        title: event.title,
        from: event.category.slug,
        to: categorySlug
      });
    }
  }

  return { scanned: events.length, updated, samples };
}
