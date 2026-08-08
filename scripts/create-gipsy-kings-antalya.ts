/**
 * Gipsy Kings by Andre Reyes — Antalya Açıkhava (30 Ağustos 2026)
 * Biletix GENEL Excel envanteri (3105 satılabilir) + kategori biletleri + kurallar
 *
 * npx dotenv -e .env.local -- npx tsx scripts/create-gipsy-kings-antalya.ts
 */
import { readFileSync, existsSync } from 'fs';
import { prisma, ensureDbConnection } from '../lib/db/prisma';
import { uniqueSlug } from '../lib/utils/slug';
import { createOrganizerEvent } from '../lib/services/organizer-events';
import { approveInternalEvent } from '../lib/services/event-approvals';
import { saveEventRuleSet } from '../lib/services/event-rules-persist';
import {
  buildAntyaSeatPlan,
  categoryTicketDefs,
  ANTALYA_STOCK
} from '../lib/tickets/antalya-inventory';
import type { SeatPlan } from '../lib/services/organizer-panel';
import {
  isFirebaseStorageUploadConfigured,
  uploadOrganizerEventCover,
  uploadVenueMapImage
} from '../lib/firebase/admin-storage';

const TITLE = 'Gipsy Kings by Andre Reyes';
const COVER_PUBLIC = '/events/gipsy-kings-andre-reyes-2026-cover.png';
const STAGE_PUBLIC = '/events/gipsy-kings-andre-reyes-2026-stage.png';
const MAP_PUBLIC = '/venues/antalya-acikhava-koltuk-noktalari.png';

const COVER_ASSET =
  '/Users/user/.cursor/projects/Users-user-Documents-platforms-main/assets/image-c8ad457b-1bb1-41ce-9fb3-fa4c34025e63.png';
const STAGE_ASSET =
  '/Users/user/.cursor/projects/Users-user-Documents-platforms-main/assets/image-c952756e-dea6-4417-a3a3-ae4a1252f7b0.png';
const MAP_ASSET =
  '/Users/user/.cursor/projects/Users-user-Documents-platforms-main/assets/image-61b5de50-412b-444d-8677-1a17d5dc63e1.png';

const DESCRIPTION = `EFSANEVİ GIPSY KINGS BY ANDRÉ REYES, 30 AĞUSTOS'TA ANTALYA AÇIKHAVA TİYATROSU'NDA!
Flamenko, Latin ve Akdeniz ezgilerini tüm dünyaya taşıyan efsanevi topluluk Gipsy Kings by André Reyes, unutulmaz bir yaz gecesi için Antalya'ya geliyor.

Grammy ödüllü mirası, milyonlarca albüm satışı ve onlarca yıldır dünyanın en prestijli konser salonlarında sahne alan Gipsy Kings, 30 Ağustos 2026 Pazar akşamı Antalya Açıkhava Tiyatrosu'nda müzikseverlerle buluşacak.

“Bamboleo”, “Volare”, “Djobi Djoba”, “Baila Me”, “A Mi Manera (My Way)”, “Bem Bem Maria” ve daha birçok ölümsüz eser, André Reyes liderliğinde canlı performansla yeniden hayat bulacak.

Flamenko gitarlarının büyüleyici tınıları, Latin ritimleri ve Akdeniz'in sıcak atmosferiyle birleşen bu özel konser, yalnızca bir müzik gecesi değil; dünyanın en sevilen repertuvarlarından birini canlı deneyimleme fırsatı sunacak.

Yaklaşık 90 dakika sürecek kesintisiz canlı performans, dinleyicileri İspanya'dan Güney Fransa'ya uzanan eşsiz bir müzikal yolculuğa çıkaracak.

Yıllardır dünyanın dört bir yanında kapalı gişe konserlere imza atan Gipsy Kings by André Reyes, enerjisi yüksek sahne performansı ve izleyiciyle kurduğu güçlü bağ sayesinde her konserini unutulmaz bir şölene dönüştürüyor.

30 Ağustos Zafer Bayramı'nda, Antalya'nın büyüleyici atmosferinde gerçekleşecek bu özel gece, yaz sezonunun en prestijli uluslararası konserlerinden biri olmaya hazırlanıyor.`;

