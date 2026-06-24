/**
 * AI Event Editor
 * Pending harici etkinlikleri batch olarak AI'a gönderir:
 * - Kategori düzeltme
 * - Şehir düzeltme
 * - Açıklama iyileştirme
 * - Onaylama / reddetme
 */

import { prisma } from '@/lib/db/prisma';
import { scraperAiChat } from '@/lib/scraper/ai/client';
import { isScraperAiReady } from '@/lib/scraper/ai/config';

const BATCH_SIZE = 15;

/** Desteklenen kategori slug'ları */
const VALID_CATEGORIES = ['muzik', 'festival', 'tiyatro', 'spor', 'teknoloji', 'sanat', 'komedi', 'cocuk', 'online'] as const;

type CategorySlug = typeof VALID_CATEGORIES[number];

interface AiEditResult {
  id: string;
  action: 'approve' | 'reject';
  categorySlug?: CategorySlug;
  citySlug?: string;
  description?: string;
  shortDescription?: string;
  reason?: string;
}

interface EditBatchStats {
  processed: number;
  approved: number;
  rejected: number;
  errors: string[];
}

const SYSTEM_PROMPT = `Sen BiletFeed platformu için bir etkinlik moderatörüsün.
Sana bir dizi etkinlik veriyorum. Her etkinlik için şunları yapman gerekiyor:

1. **Kategori düzeltme**: Etkinliğin doğru kategorisini belirle.
   Geçerli kategori slug'ları: muzik, festival, tiyatro, spor, teknoloji, sanat, komedi, cocuk, online
   - muzik: konser, müzik performansı (müzikal DEĞİL — tiyatro kategorisi)
   - festival: açık hava festivali, yemek festivali, sanat festivali
   - tiyatro: tiyatro, müzikal, opera, bale, dans gösterisi
   - spor: spor etkinliği, turnuva, maç
   - teknoloji: workshop, konferans, seminer, eğitim
   - sanat: sergi, galeri, sanat etkinliği
   - komedi: stand-up, komedi gösterisi
   - cocuk: çocuk etkinliği, aile etkinliği
   - online: online etkinlik

2. **Şehir doğrulama**: Etkinlik başlığında veya mekanda farklı bir şehir adı geçiyorsa citySlug'ı düzelt.
   Örnek: "Marmaris Müzik Festivali" başlığıyla "antalya" şehrinde görünüyorsa → citySlug'ı "mugla" yap.
   Şehir slug kuralları: Türkçe karaktersiz, küçük harf ASCII (istanbul, ankara, izmir, mugla, canakkale, edirne vb.)

3. **Açıklama iyileştirme**: Eğer açıklama çok kısa, anlamsız veya sadece bilet satış metni ise düzelt.
   Doğal, bilgilendirici Türkçe yaz. Max 500 karakter. shortDescription da max 160 karakter.

4. **Onayla veya reddet**:
   - ONAYLA (approve) eğer: gerçek bir etkinlikse, tarihi gelecekte ise (muhtemelen), makul başlık/şehir varsa
   - REDDET (reject) eğer: içerik spam/reklam ise, başlık anlamsızsa, platform içi promosyon ise

JSON array döndür (açıklama veya markdown YOK, sadece JSON):
[
  {
    "id": "<etkinlik id>",
    "action": "approve" | "reject",
    "categorySlug": "<slug veya mevcut kategoriyi koru>",
    "citySlug": "<düzeltilmiş şehir slug veya null>",
    "description": "<iyileştirilmiş açıklama veya null>",
    "shortDescription": "<kısa açıklama veya null>",
    "reason": "<reddetme sebebi veya null>"
  }
]`;

async function resolveCategoryId(slug: string): Promise<string | null> {
  const category = await prisma.category.findUnique({ where: { slug } });
  return category?.id ?? null;
}

async function resolveCityId(slug: string): Promise<string | null> {
  const city = await prisma.city.findUnique({ where: { slug } });
  return city?.id ?? null;
}

async function processBatch(
  events: Array<{
    id: string;
    title: string;
    description: string;
    shortDescription: string | null;
    city: { slug: string; name: string };
    category: { slug: string; name: string };
    externalUrl: string | null;
    tags: string[];
  }>,
  stats: EditBatchStats
) {
  const payload = events.map(e => ({
    id: e.id,
    title: e.title,
    description: e.description.slice(0, 300),
    shortDescription: e.shortDescription ?? '',
    citySlug: e.city.slug,
    categorySlug: e.category.slug,
    tags: e.tags.slice(0, 5)
  }));

  let rawJson: string;
  try {
    rawJson = await scraperAiChat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Şu etkinlikleri incele ve JSON döndür:\n${JSON.stringify(payload, null, 2)}`
        }
      ],
      { jsonMode: true, temperature: 0.2 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    stats.errors.push(`AI batch hatası: ${msg}`);
    return;
  }

  let results: AiEditResult[];
  try {
    // JSON fenced code block varsa temizle
    const cleaned = rawJson.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    results = JSON.parse(cleaned);
    if (!Array.isArray(results)) throw new Error('Dizi bekleniyor');
  } catch {
    stats.errors.push(`AI JSON parse hatası: ${rawJson.slice(0, 200)}`);
    return;
  }

  for (const result of results) {
    if (!result.id || !result.action) continue;

    try {
      if (result.action === 'reject') {
        // Soft delete: status → draft (admin panelden görülebilsin)
        await prisma.event.update({
          where: { id: result.id },
          data: { status: 'draft', tags: { push: 'ai-rejected' } }
        });
        stats.rejected += 1;
        continue;
      }

      // approve: güncelle + published yap
      const updateData: Record<string, unknown> = { status: 'published' };

      if (result.categorySlug && VALID_CATEGORIES.includes(result.categorySlug as CategorySlug)) {
        const catId = await resolveCategoryId(result.categorySlug);
        if (catId) updateData.categoryId = catId;
      }

      if (result.citySlug && result.citySlug !== events.find(e => e.id === result.id)?.city.slug) {
        const cityId = await resolveCityId(result.citySlug);
        if (cityId) updateData.cityId = cityId;
      }

      if (result.description?.trim()) {
        updateData.description = result.description.trim();
      }

      if (result.shortDescription?.trim()) {
        updateData.shortDescription = result.shortDescription.trim().slice(0, 160);
      }

      await prisma.event.update({
        where: { id: result.id },
        data: updateData as never
      });
      stats.approved += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      stats.errors.push(`Event ${result.id} güncelleme hatası: ${msg}`);
    }

    stats.processed += 1;
  }
}

/**
 * Tüm pending harici etkinlikleri AI ile inceler ve günceller.
 * @param limit İşlenecek maksimum etkinlik sayısı (varsayılan: 300)
 */
export async function editPendingEventsWithAi(limit = 300): Promise<EditBatchStats> {
  const stats: EditBatchStats = { processed: 0, approved: 0, rejected: 0, errors: [] };

  if (!isScraperAiReady()) {
    stats.errors.push('AI hazır değil — SCRAPER_AI_ENABLED veya API key eksik');
    return stats;
  }

  const events = await prisma.event.findMany({
    where: {
      status: 'pending',
      listingType: 'external',
      deletedAt: null
    },
    include: {
      city: { select: { slug: true, name: true } },
      category: { select: { slug: true, name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  if (events.length === 0) return stats;

  // Batch'lere böl
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    await processBatch(batch, stats);
  }

  return stats;
}
