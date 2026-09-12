import type { CartLine, CartState } from '@/lib/cart/types';
import {
  CART_COOKIE_NAME,
  CART_EVENT_NAME,
  CART_STORAGE_KEY,
  MAX_CART_LINES,
  MAX_CART_TICKETS
} from '@/lib/cart/types';

export function emptyCart(): CartState {
  return { version: 1, lines: [], updatedAt: new Date().toISOString() };
}

export function cartTicketCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => {
    if (line.seatUnitIds && line.seatUnitIds.length > 0) {
      return sum + line.seatUnitIds.length;
    }
    return sum + line.quantity;
  }, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return Math.round(
    lines.reduce((sum, line) => {
      const qty =
        line.seatUnitIds && line.seatUnitIds.length > 0
          ? line.seatUnitIds.length
          : line.quantity;
      const paidQty = line.isBogo ? Math.ceil(qty / 2) : qty;
      return sum + line.unitPrice * paidQty;
    }, 0) * 100
  ) / 100;
}

function lineIdentity(line: Pick<CartLine, 'eventId' | 'ticketTypeId' | 'seatUnitIds'>): string {
  if (line.seatUnitIds && line.seatUnitIds.length > 0) {
    return `${line.eventId}:${line.ticketTypeId}:seats`;
  }
  return `${line.eventId}:${line.ticketTypeId}`;
}

export function makeCartLineKey(parts: {
  eventId: string;
  ticketTypeId: string;
  seatUnitIds?: string[];
}): string {
  const seats = (parts.seatUnitIds ?? []).map((s) => s.toUpperCase()).sort().join(',');
  return seats
    ? `${parts.eventId}:${parts.ticketTypeId}:${seats}`
    : `${parts.eventId}:${parts.ticketTypeId}`;
}

export function mergeCartLine(lines: CartLine[], incoming: CartLine): CartLine[] {
  const incomingSeats = (incoming.seatUnitIds ?? []).map((s) => s.toUpperCase());
  const hasSeats = incomingSeats.length > 0;

  if (hasSeats) {
    const existingIdx = lines.findIndex(
      (l) =>
        l.eventId === incoming.eventId &&
        l.ticketTypeId === incoming.ticketTypeId &&
        (l.seatUnitIds?.length ?? 0) > 0
    );
    if (existingIdx >= 0) {
      const existing = lines[existingIdx]!;
      const mergedSeats = [
        ...new Set([
          ...(existing.seatUnitIds ?? []).map((s) => s.toUpperCase()),
          ...incomingSeats
        ])
      ];
      if (mergedSeats.length > 10) {
        throw new Error('Aynı etkinlikte en fazla 10 koltuk seçebilirsiniz');
      }
      const next = [...lines];
      next[existingIdx] = {
        ...existing,
        seatUnitIds: mergedSeats,
        quantity: mergedSeats.length,
        unitPrice: incoming.unitPrice,
        ticketTypeName: incoming.ticketTypeName,
        isBogo: incoming.isBogo,
        eventTitle: incoming.eventTitle,
        eventStartAt: incoming.eventStartAt,
        eventCoverImage: incoming.eventCoverImage,
        key: makeCartLineKey({
          eventId: existing.eventId,
          ticketTypeId: existing.ticketTypeId,
          seatUnitIds: mergedSeats
        })
      };
      return next;
    }
    return [
      ...lines,
      {
        ...incoming,
        seatUnitIds: incomingSeats,
        quantity: incomingSeats.length,
        key: makeCartLineKey({
          eventId: incoming.eventId,
          ticketTypeId: incoming.ticketTypeId,
          seatUnitIds: incomingSeats
        })
      }
    ];
  }

  const existingIdx = lines.findIndex(
    (l) =>
      lineIdentity(l) === lineIdentity(incoming) &&
      !(l.seatUnitIds && l.seatUnitIds.length > 0)
  );
  if (existingIdx >= 0) {
    const existing = lines[existingIdx]!;
    const nextQty = Math.min(10, existing.quantity + incoming.quantity);
    const next = [...lines];
    next[existingIdx] = {
      ...existing,
      quantity: nextQty,
      unitPrice: incoming.unitPrice,
      ticketTypeName: incoming.ticketTypeName,
      isBogo: incoming.isBogo,
      eventTitle: incoming.eventTitle,
      eventStartAt: incoming.eventStartAt,
      eventCoverImage: incoming.eventCoverImage
    };
    return next;
  }

  return [
    ...lines,
    {
      ...incoming,
      key: makeCartLineKey({
        eventId: incoming.eventId,
        ticketTypeId: incoming.ticketTypeId
      })
    }
  ];
}

export function assertCartLimits(lines: CartLine[]): void {
  if (lines.length > MAX_CART_LINES) {
    throw new Error(`Sepette en fazla ${MAX_CART_LINES} satır olabilir`);
  }
  if (cartTicketCount(lines) > MAX_CART_TICKETS) {
    throw new Error(`Sepette en fazla ${MAX_CART_TICKETS} bilet olabilir`);
  }
}

export function readCartFromStorage(): CartState {
  if (typeof window === 'undefined') return emptyCart();
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.lines)) {
      return emptyCart();
    }
    return {
      version: 1,
      lines: parsed.lines,
      updatedAt: parsed.updatedAt || new Date().toISOString()
    };
  } catch {
    return emptyCart();
  }
}

export function writeCartToStorage(state: CartState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  const count = cartTicketCount(state.lines);
  document.cookie = `${CART_COOKIE_NAME}=${count}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  window.dispatchEvent(
    new CustomEvent(CART_EVENT_NAME, { detail: { count, lines: state.lines } })
  );
}

export function groupCartLinesByEvent(lines: CartLine[]): Array<{
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  eventStartAt: string;
  eventCoverImage?: string | null;
  lines: CartLine[];
}> {
  const map = new Map<
    string,
    {
      eventId: string;
      eventSlug: string;
      eventTitle: string;
      eventStartAt: string;
      eventCoverImage?: string | null;
      lines: CartLine[];
    }
  >();

  for (const line of lines) {
    const existing = map.get(line.eventId);
    if (existing) {
      existing.lines.push(line);
      continue;
    }
    map.set(line.eventId, {
      eventId: line.eventId,
      eventSlug: line.eventSlug,
      eventTitle: line.eventTitle,
      eventStartAt: line.eventStartAt,
      eventCoverImage: line.eventCoverImage,
      lines: [line]
    });
  }

  return [...map.values()].sort((a, b) =>
    a.eventStartAt.localeCompare(b.eventStartAt)
  );
}

export function formatCartEventDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Istanbul'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