const CUSTOM_RULES = [
  'Etkinlik süresince biletinizi saklayınız.',
  'Etkinlik alanına giriş yapan seyircilerin alandan çıkış yapmaları halinde haklarını kaybederler; tekrar alana girebilmeleri için yeni bilet satın almaları gerekmektedir.',
  '6 yaş altı konsere alınmamaktadır. 6 yaş üstü her yaştan katılımcı bilete tabidir.',
  'Organizatör firma etkinlik için uygun görmediği kişileri içeri almama hakkına sahiptir.',
  'Organizasyon şirketi, öngörülmeyen ve kaçınılmaz nedenlerden ötürü programda her türlü değişiklik yapma hakkını saklı tutar.',
  'Organizasyon şirketi, bilet fiyatlarında değişiklik yapma hakkına sahiptir.',
  'Etkinlik alanına dışarıdan yiyecek ve içecek alınmamaktadır.',
  'Etkinlik alanına Selfie Stick ve GoPro çubukları ile girilmemektedir.',
  'Etkinlik alanına profesyonel ses ve görüntü araçları (video kamera ve fotoğraf makinası) ile girilmemektedir.',
  'Etkinlik süresince kayıt yapılmasına izin verilmeyecektir. Seyirci, sanatçı yönetimi uygun gördüğü takdirde görsel-işitsel kayıt cihazlarına el konabileceğini kabul eder.',
  'Etkinlik alanına yanıcı, patlayıcı (deodorant, sprey, parfüm, kolonya vb. gibi), parlayıcı, kesici ve delici olarak kullanılabilecek her türlü alet, termos, motor kaskı ve lazer imleci ile girilmemektedir.',
  'Tüm katılımcıların kimliklerini yanlarında bulundurması ve istendiğinde ibraz etmeleri gerekmektedir.',
  'Etkinlik alanında yanınızda bulunan eşyaların sorumluluğunun size ait olduğunu hatırlatmak isteriz.',
  'Güvenlik personeli, etkinlik alanına giren herkesi güvenlik aramasına tabii tutacaktır.',
  'Etkinlik alanına evcil hayvan ile girilmesine izin verilmeyecektir. Sadece rehber köpek ile girilebilir.',
  'Etkinlik alanındaki ses düzenleri geçici duyma problemlerine yol açabilir.',
  'Etkinlik alanındaki ışık düzenleri geçici göz rahatsızlıklarına neden olabilir.',
  'Etkinlik biletleri sadece organizasyon sahibi tarafından belirlenen resmi satış noktalarından alınmalıdır. Organizasyon sahibi resmi satış noktalarından alınmayan biletlerin sahiplerini etkinlik alanından çıkarma hakkına sahiptir.',
  'Etkinlik biletleri devredilemez ve iade edilemez. Kayıp biletler için yenisi basılmayacaktır. Satın alınan bilet yazılı izin alınmadığı takdirde; reklam, yarışma, çekiliş, promosyon vb. kişisel kullanım haricinde ticari ya da ticari olmayan amaçlarda kullanılamaz. Bu amaçla kullanılan biletler iptal edilecektir ve yasal işlem başlatılacaktır.',
  'Etkinliğe katılan kişilerin fotoğraf ve video çekimlerinin tanıtım materyallerinde kullanım hakkı etkinlik organizasyonuna ait olup katılımcı etkinliğe katılarak bu hakkın kullanılmasını kabul etmektedir.',
  'Profesyonel olmayan cihazlarla, katılımcıları ve sanatçıları rahatsız edecek ve özel hayat gizliliğini ihlal edecek çekim yapılmamasına özen gösterilmelidir.'
];

function absoluteUrl(publicPath: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://biletfeed.com').replace(/\/$/, '');
  return `${base}${publicPath.startsWith('/') ? publicPath : `/${publicPath}`}`;
}

