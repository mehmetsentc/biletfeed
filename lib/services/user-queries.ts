import type { UserRole } from '@/types';
import { ROLES } from '@/lib/auth/roles';
import {
  bootstrapRoleForEmail,
  isBootstrapSuperAdminEmail
} from '@/lib/auth/bootstrap-admins';
import { resolveDbUserForSession } from '@/lib/auth/session-user-resolve';
import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';

/** Prisma-only kullanıcı sorguları — firebase-admin import zinciri yok */

export async function getUserRoleByFirebaseUid(
  firebaseUid: string
): Promise<UserRole | null> {
  return resolveUserRoleForSession(firebaseUid);
}

/** Oturum için efektif rol — DB + bootstrap e-posta, uid/e-posta uyumsuzluğu düzeltme */
export async function resolveUserRoleForSession(
  firebaseUid: string,
  email?: string
): Promise<UserRole | null> {
  if (!isDatabaseConfigured()) {
    if (email && isBootstrapSuperAdminEmail(email)) return ROLES.SUPER_ADMIN;
    return null;
  }

  const normalizedEmail = email?.trim().toLowerCase();

  const user = await resolveDbUserForSession(firebaseUid, normalizedEmail);

  if (user) {
    const bootstrapEmail = normalizedEmail || user.email.toLowerCase();
    if (isBootstrapSuperAdminEmail(bootstrapEmail)) {
      if (user.role !== ROLES.SUPER_ADMIN) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: ROLES.SUPER_ADMIN }
        });
      }
      return ROLES.SUPER_ADMIN;
    }
    return user.role;
  }

  if (normalizedEmail && isBootstrapSuperAdminEmail(normalizedEmail)) {
    return ROLES.SUPER_ADMIN;
  }

  return null;
}

export async function getUserProfileByFirebaseUid(
  firebaseUid: string,
  email?: string
) {
  if (!isDatabaseConfigured()) return null;

  const user = await resolveDbUserForSession(firebaseUid, email);
  if (!user) return null;

  const full = await prisma.user.findFirst({
    where: { id: user.id, deletedAt: null },
    include: {
      favorites: { select: { eventId: true } },
      followers: { select: { organizerId: true } },
      ownedOrganizer: { select: { id: true } }
    }
  });

  if (!full) return null;

  const role = isBootstrapSuperAdminEmail(full.email)
    ? ROLES.SUPER_ADMIN
    : full.role;

  return {
    uid: full.firebaseUid,
    email: full.email,
    displayName: full.displayName,
    photoURL: full.photoURL ?? undefined,
    role,
    organizerId: full.ownedOrganizer?.id,
    favorites: full.favorites.map((f) => f.eventId),
    following: full.followers.map((f) => f.organizerId),
    createdAt: full.createdAt,
    updatedAt: full.updatedAt
  };
}

export { bootstrapRoleForEmail };
