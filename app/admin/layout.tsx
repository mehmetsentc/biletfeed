import { requireAdmin } from '@/lib/auth/guards';
import { AdminShell } from '@/app/admin/admin-shell';

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
