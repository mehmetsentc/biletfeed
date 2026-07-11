import type { UserRole } from '@/types';
import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';

export type SessionDbUser = {
  id: string;
  firebaseUid: string;
  email: string;
  role: UserRole;
  displayName: string | null;
};

const userSelect = {
  id: true,
  firebaseUid: true,
  email: true,
  role: true,
  displayName: true
} as const;

function normalizeEmail(email?: string): string | undefined {
  const value = email?.trim().toLowerCase();
  return value || undefined;
}

/**
 * Oturum kimliği ile DB kullanıcısı — firebaseUid üzerine yazmaz.
 * Aynı organizatör hesabının birden fazla cihazda eşzamanlı kullanımı için.
 */
export async function resolveDbUserForSession(
  firebaseUid: string,
  email?: string
): Promise<SessionDbUser | null> {
  if (!isDatabaseConfigured()) return null;

  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail) {
    const organizerOwner = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        deletedAt: null,
        ownedOrganizer: { is: { deletedAt: null } }
      },
      select: userSelect
    });
    if (organizerOwner) {
      return { ...organizerOwner, role: organizerOwner.role as UserRole };
    }
  }

  const byUid = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: userSelect
  });
  if (byUid) return { ...byUid, role: byUid.role as UserRole };

  if (!normalizedEmail) return null;

  const byEmail = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
    select: userSelect
  });
  if (!byEmail) return null;

  return { ...byEmail, role: byEmail.role as UserRole };
}
