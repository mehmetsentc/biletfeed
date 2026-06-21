import { getAdminUsers } from '@/lib/services/admin-dashboard';
import { Badge } from '@/components/ui/badge';

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kullanıcılar</h1>
        <p className="text-muted-foreground">Kayıtlı kullanıcılar</p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Ad</th>
              <th className="p-3 font-medium">E-posta</th>
              <th className="p-3 font-medium">Rol</th>
              <th className="p-3 font-medium">Organizatör</th>
              <th className="p-3 font-medium">Kayıt</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{user.displayName}</td>
                <td className="p-3 text-muted-foreground">{user.email}</td>
                <td className="p-3">
                  <Badge variant="secondary">{user.role.replace('ROLE_', '')}</Badge>
                </td>
                <td className="p-3">{user.ownedOrganizer?.name || '—'}</td>
                <td className="p-3 whitespace-nowrap text-muted-foreground">
                  {user.createdAt.toLocaleDateString('tr-TR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