async function tryUpload(
  assetPath: string,
  uploader: (buf: Buffer, contentType: string) => Promise<string>
): Promise<string | null> {
  if (!isFirebaseStorageUploadConfigured()) return null;
  if (!existsSync(assetPath)) return null;
  try {
    const buf = readFileSync(assetPath);
    return await uploader(buf, 'image/png');
  } catch (err) {
    console.warn('Firebase upload atlandı:', err instanceof Error ? err.message : err);
    return null;
  }
}

async function resolveOrganizer() {
  const preferred = await prisma.organizer.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: 'Let Us', mode: 'insensitive' } },
        { name: { contains: 'MY ART', mode: 'insensitive' } },
        { name: { contains: 'LetUs', mode: 'insensitive' } },
        { slug: { contains: 'let-us', mode: 'insensitive' } }
      ]
    },
    select: { id: true, name: true, slug: true }
  });
  if (preferred) return preferred;

  const byEmail = await prisma.user.findFirst({
    where: { email: 'mehmetsentc@gmail.com', deletedAt: null },
    include: { ownedOrganizer: { select: { id: true, name: true, slug: true } } }
  });
  if (byEmail?.ownedOrganizer) return byEmail.ownedOrganizer;

  const first = await prisma.organizer.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, slug: true }
  });
  if (!first) throw new Error('Aktif organizatör bulunamadı');
  return first;
}

async function istanbulDate(year: number, month: number, day: number, hour: number, minute: number) {
  // Europe/Istanbul = UTC+3 (DST yok 2016+)
  return new Date(Date.UTC(year, month - 1, day, hour - 3, minute, 0));
}

