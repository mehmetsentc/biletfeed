import { requireAdmin } from '@/lib/auth/guards';
import { AdminShell } from '@/app/admin/admin-shell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
