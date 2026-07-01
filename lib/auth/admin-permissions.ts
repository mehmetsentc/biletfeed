import type { UserRole } from '@/types';
import { ROLES, isSuperAdmin } from '@/lib/auth/roles';

/** Granüler admin yetki anahtarları */
export const ADMIN_PERMISSION_KEYS = [
  'dashboard',
  'users.view',
  'users.manage',
  'organizers.view',
  'organizers.manage',
  'events.view',
  'events.manage',
  'events.approve',
  'events.scrape',
  'feed.view',
  'feed.manage',
  'categories.manage',
  'cities.manage',
  'venues.manage',
  'orders.view',
  'orders.refund',
  'tickets.view',
  'tickets.manage',
  'transactions.view',
  'analytics.view',
  'banners.manage',
  'accounting.view',
  'accounting.manage',
  'settings.manage',
  'admins.manage'
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSION_KEYS)[number];

export interface AdminPermissionGroup {
  id: string;
  label: string;
  description: string;
  permissions: Array<{ key: AdminPermission; label: string; description?: string }>;
}

export const ADMIN_PERMISSION_GROUPS: AdminPermissionGroup[] = [
  {
    id: 'general',
    label: 'Genel',
    description: 'Panel erişimi ve özet ekran',
    permissions: [{ key: 'dashboard', label: 'Dashboard', description: 'Ana panel özeti' }]
  },
  {
    id: 'users',
    label: 'Kullanıcılar',
    description: 'Kayıtlı kullanıcıları görüntüleme ve yönetme',
    permissions: [
      { key: 'users.view', label: 'Kullanıcıları görüntüle' },
      { key: 'users.manage', label: 'Kullanıcıları yönet' }
    ]
  },
  {
    id: 'organizers',
    label: 'Organizatörler',
    description: 'Organizatör onay ve profil yönetimi',
    permissions: [
      { key: 'organizers.view', label: 'Organizatörleri görüntüle' },
      { key: 'organizers.manage', label: 'Organizatörleri yönet' }
    ]
  },
  {
    id: 'events',
    label: 'Etkinlikler',
    description: 'Etkinlik editörü, onay ve scraper',
    permissions: [
      { key: 'events.view', label: 'Etkinlikleri görüntüle' },
      { key: 'events.manage', label: 'Etkinlikleri düzenle' },
      { key: 'events.approve', label: 'Etkinlik onayla', description: 'Organizatör etkinliklerini onaylama' },
      { key: 'events.scrape', label: 'Scraper çalıştır', description: 'Harici etkinlik kazıma' }
    ]
  },
  {
    id: 'feed',
    label: 'Feed',
    description: 'Feed içerik yönetimi',
    permissions: [
      { key: 'feed.view', label: 'Feed görüntüle' },
      { key: 'feed.manage', label: 'Feed yönet' }
    ]
  },
  {
    id: 'catalog',
    label: 'Katalog',
    description: 'Kategori, şehir ve mekan',
    permissions: [
      { key: 'categories.manage', label: 'Kategoriler' },
      { key: 'cities.manage', label: 'Şehirler' },
      { key: 'venues.manage', label: 'Mekanlar' }
    ]
  },
  {
    id: 'commerce',
    label: 'Satış & Bilet',
    description: 'Sipariş, bilet ve işlemler',
    permissions: [
      { key: 'orders.view', label: 'Siparişleri görüntüle' },
      { key: 'orders.refund', label: 'İade işlemleri' },
      { key: 'tickets.view', label: 'Biletleri görüntüle' },
      { key: 'tickets.manage', label: 'Biletleri yönet' },
      { key: 'transactions.view', label: 'İşlem geçmişi' }
    ]
  },
  {
    id: 'insights',
    label: 'Raporlama',
    description: 'Analitik ve muhasebe',
    permissions: [
      { key: 'analytics.view', label: 'Analitik' },
      { key: 'accounting.view', label: 'Muhasebe görüntüle' },
      { key: 'accounting.manage', label: 'Muhasebe yönet' }
    ]
  },
  {
    id: 'content',
    label: 'İçerik & Ayarlar',
    description: 'Banner ve sistem ayarları',
    permissions: [
      { key: 'banners.manage', label: 'Banner yönetimi' },
      { key: 'settings.manage', label: 'Sistem ayarları' }
    ]
  },
  {
    id: 'admins',
    label: 'Yönetici Atama',
    description: 'Yalnızca süper admin — diğer adminleri atama',
    permissions: [
      {
        key: 'admins.manage',
        label: 'Admin yönetimi',
        description: 'Admin atama, görev tanımı ve yetki düzenleme'
      }
    ]
  }
];

