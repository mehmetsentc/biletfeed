import { getAdminVenues } from '@/lib/services/admin-dashboard';

export default async function AdminVenuesPage() {
  const venues = await getAdminVenues();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mekanlar</h1>
        <p className="text-muted-foreground">{venues.length} mekan</p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Mekan</th>
              <th className="p-3 font-medium">Şehir</th>
              <th className="p-3 font-medium">Organizatör</th>
              <th className="p-3 font-medium">Kapasite</th>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Adres</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((v) => (
              <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="p-3">
                  <p className="font-medium">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.slug}</p>
                </td>
                <td className="p-3">{v.city.name}</td>
                <td className="p-3 text-muted-foreground">{v.organizer?.name ?? '—'}</td>
                <td className="p-3 text-center">{v.capacity?.toLocaleString('tr-TR') ?? '—'}</td>
                <td className="p-3 text-center font-semibold">{v.eventCount}</td>
                <td className="p-3 max-w-xs truncate text-xs text-muted-foreground">{v.address}</td>
              </tr>
            ))}
            {venues.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Mekan yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
