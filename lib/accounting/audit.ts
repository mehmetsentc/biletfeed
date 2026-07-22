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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asUuidOrNull(value?: string | null): string | null {
  if (!value) return null;
  return UUID_RE.test(value) ? value : null;
}

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
      actorId: asUuidOrNull(params.actorId),
      actorRole: params.actorRole ?? 'system',
      before: params.before ? (params.before as object) : undefined,
      after: params.after ? (params.after as object) : undefined,
      ipAddress: params.ipAddress ?? null
    }
  });
}
