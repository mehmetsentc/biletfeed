import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import type {
  EventAnnouncementInput,
  EventRuleSetData,
  SelectedRuleEntry
} from '@/lib/event-rules/types';

function parseSelectedRules(value: unknown): SelectedRuleEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is { ruleId: string; parameterValue?: string } =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { ruleId?: unknown }).ruleId === 'string'
    )
    .map((item) => ({
      ruleId: item.ruleId,
      ...(item.parameterValue ? { parameterValue: String(item.parameterValue) } : {})
    }));
}

export function isMissingRulesTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = 'code' in err ? String((err as { code?: unknown }).code) : '';
  if (code === 'P2021') return true;
  const message = 'message' in err ? String((err as { message?: unknown }).message) : '';
  return (
    message.includes('event_rule_sets') ||
    message.includes('event_announcements') ||
    message.includes('event_rule_categories') ||
    message.includes('event_rules') ||
    message.includes('does not exist')
  );
}

/** Kurallar modülünden bağımsız — düzenleme sayfası için hafif okuma */
export async function getEventRuleSet(eventId: string): Promise<{
  ruleSet: EventRuleSetData | null;
  announcements: EventAnnouncementInput[];
}> {
  await ensureDbConnection();

  try {
    const [ruleSet, announcements] = await Promise.all([
      prisma.eventRuleSet.findUnique({ where: { eventId } }),
      prisma.eventAnnouncement.findMany({
        where: { eventId },
        orderBy: { sortOrder: 'asc' }
      })
    ]);

    return {
      ruleSet: ruleSet
        ? {
            selectedRules: parseSelectedRules(ruleSet.selectedRules),
            customRules: ruleSet.customRules ?? [],
            appliedTemplateId: ruleSet.appliedTemplateId
          }
        : null,
      announcements: announcements.map((a) => ({
        id: a.id,
        titleTr: a.titleTr,
        titleEn: a.titleEn ?? undefined,
        contentTr: a.contentTr,
        contentEn: a.contentEn ?? undefined,
        sortOrder: a.sortOrder
      }))
    };
  } catch (err) {
    if (isMissingRulesTableError(err)) {
      return { ruleSet: null, announcements: [] };
    }
    throw err;
  }
}
