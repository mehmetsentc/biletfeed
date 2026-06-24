import { prisma } from '@/lib/db/prisma';

export type AuditAction =
  | 'invoice.issued'
  | 'invoice.cancelled'
  | 'reconciliation.created'
  | 'payout.scheduled'
  | 'payout.paid'
  | 'revenue.deferred'
  | 'revenue.recognized'
  | 'refund.processed'
  | 'email.sent'
  | 'email.failed';

export async function logAccountingAudit(params: {
  action: AuditAction | string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  actorRole?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
}): Promise<void> {
  await prisma.accountingAuditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      actorId: params.actorId ?? null,
      actorRole: params.actorRole ?? 'system',
      before: params.before ? (params.before as object) : undefined,
      after: params.after ? (params.after as object) : undefined,
      ipAddress: params.ipAddress ?? null
    }
  });
}
