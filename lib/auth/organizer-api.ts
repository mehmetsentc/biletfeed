import type { UserRole } from '@/types';
import { verifySessionCookie, sessionHasRole } from '@/lib/auth/session';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

function normalizeEmail(email?: string): string | undefined {
  const value = email?.trim().toLowerCase();
  return value || undefined;
}

function ownerIdentityFilter(firebaseUid: string, email?: string) {
  const normalizedEmail = normalizeEmail(email);
  return {
    deletedAt: null,
    OR: [
      { firebaseUid },
      ...(normalizedEmail ? [{ email: normalizedEmail }] : [])
    ]
  };
}

export async function getOrganizerForSession(firebaseUid: string, email?: string) {
  await ensureDbConnection();

  const byUid = await prisma.organizer.findFirst({
    where: { owner: { firebaseUid, deletedAt: null }, deletedAt: null }
  });
  if (byUid) return byUid;

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  return prisma.organizer.findFirst({
    where: {
      deletedAt: null,
      owner: { email: normalizedEmail, deletedAt: null }
    }
  });
}

/** Oturum sahibi bu etkinliğin organizatörü mü? */
export async function isEventOwnedByFirebaseUid(
  eventId: string,
  firebaseUid: string,
  email?: string
): Promise<boolean> {
  await ensureDbConnection();
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      deletedAt: null,
      organizer: {
        deletedAt: null,
        owner: ownerIdentityFilter(firebaseUid, email)
      }
    },
    select: { id: true }
  });
  return Boolean(event);
}

/** Bilet/davetiye tarayıcısının bu bilete erişimi var mı? */
export async function canScannerAccessTicket(params: {
  ticketId: string;
  firebaseUid: string;
  email?: string;
  role?: UserRole;
  scannerOrganizerId?: string;
  eventOrganizerId: string;
  invitationOrganizerId?: string | null;
  orderOrganizerId?: string | null;
}): Promise<boolean> {
  if (
    params.role &&
    sessionHasRole({ uid: params.firebaseUid, role: params.role }, 'ROLE_ADMIN')
  ) {
    return true;
  }

  const ownedOrganizerIds = new Set(
    [params.eventOrganizerId, params.invitationOrganizerId, params.orderOrganizerId].filter(
      (id): id is string => Boolean(id)
    )
  );

  if (params.scannerOrganizerId && ownedOrganizerIds.has(params.scannerOrganizerId)) {
    return true;
  }

  await ensureDbConnection();

  const ownerWhere = ownerIdentityFilter(params.firebaseUid, params.email);

  const match = await prisma.purchasedTicket.findFirst({
    where: {
      id: params.ticketId,
      deletedAt: null,
      OR: [
        {
          event: {
            deletedAt: null,
            organizer: { deletedAt: null, owner: ownerWhere }
          }
        },
        {
          invitation: {
            deletedAt: null,
            organizer: { deletedAt: null, owner: ownerWhere }
          }
        },
        {
          order: {
            organizer: { deletedAt: null, owner: ownerWhere }
          }
        }
      ]
    },
    select: { id: true }
  });

  return Boolean(match);
}

export async function canManageEventTickets(
  firebaseUid: string,
  eventId: string,
  role?: UserRole,
  organizerId?: string,
  email?: string
): Promise<boolean> {
  if (role && sessionHasRole({ uid: firebaseUid, role }, 'ROLE_ADMIN')) {
    return true;
  }

  if (await isEventOwnedByFirebaseUid(eventId, firebaseUid, email)) {
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
  if (!session) return null;

  const organizer = await getOrganizerForSession(session.uid, session.email);
  if (!organizer) return null;

  // Panel erişimi organizatör profili ile — çerezdeki rol gecikmiş olabilir
  if (
    !sessionHasRole(session, 'ROLE_ORGANIZER') &&
    !sessionHasRole(session, 'ROLE_ADMIN')
  ) {
    return null;
  }

  return { session, organizer };
}
