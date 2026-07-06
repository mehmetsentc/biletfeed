import type { UserRole } from '@/types';
import { verifyOrganizerPanelSession, sessionHasRole } from '@/lib/auth/session';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { ensureOrganizerContactEmail } from '@/lib/services/organizer-panel';

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

  // E-posta organizatör sahibine aitse onu önceliklendir (kapı taraması / panel)
  if (normalizedEmail) {
    const organizerOwner = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        deletedAt: null,
        ownedOrganizer: { is: { deletedAt: null } }
      },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        role: true,
        displayName: true
      }
    });
    if (organizerOwner) {
      if (organizerOwner.firebaseUid !== firebaseUid) {
        return prisma.user.update({
          where: { id: organizerOwner.id },
          data: { firebaseUid },
          select: {
            id: true,
            firebaseUid: true,
            email: true,
            role: true,
            displayName: true
          }
        });
      }
      return organizerOwner;
    }
  }

  let user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true, firebaseUid: true, email: true, role: true, displayName: true }
  });

  // Firebase UID başka bir profile bağlı ama oturum e-postası organizatör hesabına aitse
  // organizatör hesabını önceliklendir (kapı taramasında sık görülen senaryo)
  if (user && normalizedEmail && normalizeEmail(user.email) !== normalizedEmail) {
    const byEmail = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
      select: { id: true, firebaseUid: true, email: true, role: true, displayName: true }
    });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { firebaseUid },
        select: { id: true, firebaseUid: true, email: true, role: true, displayName: true }
      });
    }
  }

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
  session: NonNullable<Awaited<ReturnType<typeof verifyOrganizerPanelSession>>>;
  user: { id: string; firebaseUid: string; email: string; role: UserRole };
  organizer: { id: string } | null;
  scannerUserId: string;
  scannerOrganizerId?: string;
};

/** QR tarayıcı oturumu — kullanıcı + organizatör tek kaynaktan çözülür */
export async function resolveScannerContext(): Promise<ScannerContext | null> {
  const session = await verifyOrganizerPanelSession();
  if (!session) return null;

  await ensureDbConnection();

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
  eventId?: string;
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
    (sessionHasRole({ uid: params.firebaseUid, role: params.role }, 'ROLE_ADMIN') ||
      params.role === 'ROLE_SUPER_ADMIN')
  ) {
    return true;
  }

  // Doğrudan organizatör eşleşmesi — en hızlı ve güvenilir yol
  if (
    params.scannerOrganizerId &&
    params.eventOrganizerId === params.scannerOrganizerId
  ) {
    return true;
  }

  if (params.scannerUserId && params.eventId) {
    const ownsEvent = await prisma.event.findFirst({
      where: {
        id: params.eventId,
        deletedAt: null,
        organizer: { deletedAt: null, ownerId: params.scannerUserId }
      },
      select: { id: true }
    });
    if (ownsEvent) return true;
  }

  const ticketOrganizerIds = [
    params.eventOrganizerId,
    params.invitationOrganizerId,
    params.orderOrganizerId
  ].filter((id): id is string => Boolean(id));

  if (
    params.scannerOrganizerId &&
    ticketOrganizerIds.includes(params.scannerOrganizerId)
  ) {
    return true;
  }

  if (params.eventId) {
    const ownsEvent = await isEventOwnedByFirebaseUid(
      params.eventId,
      params.firebaseUid,
      params.email
    );
    if (ownsEvent) return true;
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

export type OrganizerSessionContext = {
  session: NonNullable<Awaited<ReturnType<typeof verifyOrganizerPanelSession>>>;
  organizer: NonNullable<
    Awaited<ReturnType<typeof prisma.organizer.findFirst>>
  >;
  user: { id: string; email: string };
};

export type OrganizerSessionDenyReason =
  | 'no_session'
  | 'no_user'
  | 'no_organizer'
  | 'suspended';

export type OrganizerSessionResolve =
  | { ok: true; ctx: OrganizerSessionContext }
  | { ok: false; reason: OrganizerSessionDenyReason };

/** Panel API oturumu — tamamlanmış profil zorunlu değil (ayarlar / mevcut etkinlik düzenleme). */
export async function resolveOrganizerSession(): Promise<OrganizerSessionResolve> {
  const session = await verifyOrganizerPanelSession();
  if (!session) return { ok: false, reason: 'no_session' };

  await ensureDbConnection();

  const user = await resolveScannerUser(session.uid, session.email);
  if (!user) return { ok: false, reason: 'no_user' };

  const organizer = await prisma.organizer.findFirst({
    where: { ownerId: user.id, deletedAt: null }
  });
  if (!organizer) return { ok: false, reason: 'no_organizer' };
  if (organizer.status === 'suspended') return { ok: false, reason: 'suspended' };

  await ensureOrganizerContactEmail(organizer.id, user.email);
  const syncedOrganizer =
    (await prisma.organizer.findFirst({
      where: { id: organizer.id, deletedAt: null }
    })) ?? organizer;

  return {
    ok: true,
    ctx: {
      session,
      organizer: syncedOrganizer,
      user: { id: user.id, email: user.email }
    }
  };
}

export async function requireOrganizerSession(): Promise<OrganizerSessionContext | null> {
  const resolved = await resolveOrganizerSession();
  return resolved.ok ? resolved.ctx : null;
}
