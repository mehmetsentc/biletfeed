import { randomBytes } from 'crypto';
import { redis } from '@/lib/redis';
import { getSiteUrl } from '@/lib/config/domain';

const REDIS_PREFIX = 'eventjoy:invite:';
const TTL_SECONDS = 60 * 60 * 24 * 365;

const devStore = new Map<string, EventJoyPublicInvitation>();

export interface EventJoyPublicInvitation {
  token: string;
  eventId: string;
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  description: string;
  coverColor: string;
  coverImage?: string;
  hostName: string;
  personalMessage?: string;
  createdAt: string;
}

export interface PublishEventJoyInvitationInput {
  eventId: string;
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  description: string;
  coverColor: string;
  coverImage?: string;
  hostName: string;
  personalMessage?: string;
  existingToken?: string;
}

function redisKey(token: string): string {
  return `${REDIS_PREFIX}${token}`;
}

export function createEventJoyShareToken(): string {
  return randomBytes(16).toString('hex');
}

export function getEventJoyInviteUrl(token: string): string {
  return getSiteUrl(`/eventjoy/i/${token}`);
}

export function getEventJoyPrintUrl(token: string): string {
  return getSiteUrl(`/eventjoy/i/${token}/print`);
}

function parseStored(raw: unknown): EventJoyPublicInvitation | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as EventJoyPublicInvitation;
  if (!data.token || !data.title || !data.date) return null;
  return data;
}

export async function getEventJoyInvitation(
  token: string
): Promise<EventJoyPublicInvitation | null> {
  const sanitized = token.trim();
  if (!sanitized) return null;

  try {
    const stored = await redis.get<EventJoyPublicInvitation>(redisKey(sanitized));
    return parseStored(stored);
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      return devStore.get(sanitized) ?? null;
    }
    return null;
  }
}

export async function publishEventJoyInvitation(
  input: PublishEventJoyInvitationInput
): Promise<EventJoyPublicInvitation> {
  const token = input.existingToken?.trim() || createEventJoyShareToken();
  const invitation: EventJoyPublicInvitation = {
    token,
    eventId: input.eventId,
    title: input.title.trim(),
    type: input.type.trim(),
    date: input.date,
    time: input.time.trim(),
    location: input.location.trim(),
    description: input.description.trim(),
    coverColor: input.coverColor,
    coverImage: input.coverImage,
    hostName: input.hostName.trim() || 'Organizatör',
    personalMessage: input.personalMessage?.trim() || undefined,
    createdAt: new Date().toISOString()
  };

  try {
    await redis.set(redisKey(token), invitation, { ex: TTL_SECONDS });
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      devStore.set(token, invitation);
    } else {
      throw new Error('Davetiye kaydedilemedi');
    }
  }

  return invitation;
}

export function formatEventJoyDateTime(date: string, time: string): {
  dateLabel: string;
  timeLabel: string;
  isoStart: string;
} {
  const isoStart = `${date}T${time || '00:00'}`;
  const parsed = new Date(isoStart);
  const dateLabel = parsed.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeLabel = parsed.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return { dateLabel, timeLabel, isoStart };
}
