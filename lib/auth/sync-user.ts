import {
  bootstrapRoleForEmail,
  isBootstrapSuperAdminEmail
} from '@/lib/auth/bootstrap-admins';
import { ROLES } from '@/lib/auth/roles';
import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';

function isGuestFirebaseUid(uid: string | null | undefined): boolean {
  return Boolean(uid?.startsWith('guest-'));
}

/**
 * Misafir checkout sonrası gerçek Firebase girişi — guest-* uid'yi gerçek uid ile değiştir.
 * Aksi halde Biletlerim boş kalır (biletler guest kullanıcıda kalır).
 */
async function claimGuestAccountIfNeeded(
  existing: { id: string; firebaseUid: string },
  uid: string
): Promise<void> {
  if (!uid || existing.firebaseUid === uid) return;
  if (!isGuestFirebaseUid(existing.firebaseUid)) return;

  const conflict = await prisma.user.findFirst({
    where: { firebaseUid: uid, deletedAt: null, NOT: { id: existing.id } },
    select: { id: true }
  });
  if (conflict) return;

  await prisma.user.update({
    where: { id: existing.id },
    data: { firebaseUid: uid }
  });
}

/** Firebase uid + e-posta ile DB kullanıcısını eşleştir / oluştur */
export async function syncUserToDB(uid: string, email: string): Promise<string> {
  if (!isDatabaseConfigured()) {
    return bootstrapRoleForEmail(email);
  }
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Önce gerçek oturum uid, yoksa e-posta (misafir sipariş hesabı)
    const byUid = await prisma.user.findFirst({
      where: { firebaseUid: uid, deletedAt: null },
      select: { id: true, role: true, firebaseUid: true }
    });
    const byEmail = byUid
      ? null
      : await prisma.user.findFirst({
          where: { email: normalizedEmail, deletedAt: null },
          select: { id: true, role: true, firebaseUid: true }
        });
    const existing = byUid ?? byEmail;

    if (existing) {
      await claimGuestAccountIfNeeded(existing, uid);

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
