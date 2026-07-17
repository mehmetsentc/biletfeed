import { randomInt } from 'crypto';
import type { UserRole } from '@/types';
import { buildSessionCookie, SESSION_EXPIRES_MS } from '@/lib/auth/session';
import { verifySignedSessionToken } from '@/lib/auth/session-crypto';
import { getRedisClient } from '@/lib/redis';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export const SCANNER_GATE_MAX_ACTIVE_CODES = 10;
export const SCANNER_GATE_CODE_TTL_SEC = 72 * 60 * 60;

/** Karışıklığa yol açan karakterler (0/O, 1/I) hariç, paylaşılabilir kısa kod alfabesi */
const GATE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Yeni kapı kodlarının uzunluğu (paylaşılabilir, elle girilebilir) */
export const SCANNER_GATE_SHORT_CODE_LENGTH = 10;

/** Kısa kod eşleşme deseni — 6-12 karakter, DB kodları + eski 8'li id'ler */
const SHORT_CODE_PATTERN = /^[A-Z2-9]{6,12}$/;

// ——— Geriye dönük uyumluluk: eski imzalı token payload'ları ———

type GateCodePayloadV1 = {
  v: 1;
  pin: string;
  organizerId: string;
  uid: string;
  email: string;
  role: UserRole;
  exp: number;
  createdAt: string;
};

type GateCodePayloadV2 = {
  v: 2;
  g: string;
  organizerId: string;
  uid: string;
  email: string;
  role: UserRole;
  exp: number;
  createdAt: string;
};

type GateCodePayloadV3 = {
  v: 3;
  g: string;
  organizerId: string;
  eventId: string;
  uid: string;
  email: string;
  role: UserRole;
  exp: number;
  createdAt: string;
};

type GateCodePayload = GateCodePayloadV1 | GateCodePayloadV2 | GateCodePayloadV3;

/** Farklı kaynaklardan (DB / imzalı token / redis) çözümlenmiş ortak kapı bilgisi */
type ResolvedGate = {
  uid: string;
  email: string;
  role: UserRole;
  organizerId: string;
  eventId?: string;
  exp: number;
};

const VALID_ROLES = new Set<UserRole>([
  'ROLE_SUPER_ADMIN',
  'ROLE_ADMIN',
  'ROLE_ORGANIZER',
  'ROLE_USER'
]);

function isValidRole(role: unknown): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.has(role as UserRole);
}

function isPayloadExpired(exp: unknown): boolean {
  return typeof exp !== 'number' || Date.now() >= exp;
}

