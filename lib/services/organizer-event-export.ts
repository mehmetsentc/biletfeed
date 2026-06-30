import { prisma, ensureDbConnection } from '@/lib/db/prisma';

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Etkinlik bazlı satış raporu (CSV) */
export async function exportEventSalesCsv(
  organizerId: string,
  eventId: string
): Promise<string | null> {
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    select: { title: true }
  });
  if (!event) return null;

  const [orders, tickets] = await Promise.all([
    prisma.order.findMany({
      where: { eventId, status: 'paid', deletedAt: null },
      orderBy: { paidAt: 'desc' },
      include: {
        user: { select: { displayName: true, email: true } },
        items: { include: { ticketType: { select: { name: true } } } }
      }
    }),
    prisma.purchasedTicket.findMany({
      where: { eventId, deletedAt: null },
      include: {
        ticketType: { select: { name: true } },
        user: { select: { displayName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const orderHeader =
    'Sipariş ID,Müşteri,E-posta,Tutar,Ödeme Tarihi,Kalemler';
  const orderRows = orders.map((o) =>
    [
      o.id,
      csvEscape(o.attendeeName || o.user.displayName),
      o.attendeeEmail || o.user.email,
      String(o.total),
      (o.paidAt ?? o.createdAt).toISOString(),
      csvEscape(
        o.items.map((i) => `${i.quantity}x ${i.ticketType.name}`).join('; ')
      )
    ].join(',')
  );

  const ticketHeader =
    'Bilet Kodu,Tür,Sahip,E-posta,Durum,Giriş,Oluşturulma';
  const ticketRows = tickets.map((t) =>
    [
      t.ticketCode,
      csvEscape(t.ticketType.name),
      csvEscape(t.attendeeName || t.user.displayName),
      t.attendeeEmail || t.user.email,
      t.status,
      String(t.entryCount),
      t.createdAt.toISOString()
    ].join(',')
  );

  return [
    `# ${event.title}`,
    '',
    '## Siparişler',
    orderHeader,
    ...orderRows,
    '',
    '## Biletler',
    ticketHeader,
    ...ticketRows
  ].join('\n');
}
