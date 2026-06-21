import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { getSiteUrl } from '@/lib/config/domain';

export function generateTicketCode(): string {
  return `BF-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export function generateValidationToken(ticketId: string, eventId: string): string {
  const secret = process.env.TICKET_SECRET_KEY || 'dev-secret-change-in-production';
  return createHmac('sha256', secret).update(`${ticketId}:${eventId}`).digest('hex');
}

export function verifyValidationToken(
  ticketId: string,
  eventId: string,
  token: string
): boolean {
  if (!token) return false;
  const expected = generateValidationToken(ticketId, eventId);
  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(token, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function buildTicketQrPayload(input: {
  ticketId: string;
  ticketCode: string;
  validationToken: string;
}): string {
  return getSiteUrl(
    `/api/tickets/validate?code=${encodeURIComponent(input.ticketCode)}&token=${encodeURIComponent(input.validationToken)}&id=${encodeURIComponent(input.ticketId)}`
  );
}

export function parseQrPayload(raw: string): {
  ticketCode?: string;
  validationToken?: string;
  ticketId?: string;
} {
  const trimmed = raw.trim();
  try {
    if (trimmed.startsWith('{')) {
      const json = JSON.parse(trimmed) as Record<string, string>;
      return {
        ticketCode: json.code || json.ticketCode,
        validationToken: json.token || json.validationToken,
        ticketId: json.id || json.ticketId
      };
    }
    if (trimmed.startsWith('http')) {
      const url = new URL(trimmed);
      return {
        ticketCode: url.searchParams.get('code') || undefined,
        validationToken: url.searchParams.get('token') || undefined,
        ticketId: url.searchParams.get('id') || undefined
      };
    }
  } catch {
    /* fall through */
  }
  return {};
}

export function newTicketId(): string {
  return randomUUID();
}