/** Admin menü → gerekli yetki */
export const ADMIN_NAV_PERMISSIONS: Record<string, AdminPermission> = {
  '/admin': 'dashboard',
  '/admin/kullanicilar': 'users.view',
  '/admin/organizatorler': 'organizers.view',
  '/admin/etkinlikler': 'events.view',
  '/admin/etkinlik-onay': 'events.approve',
  '/admin/feed': 'feed.view',
  '/admin/kategoriler': 'categories.manage',
  '/admin/sehirler': 'cities.manage',
  '/admin/mekanlar': 'venues.manage',
  '/admin/siparisler': 'orders.view',
  '/admin/biletler': 'tickets.view',
  '/admin/islemler': 'transactions.view',
  '/admin/analitik': 'analytics.view',
  '/admin/bannerlar': 'banners.manage',
  '/admin/muhasebe': 'accounting.view',
  '/admin/ayarlar': 'settings.manage',
  '/admin/yoneticiler': 'admins.manage',
  '/admin/raporlar': 'analytics.view'
};

export function isAdminPermission(value: string): value is AdminPermission {
  return (ADMIN_PERMISSION_KEYS as readonly string[]).includes(value);
}

export function sanitizeAdminPermissions(values: string[]): AdminPermission[] {
  return values.filter(isAdminPermission);
}

export function allAdminPermissions(): AdminPermission[] {
  return [...ADMIN_PERMISSION_KEYS];
}

export interface AdminAccessContext {
  userId: string;
  role: UserRole;
  isSuperAdmin: boolean;
  permissions: AdminPermission[];
}

export function buildAdminAccessContext(params: {
  userId: string;
  role: UserRole;
  adminPermissions: string[];
}): AdminAccessContext | null {
  if (params.role !== ROLES.ADMIN && params.role !== ROLES.SUPER_ADMIN) {
    return null;
  }

  if (isSuperAdmin(params.role)) {
    return {
      userId: params.userId,
      role: params.role,
      isSuperAdmin: true,
      permissions: allAdminPermissions()
    };
  }

  return {
    userId: params.userId,
    role: params.role,
    isSuperAdmin: false,
    permissions: sanitizeAdminPermissions(params.adminPermissions)
  };
}

export function hasAdminPermission(
  access: AdminAccessContext | null | undefined,
  permission: AdminPermission
): boolean {
  if (!access) return false;
  if (access.isSuperAdmin) return true;
  return access.permissions.includes(permission);
}

export function canAccessAdminNavPath(
  access: AdminAccessContext | null | undefined,
  href: string
): boolean {
  if (!access) return false;
  if (access.isSuperAdmin) return true;

  const required = ADMIN_NAV_PERMISSIONS[href];
  if (!required) return true;
  return hasAdminPermission(access, required);
}

export function resolveAdminPathPermission(pathname: string): AdminPermission | null {
  if (ADMIN_NAV_PERMISSIONS[pathname]) {
    return ADMIN_NAV_PERMISSIONS[pathname];
  }
  if (pathname.startsWith('/admin/etkinlikler')) return 'events.view';
  if (pathname.startsWith('/admin/organizatorler')) return 'organizers.view';
  if (pathname.startsWith('/admin/siparisler')) return 'orders.view';
  if (pathname.startsWith('/admin/muhasebe')) return 'accounting.view';
  return null;
}

export function permissionLabel(key: AdminPermission): string {
  for (const group of ADMIN_PERMISSION_GROUPS) {
    const found = group.permissions.find((p) => p.key === key);
    if (found) return found.label;
  }
  return key;
}
