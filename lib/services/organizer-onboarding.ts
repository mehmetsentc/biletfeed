import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { uniqueSlug } from '@/lib/utils/slug';

export async function ensureOrganizerProfile(params: {
  userId: string;
  firebaseUid: string;
  organizationName: string;
  description?: string;
}) {
  await ensureDbConnection();

  const existing = await prisma.organizer.findFirst({
    where: { ownerId: params.userId, deletedAt: null }
  });
  if (existing) return existing;

  const slug = await uniqueSlug(params.organizationName, async (s) => {
    const row = await prisma.organizer.findUnique({ where: { slug: s } });
    return Boolean(row);
  });

  // Yeni başvurular admin onayına gider; ROLE_ORGANIZER onay sonrası verilir.
  const organizer = await prisma.organizer.create({
    data: {
      slug,
      name: params.organizationName.trim(),
      description:
        params.description?.trim() ||
        `${params.organizationName} etkinlikleri Biletfeed üzerinde.`,
      ownerId: params.userId,
      status: 'pending',
      verified: false
    }
  });

  return organizer;
}
