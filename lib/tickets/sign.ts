import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { getSiteUrl } from '@/lib/config/domain';

export function generateTicketCode(): string {
  return `BF-${randomBytes(4).toString('hex').toUpperCase()}`;
}

function getTicketSecret(): string {
  const secret = process.env.TICKET_SECRET_KEY?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('TICKET_SECRET_KEY yapılandırılmamış');
  }
  return 'dev-secret-change-in-production';
}

export function generateValidationToken(
  ticketId: string,
  eventId: string,
  nonce?: string | null
): string {
  const secret = getTicketSecret();
  const payload = nonce ? `${ticketId}:${eventId}:${nonce}` : `${ticketId}:${eventId}`;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyValidationToken(
  ticketId: string,
  eventId: string,
  token: string,
  nonce?: string | null
): boolean {
  if (!token) return false;
  const expected = generateValidationToken(ticketId, eventId, nonce);
  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(token, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** QR token yenileme — eski QR geçersiz olur */
export function rotateValidationToken(
  ticketId: string,
  eventId: string
): { token: string; nonce: string } {
  const nonce = randomBytes(16).toString('hex');
  return {
    nonce,
    token: generateValidationToken(ticketId, eventId, nonce)
  };
}

export function buildTicketQrPayload(input: {
  ticketId: string;
  ticketCode: string;
  validationToken: string;
}): string {
  // Points to a public page — when scanned on phone it shows a proper ticket/invitation UI.
  // The organizer QR scanner uses parseQrPayload which extracts params from the URL.
  return getSiteUrl(
    `/bilet/${encodeURIComponent(input.ticketCode)}?token=${encodeURIComponent(input.validationToken)}&id=${encodeURIComponent(input.ticketId)}`
  );
}

export function parseQrPayload(raw: string): {
  ticketCode?: string;
  validationToken?: string;
  ticketId?: string;
  inviteToken?: string;
} {
  const trimmed = raw.trim();
  try {
    if (trimmed.startsWith('{')) {
      const json = JSON.parse(trimmed) as Record<string, string>;
      return {
        ticketCode: normalizeTicketCode(json.code || json.ticketCode),
        validationToken: json.token || json.validationToken,
        ticketId: json.id || json.ticketId,
        inviteToken: json.inviteToken
      };
    }
    if (trimmed.startsWith('http') || trimmed.includes('/bilet/') || trimmed.includes('/davetiye/')) {
      const urlStr = trimmed.startsWith('http')
        ? trimmed
        : trimmed.startsWith('/')
          ? `https://biletfeed.com${trimmed}`
          : `https://${trimmed}`;
      const url = new URL(urlStr);
      const pathMatch = url.pathname.match(/\/bilet\/([^/?#]+)/i);
      const pathCode = pathMatch?.[1] ? decodeURIComponent(pathMatch[1]) : undefined;
      const inviteMatch = url.pathname.match(/\/davetiye\/([^/?#]+)/i);
      const inviteToken = inviteMatch?.[1]
        ? decodeURIComponent(inviteMatch[1])
        : undefined;
      return {
        ticketCode: normalizeTicketCode(url.searchParams.get('code') || pathCode || undefined),
        validationToken: url.searchParams.get('token') || undefined,
        ticketId: url.searchParams.get('id') || undefined,
        inviteToken
      };
    }
  } catch {
    /* fall through */
  }
  return {};
}

/** BF-XXXX bilet kodlarını standart forma getirir */
export function normalizeTicketCode(code?: string | null): string | undefined {
  if (!code) return undefined;
  const trimmed = code.trim().replace(/\s+/g, '');
  if (!trimmed) return undefined;
  return trimmed.toUpperCase();
}

/**
 * Manuel kapı girişi — bilet kodu, davetiye token'ı veya kısmi URL.
 * Client ve sunucu aynı mantığı kullanır.
 */
export function resolveManualScanInput(raw: string): {
  ticketCode?: string;
  validationToken?: string;
  ticketId?: string;
  inviteToken?: string;
  qrRaw?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return {};

  if (
    trimmed.startsWith('http') ||
    trimmed.startsWith('{') ||
    trimmed.includes('/bilet/') ||
    trimmed.includes('/davetiye/')
  ) {
    return parseQrPayload(trimmed);
  }

  const upper = trimmed.toUpperCase();
  if (upper.startsWith('BF-') || upper.startsWith('BF')) {
    const normalized = upper.startsWith('BF-') ? upper : `BF-${upper.slice(2)}`;
    return { ticketCode: normalized };
  }

  // Davetiye token (32 hex) — kullanıcılar bazen BF kodu yerine link token'ı yapıştırır
  const hexOnly = trimmed.replace(/[^a-fA-F0-9]/g, '');
  if (hexOnly.length >= 24 && hexOnly.length <= 64 && !upper.startsWith('BF')) {
    return { inviteToken: hexOnly };
  }

  return { ticketCode: upper };
}

export function newTicketId(): string {
  return randomUUID();
}
