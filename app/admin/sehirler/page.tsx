import { getAdminCities } from '@/lib/services/admin-dashboard';
import { CityAdminPanel } from '@/components/admin/city-admin-panel';

export default async function AdminCitiesPage() {
  const cities = await getAdminCities();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Şehirler</h1>
        <p className="text-muted-foreground">
          {cities.length} şehir — görsel ve slug yönetimi
        </p>
      </div>
      <CityAdminPanel cities={cities} />
    </div>
  );
}
