import type { UserRole } from '@/types';
import { prisma, isDatabaseConfigured, ensureDbConnection } from '@/lib/db/prisma';
import { ROLES } from '@/lib/auth/roles';
import { getAdminAuth, isFirebaseAdminConfigured } from '@/lib/firebase/admin';

export interface DbUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  organizerId?: string;
  favorites: string[];
  following: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncUserInput {
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export async function syncUserFromFirebase(
  input: SyncUserInput
): Promise<DbUser | null> {
  if (!isDatabaseConfigured()) return null;

  await ensureDbConnection();

  const user = await prisma.user.upsert({
    where: { firebaseUid: input.firebaseUid },
    create: {
      firebaseUid: input.firebaseUid,
      email: input.email,
      displayName: input.displayName,
      photoURL: input.photoURL,
      role: ROLES.USER
    },
    update: {
      email: input.email,
      displayName: input.displayName,
      photoURL: input.photoURL
    },
    include: {
      favorites: { select: { eventId: true } },
      followers: { select: { organizerId: true } },
      ownedOrganizer: { select: { id: true } }
    }
  });

  await syncFirebaseCustomClaims(input.firebaseUid, user.role);

  return mapDbUser(user);
}

export async function syncFirebaseCustomClaims(
  firebaseUid: string,
  role: UserRole
): Promise<void> {
  if (!isFirebaseAdminConfigured()) return;
  try {
    const adminAuth = getAdminAuth();
    await adminAuth.setCustomUserClaims(firebaseUid, { role });
  } catch {
    // non-blocking
  }
}

export async function getUserByFirebaseUid(
  firebaseUid: string
): Promise<DbUser | null> {
  if (!isDatabaseConfigured()) return null;

  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    include: {
      favorites: { select: { eventId: true } },
      followers: { select: { organizerId: true } },
      ownedOrganizer: { select: { id: true } }
    }
  });

  return user ? mapDbUser(user) : null;
}

export async function getUserRoleByFirebaseUid(
  firebaseUid: string
): Promise<UserRole | null> {
  if (!isDatabaseConfigured()) return null;
  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { role: true }
  });
  return user?.role ?? null;
}

function mapDbUser(user: {
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  ownedOrganizer: { id: string } | null;
  favorites: { eventId: string }[];
  followers: { organizerId: string }[];
  createdAt: Date;
  updatedAt: Date;
}): DbUser {
  return {
    uid: user.firebaseUid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL ?? undefined,
    role: user.role,
    organizerId: user.ownedOrganizer?.id,
    favorites: user.favorites.map((f) => f.eventId),
    following: user.followers.map((f) => f.organizerId),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
