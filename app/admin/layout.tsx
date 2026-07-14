import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/guards';
import { getAdminAccessByFirebaseUid } from '@/lib/services/admin-access';
import { AdminShell } from '@/app/admin/admin-shell';
import { siteHref } from '@/lib/config/domain';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const access = await getAdminAccessByFirebaseUid(session.uid, session.email);

  if (!access || (!access.isSuperAdmin && access.permissions.length === 0)) {
    redirect(`${siteHref('/')}?error=unauthorized`);
  }

  return (
    <AdminShell
      isSuperAdmin={access.isSuperAdmin}
      permissions={access.permissions}
    >
      {children}
    </AdminShell>
  );
}
