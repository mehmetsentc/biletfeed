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
        isBootstrapSuperAdminEmail(normalizedEmail) &&
        existing.role !== ROLES.SUPER_ADMIN
      ) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: ROLES.SUPER_ADMIN }
        });
        return ROLES.SUPER_ADMIN;
      }

      // Organizatör sahibi ama rol USER kaldıysa (admin iptali sonrası) paneli aç
      if (existing.role === ROLES.USER) {
        const ownsOrganizer = await prisma.organizer.findFirst({
          where: { ownerId: existing.id, deletedAt: null },
          select: { id: true }
        });
        if (ownsOrganizer) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { role: ROLES.ORGANIZER }
          });
          if (!existing.firebaseUid && uid) {
            await prisma.user.update({
              where: { id: existing.id },
              data: { firebaseUid: uid }
            });
          }
          return ROLES.ORGANIZER;
        }
      }

      if (!existing.firebaseUid && uid) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { firebaseUid: uid }
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
