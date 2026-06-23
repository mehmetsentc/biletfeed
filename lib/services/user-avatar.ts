import type { SessionUser } from '@/lib/auth/session';
import { bootstrapRoleForEmail } from '@/lib/auth/bootstrap-admins';
import { ensureDbConnection, prisma } from '@/lib/db/prisma';

type SavedUserProfile = {
  email: string;
  displayName: string;
  photoURL: string | null;
  role: string;
};

export async function saveUserAvatarPhoto(
  session: SessionUser,
  photoURL: string,
  displayName: string
): Promise<SavedUserProfile> {
  await ensureDbConnection();

  const email = session.email?.trim() || `${session.uid}@users.biletfeed.local`;

  const byUid = await prisma.user.findFirst({
    where: { firebaseUid: session.uid, deletedAt: null },
    select: { id: true }
  });

  if (byUid) {
    return prisma.user.update({
      where: { id: byUid.id },
      data: { photoURL },
      select: {
        email: true,
        displayName: true,
        photoURL: true,
        role: true
      }
    });
  }

  const byEmail = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true }
  });

  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { firebaseUid: session.uid, photoURL },
      select: {
        email: true,
        displayName: true,
        photoURL: true,
        role: true
      }
    });
  }

  return prisma.user.create({
    data: {
      firebaseUid: session.uid,
      email,
      displayName,
      photoURL,
      role: bootstrapRoleForEmail(email)
    },
    select: {
      email: true,
      displayName: true,
      photoURL: true,
      role: true
    }
  });
}
