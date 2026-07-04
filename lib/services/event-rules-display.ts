import { buildRulesByIdMap } from '@/lib/event-rules/cache';
import { buildEventRulesDisplay } from '@/lib/event-rules/resolve-rules';
import type {
  EventRulesDisplayData,
  EventRulesLocale
} from '@/lib/event-rules/types';
import { ensureDbConnection } from '@/lib/db/prisma';
import { loadEventRulesCatalog } from '@/lib/services/event-rules-catalog';
import {
  getEventRuleSet,
  isMissingRulesTableError
} from '@/lib/services/event-rules-query';

/** Public etkinlik sayfaları — ağır event-rules.ts (DOMPurify/AI) import etmez */
export async function getEventRulesDisplay(
  eventId: string,
  locale: EventRulesLocale = 'tr'
): Promise<EventRulesDisplayData | null> {
  try {
    await ensureDbConnection();

    const { ruleSet, announcements } = await getEventRuleSet(eventId);
    if (!ruleSet && announcements.length === 0) return null;

    const { categories, rules } = await loadEventRulesCatalog();
    const rulesById = buildRulesByIdMap(rules);
    const categoriesById = new Map(
      categories.map((c) => [
        c.id,
        { slug: c.slug, icon: c.icon, titleTr: c.titleTr, titleEn: c.titleEn }
      ])
    );

    return buildEventRulesDisplay(
      ruleSet?.selectedRules ?? [],
      ruleSet?.customRules ?? [],
      announcements,
      rulesById,
      categoriesById,
      locale
    );
  } catch (err) {
    if (isMissingRulesTableError(err)) return null;
    if (process.env.NODE_ENV !== 'production') {
      console.error('[getEventRulesDisplay]', eventId, err);
    }
    return null;
  }
}
