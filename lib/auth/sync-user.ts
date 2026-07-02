import {
  bootstrapRoleForEmail,
  isBootstrapSuperAdminEmail
} from '@/lib/auth/bootstrap-admins';
import { ROLES } from '@/lib/auth/roles';
import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';

/** Firebase uid + e-posta ile DB kullanıcısını eşleştir / oluştur */
export async function syncUserToDB(uid: string, email: string): Promise<string> {
  if (!isDatabaseConfigured()) {
    return bootstrapRoleForEmail(email);
  }
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ firebaseUid: uid }, { email: normalizedEmail }]
      },
      select: { id: true, role: true, firebaseUid: true }
    });

    if (existing) {
      const role = isBootstrapSuperAdminEmail(normalizedEmail)
        ? ROLES.SUPER_ADMIN
        : existing.role;

      if (
        existing.firebaseUid !== uid ||
        (isBootstrapSuperAdminEmail(normalizedEmail) &&
          existing.role !== ROLES.SUPER_ADMIN)
      ) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            firebaseUid: uid,
            ...(isBootstrapSuperAdminEmail(normalizedEmail)
              ? { role: ROLES.SUPER_ADMIN }
              : {})
          }
        });
      }
      return role;
    }

    const role = bootstrapRoleForEmail(normalizedEmail);
    await prisma.user.create({
      data: {
        firebaseUid: uid,
        email: normalizedEmail,
        displayName: normalizedEmail.split('@')[0] || 'Kullanıcı',
        role
      }
    });
    return role;
  } catch {
    return bootstrapRoleForEmail(email);
  }
}