async function main() {
  await ensureDbConnection();
  console.log('=== Gipsy Kings by Andre Reyes — Antalya Açıkhava ===\n');

  const organizer = await resolveOrganizer();
  console.log(`Organizatör: ${organizer.name} (${organizer.slug}) [${organizer.id}]`);

  const city = await prisma.city.findFirst({ where: { slug: 'antalya', deletedAt: null } });
  const category = await prisma.category.findFirst({ where: { slug: 'muzik', deletedAt: null } });
  if (!city || !category) {
    throw new Error('antalya / muzik kayıtları eksik — önce prisma seed çalıştırın');
  }

  // İdempotent: mevcut Gipsy Kings kaydını güncelle
  const existing = await prisma.event.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { title: { equals: TITLE, mode: 'insensitive' } },
        { slug: { startsWith: 'gipsy-kings-by-andre-reyes' } }
      ]
    },
    include: { ticketTypes: { where: { deletedAt: null } }, venue: true }
  });

  let coverUrl =
    (await tryUpload(COVER_ASSET, (buf, ct) =>
      uploadOrganizerEventCover(organizer.id, buf, ct)
    )) || absoluteUrl(COVER_PUBLIC);

  let stageUrl =
    (await tryUpload(STAGE_ASSET, (buf, ct) =>
      uploadOrganizerEventCover(organizer.id, buf, ct)
    )) || absoluteUrl(STAGE_PUBLIC);

  let mapUrl =
    (await tryUpload(MAP_ASSET, (buf, ct) => uploadVenueMapImage(organizer.id, buf, ct))
    ) || absoluteUrl(MAP_PUBLIC);

  // Yerel public fallback her zaman geçerli olsun (Firebase URL yoksa)
  if (!coverUrl.startsWith('http')) coverUrl = absoluteUrl(COVER_PUBLIC);
  if (!stageUrl.startsWith('http')) stageUrl = absoluteUrl(STAGE_PUBLIC);
  if (!mapUrl.startsWith('http')) mapUrl = absoluteUrl(MAP_PUBLIC);

  const seatPlan = buildAntyaSeatPlan(mapUrl);
  const capacity = Object.values(ANTALYA_STOCK).reduce((s, n) => s + n, 0);
  const startDate = await istanbulDate(2026, 8, 30, 21, 0);
  const endDate = await istanbulDate(2026, 8, 30, 23, 30);
  const flatRules = CUSTOM_RULES.map((r) => `• ${r}`).join('\n');

  // 6 kategori TicketType — Excel FİYAT stokları; koltuk seçimi seat plan unit id ile
  const ticketCategories = categoryTicketDefs().map((cat) => ({
    name: cat.name,
    description: cat.description,
    price: cat.price,
    capacity: cat.capacity,
    seatsPerUnit: 1,
    type: cat.type
  }));

  // Venue with seat plan
  let venue = await prisma.venue.findFirst({
    where: {
      deletedAt: null,
      cityId: city.id,
      OR: [
        { name: { equals: 'Antalya Açıkhava', mode: 'insensitive' } },
        { slug: { contains: 'antalya-acikhava' } }
      ]
    }
  });

  if (!venue) {
    const slug = await uniqueSlug('antalya-acikhava', async (s) =>
      Boolean(await prisma.venue.findUnique({ where: { slug: s } }))
    );
    venue = await prisma.venue.create({
      data: {
        slug,
        name: 'Antalya Açıkhava',
        address: 'Antalya Açıkhava Tiyatrosu, Antalya',
        cityId: city.id,
        organizerId: organizer.id,
        capacity,
        description:
          'Antalya Açıkhava — VIP (A–H), Parter 1–3 (A–M), Parter 4–6 (N–Z). Biletix oturma planı referansı.',
        seatPlan
      }
    });
    console.log('Venue oluşturuldu:', venue.id, venue.slug);
  } else {
    venue = await prisma.venue.update({
      where: { id: venue.id },
      data: {
        name: 'Antalya Açıkhava',
        address: 'Antalya Açıkhava Tiyatrosu, Antalya',
        organizerId: venue.organizerId ?? organizer.id,
        capacity,
        seatPlan,
        description:
          'Antalya Açıkhava — VIP (A–H), Parter 1–3 (A–M), Parter 4–6 (N–Z). Biletix oturma planı referansı.'
      }
    });
    console.log('Venue güncellendi:', venue.id, venue.slug);
  }

  let eventId: string;
  let eventSlug: string;
  let status: string;

  if (existing) {
    console.log(`Mevcut etkinlik güncelleniyor: ${existing.id}`);

    // Soft-delete eski ticket types, yenilerini ekle
    await prisma.ticketType.updateMany({
      where: { eventId: existing.id, deletedAt: null },
      data: { deletedAt: new Date() }
    });

    const now = new Date();
    await prisma.ticketType.createMany({
      data: ticketCategories.map((cat) => ({
        eventId: existing.id,
        name: cat.name,
        description: cat.description,
        type: cat.type,
        price: cat.price,
        currency: 'TRY' as const,
        quantity: cat.capacity,
        sold: 0,
        capacity: cat.capacity,
        seatsPerUnit: 1,
        saleStartDate: now,
        saleEndDate: startDate,
        status: 'active' as const
      }))
    });

    const updated = await prisma.event.update({
      where: { id: existing.id },
      data: {
        title: TITLE,
        description: DESCRIPTION,
        shortDescription: DESCRIPTION.slice(0, 160),
        organizerId: organizer.id,
        cityId: city.id,
        categoryId: category.id,
        venueId: venue.id,
        coverImage: coverUrl,
        gallery: [stageUrl],
        startDate,
        endDate,
        eventType: 'concert',
        isFree: false,
        basePrice: 1500,
        capacity,
        listingType: 'internal',
        rules: flatRules,
        status: existing.status === 'published' ? 'published' : 'pending'
      }
    });

    eventId = updated.id;
    eventSlug = updated.slug;
    status = updated.status;

    if (status === 'pending') {
      await approveInternalEvent(eventId);
      status = 'published';
    }
  } else {
    const created = await createOrganizerEvent({
      organizerId: organizer.id,
      title: TITLE,
      description: DESCRIPTION,
      categorySlug: 'muzik',
      citySlug: 'antalya',
      venueName: 'Antalya Açıkhava',
      venueAddress: 'Antalya Açıkhava Tiyatrosu, Antalya',
      startDate,
      endDate,
      isFree: false,
      price: 1500,
      capacity,
      coverImage: coverUrl,
      gallery: [stageUrl],
      status: 'pending',
      eventType: 'concert',
      rules: flatRules,
      ticketCategories
    });

    // createOrganizerEvent kendi venue upsert eder; seat plan'lı venue'ya bağla
    await prisma.event.update({
      where: { id: created.id },
      data: {
        venueId: venue.id,
        coverImage: coverUrl,
        gallery: [stageUrl],
        rules: flatRules,
        eventType: 'concert',
        capacity
      }
    });

    await approveInternalEvent(created.id);
    eventId = created.id;
    eventSlug = created.slug;
    status = 'published';
  }

  await saveEventRuleSet(eventId, organizer.id, {
    selectedRules: [],
    customRules: CUSTOM_RULES
  });

  const finalEvent = await prisma.event.findFirstOrThrow({
    where: { id: eventId },
    include: {
      ticketTypes: { where: { deletedAt: null }, orderBy: { price: 'asc' } },
      venue: { select: { id: true, slug: true, name: true, seatPlan: true } },
      ruleSet: true,
      city: { select: { slug: true } },
      category: { select: { slug: true } },
      organizer: { select: { name: true, slug: true } }
    }
  });

  const plan = finalEvent.venue?.seatPlan as SeatPlan | null;
  const zoneSummary =
    plan?.zones?.map((z) => `${z.code} (${z.label}): ${z.units.length} koltuk`) ?? [];

  console.log('\n=== SONUÇ ===');
  console.log(`event id:     ${finalEvent.id}`);
  console.log(`slug:         ${finalEvent.slug}`);
  console.log(`status:       ${finalEvent.status}`);
  console.log(`listingType:  ${finalEvent.listingType}`);
  console.log(`URL:          https://biletfeed.com/etkinlik/${finalEvent.slug}`);
  console.log(`organizer:    ${finalEvent.organizer.name}`);
  console.log(`cover:        ${finalEvent.coverImage}`);
  console.log(`gallery:      ${JSON.stringify(finalEvent.gallery)}`);
  console.log(`capacity:     ${finalEvent.capacity}`);
  console.log(`venue:        ${finalEvent.venue?.name} [${finalEvent.venue?.id}]`);
  console.log(`map:          ${plan?.mapImageUrl ?? '—'}`);
  console.log('ticket types:');
  for (const tt of finalEvent.ticketTypes) {
    console.log(`  - ${tt.name}: ${tt.price} TRY × ${tt.capacity} (sold ${tt.sold})`);
  }
  console.log('seat plan zones:');
  for (const line of zoneSummary) console.log(`  - ${line}`);
  console.log(`rules:        ${CUSTOM_RULES.length} madde (Event.rules + ruleSet.customRules)`);
  console.log(`status var:   ${status}`);

  // Write small report next to script for parent agent
  const report = {
    eventId: finalEvent.id,
    slug: finalEvent.slug,
    url: `https://biletfeed.com/etkinlik/${finalEvent.slug}`,
    status: finalEvent.status,
    listingType: finalEvent.listingType,
    organizer: finalEvent.organizer,
    coverImage: finalEvent.coverImage,
    gallery: finalEvent.gallery,
    capacity: finalEvent.capacity,
    ticketTypes: finalEvent.ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price,
      capacity: t.capacity
    })),
    seatPlanZones: zoneSummary,
    venueId: finalEvent.venue?.id,
    mapImageUrl: plan?.mapImageUrl ?? null,
    rulesCount: CUSTOM_RULES.length,
    gaps: [
      'Salon davetiyesi (185) satış dışı — haritada gri',
      '6 kategori TicketType + Excel GENEL koltuk birimleri; checkout seatUnitIds ile',
      'Kapak/galeri Firebase yoksa public path üzerinden absolute URL'
    ]
  };
  console.log('\nREPORT_JSON=' + JSON.stringify(report));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
