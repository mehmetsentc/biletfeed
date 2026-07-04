import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { slugify } from '@/lib/utils/slug';

export type OrganizerTicketFilterOption = {
  key: string;
  label: string;
  kind: 'all' | 'invitation' | 'ticketTypes';
  ticketTypeIds: string[];
  count: number;
};

export type OrganizerTicketsFilter =
  | { kind: 'all' }
  | { kind: 'invitation' }
  | { kind: 'ticketTypes'; ticketTypeIds: string[] };

function ticketTypeDisplayLabel(name: string): string {
  const sep = ' — ';
  const idx = name.indexOf(sep);
  return idx >= 0 ? name.slice(0, idx).trim() : name.trim();
}

function normalizeTicketTypeKey(name: string): string {
  return slugify(ticketTypeDisplayLabel(name)) || 'diger';
}

export async function getOrganizerTicketTypeFilters(
  organizerId: string
): Promise<OrganizerTicketFilterOption[]> {
  await ensureDbConnection();

  const [ticketTypes, invitationCount, totalCount] = await Promise.all([
    prisma.ticketType.findMany({
      where: {
        deletedAt: null,
        event: { organizerId, deletedAt: null }
      },
      select: {
        id: true,
        name: true,
        sold: true,
        event: { select: { startDate: true } }
      },
      orderBy: [{ event: { startDate: 'desc' } }, { name: 'asc' }]
    }),
    prisma.purchasedTicket.count({
      where: {
        deletedAt: null,
        event: { organizerId },
        order: { paymentProvider: 'invitation' }
      }
    }),
    prisma.purchasedTicket.count({
      where: {
        deletedAt: null,
        event: { organizerId }
      }
    })
  ]);

  const grouped = new Map<
    string,
    { label: string; ticketTypeIds: string[]; count: number }
  >();

  for (const ticketType of ticketTypes) {
    const label = ticketTypeDisplayLabel(ticketType.name);
    const key = normalizeTicketTypeKey(ticketType.name);
    const existing = grouped.get(key);
    const sold = ticketType.sold;

    if (existing) {
      existing.ticketTypeIds.push(ticketType.id);
      existing.count += sold;
    } else {
      grouped.set(key, {
        label,
        ticketTypeIds: [ticketType.id],
        count: sold
      });
    }
  }

  const typeFilters: OrganizerTicketFilterOption[] = [...grouped.entries()]
    .map(([key, value]) => ({
      key: `type:${key}`,
      label: value.label,
      kind: 'ticketTypes' as const,
      ticketTypeIds: value.ticketTypeIds,
      count: value.count
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'tr'));

  const filters: OrganizerTicketFilterOption[] = [
    {
      key: 'all',
      label: 'Tümü',
      kind: 'all',
      ticketTypeIds: [],
      count: totalCount
    }
  ];

  filters.push(...typeFilters);

  if (invitationCount > 0) {
    filters.push({
      key: 'invitation',
      label: 'Davetiye',
      kind: 'invitation',
      ticketTypeIds: [],
      count: invitationCount
    });
  }

  return filters;
}

export function resolveOrganizerTicketsFilter(
  rawKey: string | undefined,
  options: OrganizerTicketFilterOption[]
): { filter: OrganizerTicketsFilter; active: OrganizerTicketFilterOption } {
  const fallback = options[0] ?? {
    key: 'all',
    label: 'Tümü',
    kind: 'all' as const,
    ticketTypeIds: [],
    count: 0
  };

  const active = options.find((o) => o.key === rawKey) ?? fallback;

  if (active.kind === 'invitation') {
    return { filter: { kind: 'invitation' }, active };
  }
  if (active.kind === 'ticketTypes' && active.ticketTypeIds.length > 0) {
    return {
      filter: { kind: 'ticketTypes', ticketTypeIds: active.ticketTypeIds },
      active
    };
  }
  return { filter: { kind: 'all' }, active: fallback };
}
