import { randomUUID } from 'crypto';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

/** Checkout veya davetiye için e-posta ile misafir kullanıcı */
export async function findOrCreateGuestUser(name: string, email?: string) {
  await ensureDbConnection();

  const normalizedEmail =
    email?.trim().toLowerCase() ||
    `misafir+${randomUUID()}@davetiye.biletfeed.local`;
  const displayName = name.trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });
  if (existing) {
    if (displayName && existing.displayName !== displayName) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { displayName }
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      firebaseUid: `guest-${randomUUID()}`,
      email: normalizedEmail,
      displayName,
      role: 'ROLE_USER'
    }
  });
}
