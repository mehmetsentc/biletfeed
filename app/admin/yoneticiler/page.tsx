import { enforceSuperAdminPageAccess } from '@/lib/auth/admin-api';
import { listManagedAdmins } from '@/lib/services/admin-access';
import { AdminAccessPanel } from '@/components/admin/admin-access-panel';

export default async function AdminManagersPage() {
  await enforceSuperAdminPageAccess();
  const admins = await listManagedAdmins();

  const rows = admins.map((admin) => ({
    ...admin,
    createdAt: admin.createdAt.toISOString()
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Yönetimi</h1>
        <p className="text-muted-foreground">
          Süper admin olarak kullanıcıları admin yapın, görev tanımlarını seçin ve hangi
          işlemleri yapabileceklerini belirleyin.
        </p>
      </div>
      <AdminAccessPanel initialAdmins={rows} />
    </div>
  );
}
