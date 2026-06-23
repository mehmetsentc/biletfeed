type PaymentAuditEvent =
  | 'callback_received'
  | 'callback_verified'
  | 'callback_amount_mismatch'
  | 'callback_fulfilled'
  | 'callback_failed';

export function logPaymentAudit(
  event: PaymentAuditEvent,
  data: Record<string, unknown>
): void {
  console.info(
    JSON.stringify({
      type: 'payment_audit',
      event,
      at: new Date().toISOString(),
      ...data
    })
  );
}
