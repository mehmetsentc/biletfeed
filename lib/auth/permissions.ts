import type { UserRole } from '@/types';
import { hasRole, PROTECTED_ROUTES } from './roles';

export function canAccessDashboard(role: UserRole): boolean {
  return hasRole(role, PROTECTED_ROUTES.dashboard);
}

export function canAccessAdmin(role: UserRole): boolean {
  return hasRole(role, PROTECTED_ROUTES.admin);
}

export function canManageEvent(
  role: UserRole,
  userOrganizerId: string | undefined,
  eventOrganizerId: string
): boolean {
  if (hasRole(role, 'ROLE_ADMIN')) return true;
  if (role === 'ROLE_ORGANIZER' && userOrganizerId === eventOrganizerId) {
    return true;
  }
  return false;
}

export function canModeratePlatform(role: UserRole): boolean {
  return hasRole(role, 'ROLE_ADMIN');
}

export function canManageCommissions(role: UserRole): boolean {
  return role === 'ROLE_SUPER_ADMIN';
}
