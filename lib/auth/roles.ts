import type { UserRole } from '@/types';

export const ROLES = {
  USER: 'ROLE_USER',
  ORGANIZER: 'ROLE_ORGANIZER',
  ADMIN: 'ROLE_ADMIN',
  SUPER_ADMIN: 'ROLE_SUPER_ADMIN'
} as const;

const ROLE_HIERARCHY: Record<UserRole, number> = {
  ROLE_USER: 0,
  ROLE_ORGANIZER: 1,
  ROLE_ADMIN: 2,
  ROLE_SUPER_ADMIN: 3
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isOrganizer(role: UserRole): boolean {
  return hasRole(role, ROLES.ORGANIZER);
}

export function isAdmin(role: UserRole): boolean {
  return hasRole(role, ROLES.ADMIN);
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === ROLES.SUPER_ADMIN;
}

export const PROTECTED_ROUTES = {
  dashboard: ROLES.ORGANIZER,
  admin: ROLES.ADMIN
} as const;

export const AUTH_ROUTES = ['/giris', '/kayit', '/sifremi-unuttum'] as const;

export const PUBLIC_ROUTES = [
  '/',
  '/etkinlikler',
  '/sehirler',
  '/kategoriler',
  '/mekanlar',
  '/organizatorler',
  '/ara',
  '/organizator'
] as const;
