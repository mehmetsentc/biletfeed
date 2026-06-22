import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import {
  getOrganizerTickets,
  getOrganizerStats
} from '@/lib/services/organizer-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function OrganizatorTicketsPage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const [tickets, stats] = await Promise.all([
    getOrganizerTickets(organizer.id),
    getOrganizerStats(organizer.id)
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Biletler</h1>
          <p className="text-sm text-zinc-600">
            {stats.soldTickets} satış · {stats.scannedTickets} giriş yapıldı
          </p>
        </div>
        <Link href="/organizator-panel/tarayici">
          <Button className="bg-[#f5a623] text-black hover:bg-[#e09510]">
            QR Tarayıcı
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left">
            <tr>
              <th className="p-3 font-medium">Kod</th>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Tür</th>
              <th className="p-3 font-medium">Sahip</th>
              <th className="p-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b last:border-0">
                <td className="p-3 font-mono text-xs">{ticket.ticketCode}</td>
                <td className="p-3">{ticket.event.title}</td>
                <td className="p-3">{ticket.ticketType.name}</td>
                <td className="p-3">{ticket.user.displayName}</td>
                <td className="p-3">
                  <Badge
                    variant={
                      ticket.status === 'VALID'
                        ? 'success'
                        : ticket.status === 'USED'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {ticket.status === 'VALID'
                      ? 'Geçerli'
                      : ticket.status === 'USED'
                        ? 'Kullanıldı'
                        : ticket.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Henüz bilet satışı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
