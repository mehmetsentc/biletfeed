import { ensureDbConnection, prisma } from '@/lib/db/prisma';
import type { BankRefundStatus } from '@prisma/client';

export async function listBankRefundRequests(status?: BankRefundStatus) {
  await ensureDbConnection();
  return prisma.bankRefundRequest.findMany({
    where: status ? { status } : undefined,
    include: {
      order: {
        select: {
          id: true,
          total: true,
          paymentProvider: true,
          user: { select: { displayName: true, email: true } },
          event: { select: { title: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

export async function createBankRefundRequest(params: {
  orderId: string;
  amount: number;
  accountHolder: string;
  iban: string;
  reason?: string;
  requestedBy?: string | null;
}): Promise<string> {
  await ensureDbConnection();
  const row = await prisma.bankRefundRequest.create({
    data: {
      orderId: params.orderId,
      amount: params.amount,
      accountHolder: params.accountHolder.trim(),
      iban: params.iban.replace(/\s+/g, '').toUpperCase(),
      reason: params.reason ?? null,
      requestedBy: params.requestedBy ?? null,
      status: 'pending'
    }
  });
  return row.id;
}

export async function updateBankRefundRequestStatus(params: {
  id: string;
  status: BankRefundStatus;
  paymentRef?: string;
  processedBy?: string | null;
}): Promise<void> {
  await ensureDbConnection();
  await prisma.bankRefundRequest.update({
    where: { id: params.id },
    data: {
      status: params.status,
      paymentRef: params.paymentRef ?? undefined,
      processedBy: params.processedBy ?? undefined,
      sentAt: params.status === 'sent' ? new Date() : undefined,
      completedAt: params.status === 'completed' ? new Date() : undefined
    }
  });
}

export async function createOrganizerRefundRequest(params: {
  orderId: string;
  organizerId: string;
  reason?: string;
  ticketIds?: string[];
  requestedBy?: string | null;
}): Promise<string> {
  await ensureDbConnection();

  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      organizerId: params.organizerId,
      deletedAt: null,
      status: 'paid'
    }
  });
  if (!order) throw new Error('Sipariş bulunamadı veya iade edilemez');

  const existing = await prisma.orderRefundRequest.findFirst({
    where: { orderId: params.orderId, status: 'pending' }
  });
  if (existing) throw new Error('Bu sipariş için bekleyen iade talebi var');

  const row = await prisma.orderRefundRequest.create({
    data: {
      orderId: params.orderId,
      organizerId: params.organizerId,
      reason: params.reason ?? null,
      ticketIds: params.ticketIds ?? [],
      requestedBy: params.requestedBy ?? null,
      status: 'pending'
    }
  });
  return row.id;
}

export async function listOrganizerRefundRequests(opts?: {
  status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  organizerId?: string;
}) {
  await ensureDbConnection();
  return prisma.orderRefundRequest.findMany({
    where: {
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.organizerId ? { organizerId: opts.organizerId } : {})
    },
    include: {
      order: {
        select: {
          id: true,
          total: true,
          paymentProvider: true,
          status: true,
          user: { select: { displayName: true, email: true } },
          event: { select: { title: true } }
        }
      },
      organizer: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

export async function reviewOrganizerRefundRequest(params: {
  id: string;
  approve: boolean;
  reviewNote?: string;
  reviewedBy?: string | null;
  bankDetails?: { accountHolder: string; iban: string };
}): Promise<{ ok: boolean; message: string }> {
  await ensureDbConnection();
  const req = await prisma.orderRefundRequest.findUnique({
    where: { id: params.id }
  });
  if (!req || req.status !== 'pending') {
    throw new Error('Talep bulunamadı veya işlenemez');
  }

  if (!params.approve) {
    await prisma.orderRefundRequest.update({
      where: { id: req.id },
      data: {
        status: 'rejected',
        reviewNote: params.reviewNote ?? null,
        reviewedBy: params.reviewedBy ?? null,
        reviewedAt: new Date()
      }
    });
    return { ok: true, message: 'İade talebi reddedildi' };
  }

  const { processOrderRefund } = await import('@/lib/services/order-refund');
  const result = await processOrderRefund({
    orderId: req.orderId,
    reason: req.reason ?? params.reviewNote ?? 'Organizatör iade talebi',
    ticketIds: req.ticketIds.length > 0 ? req.ticketIds : undefined,
    fallbackBankRefund: true,
    bankDetails: params.bankDetails,
    actorId: params.reviewedBy
  });

  await prisma.orderRefundRequest.update({
    where: { id: req.id },
    data: {
      status: result.ok ? 'completed' : 'approved',
      reviewNote: params.reviewNote ?? result.message,
      reviewedBy: params.reviewedBy ?? null,
      reviewedAt: new Date()
    }
  });

  return result;
}
