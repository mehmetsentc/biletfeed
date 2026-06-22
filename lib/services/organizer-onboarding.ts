import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { ROLES } from '@/lib/auth/roles';
import { syncFirebaseCustomClaims } from '@/lib/services/users';
import { slugify, uniqueSlug } from '@/lib/utils/slug';

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

  const organizer = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: params.userId },
      data: { role: ROLES.ORGANIZER }
    });

    return tx.organizer.create({
      data: {
        slug,
        name: params.organizationName.trim(),
        description:
          params.description?.trim() ||
          `${params.organizationName} etkinlikleri Biletfeed üzerinde.`,
        ownerId: params.userId,
        status: 'approved',
        verified: false
      }
    });
  });

  await syncFirebaseCustomClaims(params.firebaseUid, ROLES.ORGANIZER);
  return organizer;
}
