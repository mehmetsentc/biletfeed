import { ROLES } from '@/lib/auth/roles';

const DEFAULT_SUPER_ADMIN_EMAILS = ['mehmetsentc@gmail.com'];

/** Comma-separated bootstrap superadmin emails from env. */
export function getBootstrapSuperAdminEmails(): string[] {
  const fromEnv = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return fromEnv.length > 0 ? fromEnv : DEFAULT_SUPER_ADMIN_EMAILS;
}

export function isBootstrapSuperAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return getBootstrapSuperAdminEmails().includes(normalized);
}

export function bootstrapRoleForEmail(email: string) {
  return isBootstrapSuperAdminEmail(email) ? ROLES.SUPER_ADMIN : ROLES.USER;
}
