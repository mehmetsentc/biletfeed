import { verifySessionCookie, sessionHasRole } from '@/lib/auth/session';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export async function getOrganizerForSession(firebaseUid: string) {
  await ensureDbConnection();
  return prisma.organizer.findFirst({
    where: { owner: { firebaseUid, deletedAt: null }, deletedAt: null }
  });
}

export async function canManageEventTickets(
  firebaseUid: string,
  eventId: string,
  role?: string
): Promise<boolean> {
  if (role && sessionHasRole({ uid: firebaseUid, role: role as never }, 'ROLE_ADMIN')) {
    return true;
  }

  const organizer = await getOrganizerForSession(firebaseUid);
  if (!organizer) return false;

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: organizer.id, deletedAt: null }
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
