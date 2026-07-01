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

/** DB kullanıcısı — uid/e-posta uyumsuzluğunda firebaseUid senkronize edilir */
export async function resolveScannerUser(firebaseUid: string, email?: string) {
  await ensureDbConnection();
  const normalizedEmail = normalizeEmail(email);

  let user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true, firebaseUid: true, email: true, role: true, displayName: true }
  });

  if (!user && normalizedEmail) {
    user = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
      select: { id: true, firebaseUid: true, email: true, role: true, displayName: true }
    });
    if (user && user.firebaseUid !== firebaseUid) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid },
        select: { id: true, firebaseUid: true, email: true, role: true, displayName: true }
      });
    }
  }

  return user;
}

export async function getOrganizerForSession(firebaseUid: string, email?: string) {
  const user = await resolveScannerUser(firebaseUid, email);
  if (!user) return null;

  return prisma.organizer.findFirst({
    where: { ownerId: user.id, deletedAt: null }
  });
}

export type ScannerContext = {
  session: NonNullable<Awaited<ReturnType<typeof verifySessionCookie>>>;
  user: { id: string; firebaseUid: string; email: string; role: UserRole };
  organizer: { id: string } | null;
  scannerUserId: string;
  scannerOrganizerId?: string;
};

/** QR tarayıcı oturumu — kullanıcı + organizatör tek kaynaktan çözülür */
export async function resolveScannerContext(): Promise<ScannerContext | null> {
  const session = await verifySessionCookie();
  if (!session) return null;

  const user = await resolveScannerUser(session.uid, session.email);
  if (!user) return null;

  const organizer = await prisma.organizer.findFirst({
    where: { ownerId: user.id, deletedAt: null },
    select: { id: true }
  });

  if (organizer) {
    return {
      session,
      user: { ...user, role: user.role as UserRole },
      organizer,
      scannerUserId: user.id,
      scannerOrganizerId: organizer.id
    };
  }

  if (sessionHasRole({ uid: session.uid, role: user.role as UserRole }, 'ROLE_ADMIN')) {
    return {
      session,
      user: { ...user, role: user.role as UserRole },
      organizer: null,
      scannerUserId: user.id,
      scannerOrganizerId: undefined
    };
  }

  return null;
}

/** Oturum sahibi bu etkinliğin organizatörü mü? */
export async function isEventOwnedByFirebaseUid(
  eventId: string,
  firebaseUid: string,
  email?: string
): Promise<boolean> {
  await ensureDbConnection();
  const user = await resolveScannerUser(firebaseUid, email);
  if (!user) return false;

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      deletedAt: null,
      organizer: { deletedAt: null, ownerId: user.id }
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
  scannerUserId?: string;
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

  await ensureDbConnection();

  const user =
    params.scannerUserId != null
      ? { id: params.scannerUserId }
      : await resolveScannerUser(params.firebaseUid, params.email);

  if (!user) return false;

  // En güvenilir yol: etkinlik/davetiye/sipariş organizatörünün ownerId'si
  const ownerMatch = await prisma.purchasedTicket.findFirst({
    where: {
      id: params.ticketId,
      deletedAt: null,
      OR: [
        {
          event: {
            deletedAt: null,
            organizer: { deletedAt: null, ownerId: user.id }
          }
        },
        {
          invitation: {
            deletedAt: null,
            organizer: { deletedAt: null, ownerId: user.id }
          }
        },
        {
          order: {
            organizer: { deletedAt: null, ownerId: user.id }
          }
        }
      ]
    },
    select: { id: true }
  });
  if (ownerMatch) return true;

  const ownedOrganizerIds = new Set(
    [params.eventOrganizerId, params.invitationOrganizerId, params.orderOrganizerId].filter(
      (id): id is string => Boolean(id)
    )
  );

  if (params.scannerOrganizerId && ownedOrganizerIds.has(params.scannerOrganizerId)) {
    return true;
  }

  const ownerWhere = ownerIdentityFilter(params.firebaseUid, params.email);

  const identityMatch = await prisma.purchasedTicket.findFirst({
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

  return Boolean(identityMatch);
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

  const user = await resolveScannerUser(session.uid, session.email);
  if (!user) return null;

  const organizer = await prisma.organizer.findFirst({
    where: { ownerId: user.id, deletedAt: null }
  });
  if (!organizer) return null;

  return { session, organizer };
}
