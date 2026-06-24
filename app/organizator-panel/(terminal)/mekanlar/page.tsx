import { redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerVenues, getOrganizerCities } from '@/lib/services/organizer-panel';
import { VenuesManager } from '@/components/organizator-panel/venues-manager';
import type { SeatPlan } from '@/lib/services/organizer-panel';

export default async function OrganizatorVenuesPage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const [venues, cities] = await Promise.all([
    getOrganizerVenues(organizer.id),
    getOrganizerCities()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-800">Mekan & Koltuk</h1>
        <p className="text-sm text-zinc-600">Etkinlikleriniz için mekan tanımlayın ve kapasite belirleyin</p>
      </div>
      <VenuesManager
        initialVenues={venues.map((v) => ({
          id: v.id,
          name: v.name,
          address: v.address,
          capacity: v.capacity,
          seatPlan: v.seatPlan as SeatPlan,
          city: v.city
        }))}
        cities={cities}
      />
    </div>
  );
}
