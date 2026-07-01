import type { UserRole } from '@/types';
import { verifySessionCookie, sessionHasRole } from '@/lib/auth/session';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export async function getOrganizerForSession(firebaseUid: string) {
  await ensureDbConnection();
  return prisma.organizer.findFirst({
    where: { owner: { firebaseUid, deletedAt: null }, deletedAt: null }
  });
}

/** Oturum sahibi bu etkinliğin organizatörü mü? (firebaseUid → owner join, en güvenilir yol) */
export async function isEventOwnedByFirebaseUid(
  eventId: string,
  firebaseUid: string
): Promise<boolean> {
  await ensureDbConnection();
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      deletedAt: null,
      organizer: {
        deletedAt: null,
        owner: { firebaseUid, deletedAt: null }
      }
    },
    select: { id: true }
  });
  return Boolean(event);
}

export async function canManageEventTickets(
  firebaseUid: string,
  eventId: string,
  role?: UserRole,
  organizerId?: string
): Promise<boolean> {
  if (role && sessionHasRole({ uid: firebaseUid, role }, 'ROLE_ADMIN')) {
    return true;
  }

  if (await isEventOwnedByFirebaseUid(eventId, firebaseUid)) {
    return true;
  }

  if (!organizerId) return false;

  await ensureDbConnection();
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    select: { id: true }
  });
  return Boolean(event);
}

export async function requireOrganizerSession() {
  const session = await verifySessionCookie();
  if (!session || !sessionHasRole(session, 'ROLE_ORGANIZER')) {
    return null;
  }
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) return null;
  return { session, organizer };
}
