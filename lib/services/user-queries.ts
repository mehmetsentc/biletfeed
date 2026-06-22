import type { UserRole } from '@/types';
import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';

/** Prisma-only kullanıcı sorguları — firebase-admin import zinciri yok */

export async function getUserRoleByFirebaseUid(
  firebaseUid: string
): Promise<UserRole | null> {
  if (!isDatabaseConfigured()) return null;
  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { role: true }
  });
  return user?.role ?? null;
}

export async function getUserProfileByFirebaseUid(firebaseUid: string) {
  if (!isDatabaseConfigured()) return null;

  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    include: {
      favorites: { select: { eventId: true } },
      followers: { select: { organizerId: true } },
      ownedOrganizer: { select: { id: true } }
    }
  });

  if (!user) return null;

  return {
    uid: user.firebaseUid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL ?? undefined,
    role: user.role,
    organizerId: user.ownedOrganizer?.id,
    favorites: user.favorites.map((f) => f.eventId),
    following: user.followers.map((f) => f.organizerId),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
