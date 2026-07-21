import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { ROLES, isSuperAdmin } from '@/lib/auth/roles';
import { isBootstrapSuperAdminEmail } from '@/lib/auth/bootstrap-admins';
import {
  type AdminPermission,
  buildAdminAccessContext,
  sanitizeAdminPermissions,
  type AdminAccessContext
} from '@/lib/auth/admin-permissions';

export type AdminUserRow = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  adminPermissions: AdminPermission[];
  createdAt: Date;
};

async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  return prisma.user.findFirst({
    where: { email: normalized, deletedAt: null },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      adminPermissions: true,
      createdAt: true
    }
  });
}

export async function getAdminAccessByFirebaseUid(
  firebaseUid: string,
  email?: string
): Promise<AdminAccessContext | null> {
  await ensureDbConnection();

  let user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true, role: true, email: true, adminPermissions: true }
  });

  if (!user && email) {
    user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), deletedAt: null },
      select: { id: true, role: true, email: true, adminPermissions: true }
    });
  }

  if (!user) {
    if (email && isBootstrapSuperAdminEmail(email)) {
      return buildAdminAccessContext({
        userId: 'bootstrap',
        role: ROLES.SUPER_ADMIN,
        adminPermissions: []
      });
    }
    return null;
  }

  const effectiveRole = isBootstrapSuperAdminEmail(user.email)
    ? ROLES.SUPER_ADMIN
    : user.role;

  return buildAdminAccessContext({
    userId: user.id,
    role: effectiveRole,
    adminPermissions: user.adminPermissions
  });
}

export async function listManagedAdmins(): Promise<AdminUserRow[]> {
  await ensureDbConnection();
  const rows = await prisma.user.findMany({
    where: {
      deletedAt: null,
      role: { in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      adminPermissions: true,
      createdAt: true
    },
    orderBy: [{ role: 'desc' }, { createdAt: 'asc' }]
  });

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    adminPermissions: sanitizeAdminPermissions(row.adminPermissions),
    createdAt: row.createdAt
  }));
}

export async function assignAdminByEmail(params: {
  email: string;
  permissions: AdminPermission[];
  actorUserId: string;
}): Promise<AdminUserRow> {
  await ensureDbConnection();

  const user = await findUserByEmail(params.email);
  if (!user) {
    throw new Error('Bu e-posta ile kayıtlı kullanıcı bulunamadı. Önce platforma kayıt olmalı.');
  }

  if (isBootstrapSuperAdminEmail(user.email) || isSuperAdmin(user.role)) {
    throw new Error('Süper admin hesabının yetkileri değiştirilemez.');
  }

  if (params.permissions.length === 0) {
    throw new Error('En az bir admin görevi seçmelisiniz.');
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      role: ROLES.ADMIN,
      adminPermissions: params.permissions
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      adminPermissions: true,
      createdAt: true
    }
  });

  return {
    id: updated.id,
    email: updated.email,
    displayName: updated.displayName,
    role: updated.role,
    adminPermissions: sanitizeAdminPermissions(updated.adminPermissions),
    createdAt: updated.createdAt
  };
}

export async function updateAdminPermissions(params: {
  userId: string;
  permissions: AdminPermission[];
  actorUserId: string;
}): Promise<AdminUserRow> {
  await ensureDbConnection();

  const user = await prisma.user.findFirst({
    where: { id: params.userId, deletedAt: null },
    select: { id: true, email: true, role: true }
  });

  if (!user) throw new Error('Kullanıcı bulunamadı');
  if (user.role !== ROLES.ADMIN) {
    throw new Error('Yalnızca admin hesaplarının görevleri düzenlenebilir.');
  }
  if (params.permissions.length === 0) {
    throw new Error('En az bir admin görevi seçmelisiniz.');
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { adminPermissions: params.permissions },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      adminPermissions: true,
      createdAt: true
    }
  });

  return {
    id: updated.id,
    email: updated.email,
    displayName: updated.displayName,
    role: updated.role,
    adminPermissions: sanitizeAdminPermissions(updated.adminPermissions),
    createdAt: updated.createdAt
  };
}

export async function revokeAdminAccess(params: {
  userId: string;
  actorUserId: string;
}): Promise<void> {
  await ensureDbConnection();

  if (params.userId === params.actorUserId) {
    throw new Error('Kendi admin yetkinizi kaldıramazsınız.');
  }

  const user = await prisma.user.findFirst({
    where: { id: params.userId, deletedAt: null },
    select: { id: true, email: true, role: true }
  });

  if (!user) throw new Error('Kullanıcı bulunamadı');
  if (isBootstrapSuperAdminEmail(user.email) || isSuperAdmin(user.role)) {
    throw new Error('Süper admin yetkisi kaldırılamaz.');
  }

  // Organizatör hesabı varsa admin düşürülünce ROLE_USER yapılmamalı —
  // aksi halde panel AuthGuard siyah ekran / yönlendirme döngüsü verir.
  const ownsOrganizer = await prisma.organizer.findFirst({
    where: { ownerId: user.id, deletedAt: null },
    select: { id: true }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: ownsOrganizer ? ROLES.ORGANIZER : ROLES.USER,
      adminPermissions: []
    }
  });
}
