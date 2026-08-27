import { ensureDbConnection, prisma } from '@/lib/db/prisma';
import { getPaymentProvider } from '@/lib/payments/provider';
import type { PaymentProviderName } from '@/lib/payments/types';

export type RefundMode = 'full' | 'tickets_only' | 'partial';

export type ProcessOrderRefundParams = {
  orderId: string;
  reason?: string;
  /** Kısmi iade — sadece bu biletler; boşsa tümü */
  ticketIds?: string[];
  /** Parasız iptal (stok + bilet); para iadesi yok */
  cancelOnly?: boolean;
  /** Kart iadesi başarısızsa banka talebi oluşturulsun */
  fallbackBankRefund?: boolean;
  bankDetails?: {
    accountHolder: string;
    iban: string;
  };
  actorId?: string | null;
};

export type ProcessOrderRefundResult = {
  ok: boolean;
  message: string;
  mode?: RefundMode;
  providerRefundId?: string;
  bankRefundRequestId?: string;
  needsBankRefund?: boolean;
};

async function restoreTicketStockForTickets(
  ticketTypeIds: string[],
  tx: {
    ticketType: {
      update: (args: {
        where: { id: string };
        data: { sold: { decrement: number } };
      }) => Promise<unknown>;
    };
  } = prisma
): Promise<void> {
  const counts = new Map<string, number>();
  for (const id of ticketTypeIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  for (const [ticketTypeId, n] of counts) {
    await tx.ticketType.update({
      where: { id: ticketTypeId },
      data: { sold: { decrement: n } }
    });
  }
}

/**
 * Tam / kısmi iade veya parasız bilet iptali.
 * PSP (iyzico…) refund → bilet durumu → stok → muhasebe + e-posta.
 */
export async function processOrderRefund(
  params: ProcessOrderRefundParams
): Promise<ProcessOrderRefundResult> {
  await ensureDbConnection();

  const order = await prisma.order.findFirst({
    where: { id: params.orderId, deletedAt: null },
    include: {
      purchasedTickets: {
        where: { deletedAt: null },
        select: {
          id: true,
          status: true,
          ticketTypeId: true,
          seatUnitId: true
        }
      },
      items: true,
      user: { select: { displayName: true } }
    }
  });

  if (!order) throw new Error('Sipariş bulunamadı');
  if (order.status !== 'paid') {
    throw new Error('Yalnızca ödenmiş siparişler iade/iptal edilebilir');
  }

  const selectedIds = params.ticketIds?.filter(Boolean) ?? [];
  const targets =
    selectedIds.length > 0
      ? order.purchasedTickets.filter((t) => selectedIds.includes(t.id))
      : order.purchasedTickets.filter((t) => t.status === 'VALID' || t.status === 'USED');

  if (targets.length === 0) {
    throw new Error('İade edilecek geçerli bilet yok');
  }

  const usedBlocked = targets.some((t) => t.status === 'USED');
  if (usedBlocked && !params.cancelOnly) {
    // USED iadesi admin override ile cancelOnly veya açıkça ticket seçimi gerektirir
    // Politika: USED için para iadesi varsayılan kapalı — cancelOnly veya partial VALID
    const onlyUsed = targets.every((t) => t.status === 'USED');
    if (onlyUsed) {
      throw new Error(
        'Kullanılmış biletler için para iadesi kapalı. Parasız iptal veya admin override kullanın.'
      );
    }
  }

  const refundableTargets = targets.filter((t) => t.status === 'VALID');
  const cancelTargets = params.cancelOnly
    ? targets.filter((t) => t.status === 'VALID' || t.status === 'USED')
    : refundableTargets;

  if (cancelTargets.length === 0) {
    throw new Error('İşlenecek bilet yok');
  }

  const allActive = order.purchasedTickets.filter(
    (t) => t.status === 'VALID' || t.status === 'USED'
  );
  const partial = cancelTargets.length < allActive.length;

  const amountShare =
    order.total <= 0 || allActive.length === 0
      ? 0
      : Math.round((order.total * (cancelTargets.length / allActive.length)) * 100) /
        100;

  const providerName = order.paymentProvider;

  // ── Parasız iptal ────────────────────────────────────────────
  if (params.cancelOnly || amountShare <= 0 || providerName === 'invitation') {
    await prisma.$transaction(async (tx) => {
      await tx.purchasedTicket.updateMany({
        where: { id: { in: cancelTargets.map((t) => t.id) } },
        data: { status: 'CANCELLED', deletedAt: new Date() }
      });
      await restoreTicketStockForTickets(
        cancelTargets.map((t) => t.ticketTypeId),
        tx
      );
      const remaining = await tx.purchasedTicket.count({
        where: {
          orderId: order.id,
          deletedAt: null,
          status: { in: ['VALID', 'USED'] }
        }
      });
      if (remaining === 0) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'cancelled' }
        });
      }
    });
    return {
      ok: true,
      message: `${cancelTargets.length} bilet iptal edildi (para iadesi yok)`,
      mode: 'tickets_only'
    };
  }

  // ── PSP iade ─────────────────────────────────────────────────
  let providerRefundId: string | undefined;
  let needsBankRefund = false;

  if (providerName === 'free' || providerName === 'mock') {
    // local only
  } else {
    const paymentProvider = getPaymentProvider(
      providerName as PaymentProviderName
    );
    if (!paymentProvider.refundPayment) {
      needsBankRefund = true;
    } else if (!order.paymentId) {
      needsBankRefund = true;
    } else {
      const refundResult = await paymentProvider.refundPayment({
        orderId: order.id,
        paymentId: order.paymentId,
        amount: amountShare,
        currency: 'TRY',
        reason: params.reason
      });
      if (!refundResult.ok) {
        if (params.fallbackBankRefund || params.bankDetails) {
          needsBankRefund = true;
        } else {
          return {
            ok: false,
            message: refundResult.error ?? 'Ödeme iadesi başarısız',
            needsBankRefund: true
          };
        }
      } else {
        providerRefundId = refundResult.providerRefundId;
      }
    }
  }

  let bankRefundRequestId: string | undefined;

  if (needsBankRefund) {
    if (!params.bankDetails?.iban || !params.bankDetails.accountHolder) {
      return {
        ok: false,
        message:
          'Kart iadesi yapılamadı. Banka iadesi için IBAN ve hesap sahibi gerekli.',
        needsBankRefund: true
      };
    }
    const bank = await prisma.bankRefundRequest.create({
      data: {
        orderId: order.id,
        amount: amountShare,
        accountHolder: params.bankDetails.accountHolder.trim(),
        iban: params.bankDetails.iban.replace(/\s+/g, '').toUpperCase(),
        reason: params.reason ?? null,
        requestedBy: params.actorId ?? null,
        status: 'pending',
        metadata: { provider: providerName, partial }
      }
    });
    bankRefundRequestId = bank.id;
  }

  await prisma.$transaction(async (tx) => {
    await tx.purchasedTicket.updateMany({
      where: { id: { in: cancelTargets.map((t) => t.id) } },
      data: { status: 'REFUNDED' }
    });

    await restoreTicketStockForTickets(
      cancelTargets.map((t) => t.ticketTypeId),
      tx
    );

    const remaining = await tx.purchasedTicket.count({
      where: {
        orderId: order.id,
        deletedAt: null,
        status: { in: ['VALID', 'USED'] }
      }
    });

    if (remaining === 0) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'refunded' }
      });
      await tx.transaction.updateMany({
        where: { orderId: order.id },
        data: { status: 'refunded' }
      });
    }
  });

  // Tam sipariş iadesinde muhasebe zinciri
  if (!partial) {
    void import('@/lib/accounting/refund')
      .then(({ processOrderRefundAccounting }) =>
        processOrderRefundAccounting(order.id)
      )
      .catch((err) => {
        console.error('[accounting] refund', order.id, err);
      });
  } else {
    // Kısmi: credit note tutarı için metadata ile dene (tam zincir yerine fatura notu)
    void import('@/lib/accounting/invoice')
      .then(async ({ createCreditNoteForRefund }) => {
        await createCreditNoteForRefund(order.id);
      })
      .catch((err) => {
        console.error('[accounting] partial credit note', order.id, err);
      });
  }

  void import('@/lib/email/send-refund-email')
    .then(({ sendRefundNotificationEmail }) =>
      sendRefundNotificationEmail(order.id, params.reason)
    )
    .catch((err) => {
      console.error('[email] refund', order.id, err);
    });

  const parts = [
    `${cancelTargets.length} bilet iade edildi`,
    providerRefundId ? `PSP: ${providerRefundId}` : null,
    bankRefundRequestId ? 'Banka iade talebi oluşturuldu' : null
  ].filter(Boolean);

  return {
    ok: true,
    message: parts.join(' · '),
    mode: partial ? 'partial' : 'full',
    providerRefundId,
    bankRefundRequestId,
    needsBankRefund: Boolean(bankRefundRequestId)
  };
}

/** Geriye uyumluluk — eski requestOrderRefund */
export async function requestOrderRefund(params: {
  orderId: string;
  reason?: string;
}): Promise<{ ok: boolean; message: string }> {
  return processOrderRefund({
    orderId: params.orderId,
    reason: params.reason,
    fallbackBankRefund: false
  });
}
