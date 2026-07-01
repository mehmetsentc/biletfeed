import Image from 'next/image';
import { formatEventDate, formatEventTimeRange } from '@/lib/data/mock-events';
import { enforceAdminPageAccess } from '@/lib/auth/admin-api';
import { listPendingInternalEvents } from '@/lib/services/event-approvals';
import { EventApprovalActions } from '@/components/admin/event-approval-actions';
import { Badge } from '@/components/ui/badge';

export default async function AdminEventApprovalPage() {
  await enforceAdminPageAccess('/admin/etkinlik-onay');
  const events = await listPendingInternalEvents();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Etkinlik Onay</h1>
        <p className="text-sm text-muted-foreground">
          Organizatörlerin onaya gönderdiği dahili etkinlikleri inceleyin.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Organizatör</th>
              <th className="p-3 font-medium">Tarih</th>
              <th className="p-3 font-medium">Şehir</th>
              <th className="p-3 font-medium">Durum</th>
              <th className="p-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
                      {event.coverImage && (
                        <Image
                          src={event.coverImage}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium line-clamp-2">{event.title}</p>
                      <a
                        href={`/etkinlik/${event.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Önizleme
                      </a>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{event.organizer}</td>
                <td className="p-3 whitespace-nowrap text-muted-foreground">
                  {formatEventDate(event.startDate)}
                  <br />
                  {formatEventTimeRange(event)}
                </td>
                <td className="p-3">{event.city}</td>
                <td className="p-3">
                  <Badge className="bg-amber-50 text-amber-800">Onay Bekliyor</Badge>
                </td>
                <td className="p-3">
                  <EventApprovalActions eventId={event.id} eventTitle={event.title} />
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Onay bekleyen etkinlik yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
