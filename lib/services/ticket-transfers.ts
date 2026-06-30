import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getSiteUrl } from '@/lib/config/domain';
import { queueEmail } from '@/lib/accounting/email';
import { createNotification } from '@/lib/services/notifications';

export async function initiateTicketTransfer(params: {
  ticketId: string;
  fromFirebaseUid: string;
  toEmail: string;
}): Promise<{ transferId: string }> {
  await ensureDbConnection();

  const fromUser = await prisma.user.findFirst({
    where: { firebaseUid: params.fromFirebaseUid, deletedAt: null }
  });
  if (!fromUser) throw new Error('Kullanıcı bulunamadı');

  const ticket = await prisma.purchasedTicket.findFirst({
    where: {
      id: params.ticketId,
      userId: fromUser.id,
      deletedAt: null,
      status: 'VALID'
    },
    include: {
      event: { select: { title: true, startDate: true } },
      invitation: { select: { id: true } }
    }
  });

  if (!ticket) throw new Error('Aktarılabilir bilet bulunamadı');
  if (ticket.invitation) throw new Error('Davetiye biletleri devredilemez');

  const toEmail = params.toEmail.trim().toLowerCase();
  if (toEmail === fromUser.email.toLowerCase()) {
    throw new Error('Bileti kendinize devredemezsiniz');
  }

  const pending = await prisma.ticketTransfer.findFirst({
    where: { ticketId: ticket.id, status: 'pending' }
  });
  if (pending) throw new Error('Bu bilet için bekleyen bir devir var');

  const transfer = await prisma.ticketTransfer.create({
    data: {
      ticketId: ticket.id,
      fromUserId: fromUser.id,
      toEmail,
      status: 'pending'
    }
  });

  const acceptUrl = getSiteUrl(`/bilet/devir/${transfer.id}`);

  await queueEmail({
    to: toEmail,
    subject: `Bilet devri: ${ticket.event.title}`,
    template: 'ticket_transfer',
    html: `<p>${fromUser.displayName} size bir bilet devretti: <strong>${ticket.event.title}</strong>.</p><p><a href="${acceptUrl}">Bileti kabul et</a></p>`
  });

  await createNotification({
    userId: fromUser.id,
    title: 'Bilet devri başlatıldı',
    body: `${ticket.event.title} biletiniz ${toEmail} adresine gönderildi.`,
    type: 'ticket_transfer',
    data: { transferId: transfer.id, ticketId: ticket.id }
  });

  return { transferId: transfer.id };
}

export async function acceptTicketTransfer(params: {
  transferId: string;
  firebaseUid: string;
}): Promise<{ ticketId: string }> {
  await ensureDbConnection();

  const toUser = await prisma.user.findFirst({
    where: { firebaseUid: params.firebaseUid, deletedAt: null }
  });
  if (!toUser) throw new Error('Giriş gerekli');

  const transfer = await prisma.ticketTransfer.findFirst({
    where: { id: params.transferId, status: 'pending' },
    include: {
      ticket: {
        include: { event: { select: { title: true } } }
      }
    }
  });

  if (!transfer) throw new Error('Devir bulunamadı veya süresi doldu');
  if (transfer.toEmail && transfer.toEmail.toLowerCase() !== toUser.email.toLowerCase()) {
    throw new Error('Bu devir sizin e-posta adresinize ait değil');
  }

  await prisma.$transaction([
    prisma.purchasedTicket.update({
      where: { id: transfer.ticketId },
      data: {
        userId: toUser.id,
        attendeeName: toUser.displayName,
        attendeeEmail: toUser.email
      }
    }),
    prisma.ticketTransfer.update({
      where: { id: transfer.id },
      data: {
        status: 'completed',
        toUserId: toUser.id,
        completedAt: new Date()
      }
    })
  ]);

  await createNotification({
    userId: toUser.id,
    title: 'Bilet devralındı',
    body: `${transfer.ticket.event.title} biletiniz hesabınıza eklendi.`,
    type: 'ticket_transfer_accepted',
    data: { ticketId: transfer.ticketId }
  });

  return { ticketId: transfer.ticketId };
}

export async function getTransferredTicketsForUser(firebaseUid: string) {
  await ensureDbConnection();
  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true }
  });
  if (!user) return [];

  const transfers = await prisma.ticketTransfer.findMany({
    where: {
      OR: [{ fromUserId: user.id }, { toUserId: user.id }],
      status: { in: ['pending', 'completed'] }
    },
    include: {
      ticket: {
        include: {
          event: { include: { city: true, venue: true } },
          ticketType: true,
          user: { select: { displayName: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return transfers;
}

export async function getInvitationTicketsForUser(firebaseUid: string) {
  await ensureDbConnection();
  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true }
  });
  if (!user) return [];

  return prisma.purchasedTicket.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
      invitation: { isNot: null }
    },
    include: {
      event: { include: { city: true, venue: true } },
      ticketType: true,
      user: { select: { displayName: true } },
      invitation: { select: { status: true, guestName: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}
