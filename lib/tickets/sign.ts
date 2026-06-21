import { createHmac, randomBytes, randomUUID } from 'crypto';

export function generateTicketCode(): string {
  return `BF-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export function generateValidationToken(ticketId: string, eventId: string): string {
  const secret = process.env.TICKET_SECRET_KEY || 'dev-secret-change-in-production';
  return createHmac('sha256', secret).update(`${ticketId}:${eventId}`).digest('hex');
}

export function newTicketId(): string {
  return randomUUID();
}
