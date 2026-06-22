import type { UserRole } from '@/types';
import { ROLES } from '@/lib/auth/roles';
import { isBootstrapSuperAdminEmail } from '@/lib/auth/bootstrap-admins';
import { prisma, isDatabaseConfigured, ensureDbConnection } from '@/lib/db/prisma';

/** Prisma-only kullanıcı sorguları — firebase-admin import zinciri yok */

export async function getUserRoleByFirebaseUid(
  firebaseUid: string
): Promise<UserRole | null> {
  const resolved = await resolveSessionUserRole(firebaseUid);
  return resolved?.role ?? null;
}

export async function resolveSessionUserRole(
  firebaseUid: string,
  email?: string
): Promise<{ role: UserRole; email: string } | null> {
  if (!isDatabaseConfigured()) return null;

  await ensureDbConnection();

  let user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true, email: true, role: true, firebaseUid: true }
  });

  const normalizedEmail = email?.trim().toLowerCase();

  if (!user && normalizedEmail) {
    user = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
      select: { id: true, email: true, role: true, firebaseUid: true }
    });

    if (user && user.firebaseUid !== firebaseUid) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid },
        select: { id: true, email: true, role: true, firebaseUid: true }
      });
    }
  }

  if (!user) return null;

  if (
    isBootstrapSuperAdminEmail(user.email) &&
    user.role !== ROLES.SUPER_ADMIN
  ) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: ROLES.SUPER_ADMIN },
      select: { id: true, email: true, role: true, firebaseUid: true }
    });
  }

  return { role: user.role, email: user.email };
}

export async function syncSessionUserFromAuth(
  firebaseUid: string,
  email: string
): Promise<UserRole> {
  if (!isDatabaseConfigured()) {
    return isBootstrapSuperAdminEmail(email) ? ROLES.SUPER_ADMIN : ROLES.USER;
  }

  await ensureDbConnection();
  const normalizedEmail = email.trim().toLowerCase();
  const bootstrapRole = isBootstrapSuperAdminEmail(normalizedEmail)
    ? ROLES.SUPER_ADMIN
    : ROLES.USER;

  try {
    const byUid = await prisma.user.findFirst({
      where: { firebaseUid, deletedAt: null },
      select: { id: true, email: true, role: true }
    });

    if (byUid) {
      const finalRole =
        isBootstrapSuperAdminEmail(byUid.email) ||
        isBootstrapSuperAdminEmail(normalizedEmail)
          ? ROLES.SUPER_ADMIN
          : byUid.role;

      if (finalRole !== byUid.role) {
        await prisma.user.update({
          where: { id: byUid.id },
          data: { role: finalRole }
        });
      }
      return finalRole;
    }

    const byEmail = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
      select: { id: true, role: true }
    });

    if (byEmail) {
      const finalRole = isBootstrapSuperAdminEmail(normalizedEmail)
        ? ROLES.SUPER_ADMIN
        : byEmail.role;

      await prisma.user.update({
        where: { id: byEmail.id },
        data: { firebaseUid, role: finalRole }
      });
      return finalRole;
    }

    await prisma.user.create({
      data: {
        firebaseUid,
        email: normalizedEmail,
        displayName: normalizedEmail.split('@')[0] || 'Kullanıcı',
        role: bootstrapRole
      }
    });
    return bootstrapRole;
  } catch {
    return bootstrapRole;
  }
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
