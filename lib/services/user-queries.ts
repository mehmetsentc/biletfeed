import type { UserRole } from '@/types';
import { ROLES } from '@/lib/auth/roles';
import {
  bootstrapRoleForEmail,
  isBootstrapSuperAdminEmail
} from '@/lib/auth/bootstrap-admins';
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

  let user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true, role: true, email: true, firebaseUid: true }
  });

  if (!user && normalizedEmail) {
    user = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
      select: { id: true, role: true, email: true, firebaseUid: true }
    });
    if (user && user.firebaseUid !== firebaseUid) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid },
        select: { id: true, role: true, email: true, firebaseUid: true }
      });
    }
  }

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

  const role = isBootstrapSuperAdminEmail(user.email)
    ? ROLES.SUPER_ADMIN
    : user.role;

  return {
    uid: user.firebaseUid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL ?? undefined,
    role,
    organizerId: user.ownedOrganizer?.id,
    favorites: user.favorites.map((f) => f.eventId),
    following: user.followers.map((f) => f.organizerId),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export { bootstrapRoleForEmail };
