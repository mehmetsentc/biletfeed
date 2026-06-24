import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export async function getOrganizerCheckInStats(organizerId: string) {
  await ensureDbConnection();

  const [sold, checkedIn, waiting, recentCheckIns, capacity] = await Promise.all([
    prisma.purchasedTicket.count({
      where: {
        event: { organizerId },
        deletedAt: null,
        status: { in: ['VALID', 'USED'] }
      }
    }),
    prisma.purchasedTicket.count({
      where: {
        event: { organizerId },
        deletedAt: null,
        entryCount: { gt: 0 }
      }
    }),
    prisma.purchasedTicket.count({
      where: {
        event: { organizerId },
        deletedAt: null,
        status: 'VALID',
        entryCount: 0
      }
    }),
    prisma.ticketCheckIn.findMany({
      where: { event: { organizerId } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        ticket: {
          select: {
            ticketCode: true,
            attendeeName: true,
            user: { select: { displayName: true } },
            event: { select: { title: true } }
          }
        }
      }
    }),
    prisma.event.aggregate({
      where: { organizerId, deletedAt: null },
      _sum: { capacity: true }
    })
  ]);

  const totalCapacity = capacity._sum.capacity ?? sold;
  const attendancePct =
    sold > 0 ? Math.round((checkedIn / sold) * 100) : 0;

  return {
    sold,
    checkedIn,
    waiting,
    totalCapacity,
    attendancePct,
    recentCheckIns: recentCheckIns.map((row) => ({
      id: row.id,
      result: row.result,
      createdAt: row.createdAt,
      ticketCode: row.ticket.ticketCode,
      holderName:
        row.ticket.attendeeName?.trim() || row.ticket.user.displayName,
      eventTitle: row.ticket.event.title
    }))
  };
}

export async function exportOrganizerTicketsCsv(organizerId: string): Promise<string> {
  await ensureDbConnection();

  const tickets = await prisma.purchasedTicket.findMany({
    where: { event: { organizerId }, deletedAt: null },
    include: {
      event: { select: { title: true } },
      ticketType: { select: { name: true } },
      user: { select: { displayName: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const header =
    'Kod,Etkinlik,Tür,Sahip,E-posta,Durum,Giriş Sayısı,Oluşturulma';
  const rows = tickets.map((t) =>
    [
      t.ticketCode,
      csvEscape(t.event.title),
      csvEscape(t.ticketType.name),
      csvEscape(t.attendeeName || t.user.displayName),
      t.attendeeEmail || t.user.email,
      t.status,
      String(t.entryCount),
      t.createdAt.toISOString()
    ].join(',')
  );

  return [header, ...rows].join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function searchAdminTickets(query: string, limit = 50) {
  await ensureDbConnection();
  const q = query.trim();
  if (!q) return [];

  return prisma.purchasedTicket.findMany({
    where: {
      deletedAt: null,
      OR: [
        { ticketCode: { contains: q, mode: 'insensitive' } },
        { attendeeName: { contains: q, mode: 'insensitive' } },
        { attendeeEmail: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { displayName: { contains: q, mode: 'insensitive' } } },
        { validationToken: q }
      ]
    },
    include: {
      event: { select: { title: true } },
      ticketType: { select: { name: true } },
      user: { select: { displayName: true, email: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}