function generateShortCode(length = SCANNER_GATE_SHORT_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += GATE_CODE_ALPHABET[randomInt(GATE_CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizeScannerGateInput(input: string): string {
  const trimmed = input.trim();
  const gateParam = trimmed.match(/[?&]gate=([^&#]+)/i)?.[1];
  if (gateParam) {
    return decodeURIComponent(gateParam).trim().replace(/\s+/g, '');
  }
  return trimmed.replace(/\s+/g, '');
}

export function isSixDigitGateInput(input: string): boolean {
  return /^\d{6}$/.test(normalizeScannerGateInput(input));
}

export function isShortGateIdInput(input: string): boolean {
  return SHORT_CODE_PATTERN.test(normalizeScannerGateInput(input).toUpperCase());
}

// ——— Kapı kodu oluşturma / listeleme / temizleme (DB birincil kaynak) ———

export async function createScannerGateCode(params: {
  organizerId: string;
  eventId: string;
  uid: string;
  email: string;
  role: UserRole;
}): Promise<{ pin: string; redeemCode: string; expiresAt: Date; eventId: string }> {
  await ensureDbConnection();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SCANNER_GATE_CODE_TTL_SEC * 1000);

  // Süresi dolmuş kodları temizle
  await prisma.scannerGateCode.deleteMany({
    where: { organizerId: params.organizerId, expiresAt: { lt: now } }
  });

  const active = await prisma.scannerGateCode.count({
    where: { organizerId: params.organizerId, expiresAt: { gte: now } }
  });
  if (active >= SCANNER_GATE_MAX_ACTIVE_CODES) {
    throw new Error(
      `En fazla ${SCANNER_GATE_MAX_ACTIVE_CODES} aktif kapı kodu olabilir. Eski kodları temizleyin.`
    );
  }

  let code = generateShortCode();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const exists = await prisma.scannerGateCode.findUnique({
      where: { code },
      select: { id: true }
    });
    if (!exists) break;
    code = generateShortCode();
    if (attempt === 5) {
      throw new Error('Kapı kodu oluşturulamadı. Tekrar deneyin.');
    }
  }

  await prisma.scannerGateCode.create({
    data: {
      code,
      organizerId: params.organizerId,
      eventId: params.eventId,
      uid: params.uid,
      email: params.email,
      role: params.role,
      expiresAt
    }
  });

  return { pin: code, redeemCode: code, expiresAt, eventId: params.eventId };
}

export async function listScannerGateCodes(organizerId: string): Promise<
  Array<{
    pin: string;
    redeemCode?: string;
    expiresAt: Date;
    createdAt: string;
    eventId?: string;
  }>
> {
  await ensureDbConnection();
  const rows = await prisma.scannerGateCode.findMany({
    where: { organizerId, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: 'desc' }
  });

  return rows.map((row) => ({
    pin: row.code,
    redeemCode: row.code,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt,
    eventId: row.eventId
  }));
}

export async function pruneStaleScannerGateCodes(
  organizerId: string
): Promise<{ removed: number; remaining: number }> {
  await ensureDbConnection();
  const now = new Date();
  const before = await prisma.scannerGateCode.count({ where: { organizerId } });
  await prisma.scannerGateCode.deleteMany({
    where: { organizerId, expiresAt: { lt: now } }
  });
  const remaining = await prisma.scannerGateCode.count({ where: { organizerId } });
  return { removed: before - remaining, remaining };
}

// ——— Kod çözümleme (giriş) ———

async function resolveDbGateCode(code: string): Promise<ResolvedGate | null> {
  const normalized = code.trim().toUpperCase();
  if (!SHORT_CODE_PATTERN.test(normalized)) return null;

  await ensureDbConnection();
  const row = await prisma.scannerGateCode.findUnique({
    where: { code: normalized }
  });
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await prisma.scannerGateCode
      .delete({ where: { id: row.id } })
      .catch(() => undefined);
    return null;
  }
  if (!isValidRole(row.role)) return null;

  return {
    uid: row.uid,
    email: row.email,
    role: row.role,
    organizerId: row.organizerId,
    eventId: row.eventId,
    exp: row.expiresAt.getTime()
  };
}

function payloadToResolved(payload: GateCodePayload): ResolvedGate {
  return {
    uid: payload.uid,
    email: payload.email,
    role: payload.role,
    organizerId: payload.organizerId,
    eventId: payload.v === 3 ? payload.eventId : undefined,
    exp: payload.exp
  };
}

function normalizeGatePayload(parsed: Record<string, unknown>): GateCodePayload | null {
  if (parsed.v === 3) {
    const gateId = parsed.g;
    const eventId = parsed.eventId;
    if (typeof gateId !== 'string' || !SHORT_CODE_PATTERN.test(gateId.toUpperCase())) {
      return null;
    }
    if (typeof eventId !== 'string' || !eventId.trim()) return null;
    if (!parsed.organizerId || !parsed.uid || !parsed.email || !isValidRole(parsed.role)) {
      return null;
    }
    if (isPayloadExpired(parsed.exp)) return null;
    return parsed as unknown as GateCodePayloadV3;
  }

  if (parsed.v === 2) {
    const gateId = parsed.g;
    if (typeof gateId !== 'string' || !SHORT_CODE_PATTERN.test(gateId.toUpperCase())) {
      return null;
    }
    if (!parsed.organizerId || !parsed.uid || !parsed.email || !isValidRole(parsed.role)) {
      return null;
    }
    if (isPayloadExpired(parsed.exp)) return null;
    return parsed as unknown as GateCodePayloadV2;
  }

  if (parsed.v === 1) {
    const pin = parsed.pin;
    if (typeof pin !== 'string' || !/^\d{6}$/.test(pin)) return null;
    if (!parsed.organizerId || !parsed.uid || !parsed.email || !isValidRole(parsed.role)) {
      return null;
    }
    if (isPayloadExpired(parsed.exp)) return null;
    return parsed as unknown as GateCodePayloadV1;
  }

  return null;
}

/** Eski dağıtılmış uzun linkler için imzalı token çözümleme (geriye dönük) */
function parseSignedRedeemCode(input: string): GateCodePayload | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^([A-Z2-9]{6,12}|\d{6})\.(.+)$/i);
  if (!match) return null;

  const [, gateId, token] = match;
  const parsed = verifySignedSessionToken(token);
  if (!parsed) return null;

  const payload = normalizeGatePayload(parsed);
  if (!payload) return null;

  const expectedId = payload.v === 1 ? payload.pin : payload.g;
  if (expectedId.toUpperCase() !== gateId.toUpperCase()) return null;

  return payload;
}

/** Eski Redis/bellek tabanlı kapı kaydı (geriye dönük) */
async function readLegacyRedisGate(codeOrPin: string): Promise<GateCodePayload | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  const raw = await redis.get<string>(`bf:scanner-gate:code:${codeOrPin}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeGatePayload(parsed);
  } catch {
    return null;
  }
}

export async function redeemScannerGateCode(input: string): Promise<{
  sessionCookie: string;
  email: string;
  organizerId: string;
  eventId?: string;
  expiresAt: number;
} | null> {
  const normalized = normalizeScannerGateInput(input);

  let resolved = await resolveDbGateCode(normalized);

  if (!resolved) {
    const signed = parseSignedRedeemCode(normalized);
    if (signed) resolved = payloadToResolved(signed);
  }

  if (!resolved) {
    const upper = normalized.toUpperCase();
    const legacy =
      (await readLegacyRedisGate(upper)) ??
      (await readLegacyRedisGate(normalized.replace(/\D/g, '').slice(0, 6)));
    if (legacy) resolved = payloadToResolved(legacy);
  }

  if (!resolved) return null;

  const sessionCookie = buildSessionCookie(
    resolved.uid,
    resolved.email,
    resolved.role,
    SESSION_EXPIRES_MS
  );

  return {
    sessionCookie,
    email: resolved.email,
    organizerId: resolved.organizerId,
    eventId: resolved.eventId,
    expiresAt: resolved.exp
  };
}
