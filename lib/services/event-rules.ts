import type { Prisma } from '@prisma/client';
import {
  getProviderConfig,
  isAnyAiProviderReady,
  resolvePrimaryProvider
} from '@/lib/ai/config';
import { openAiCompatibleChat } from '@/lib/ai/providers/openai-compatible';
import {
  buildRulesByIdMap,
  buildRulesBySlugMap,
  getCachedCatalog,
  invalidateCatalogCache,
  setCachedCatalog
} from '@/lib/event-rules/cache';
import {
  autoIncludeEtiquetteAndTips,
  buildEventRulesDisplay,
  flattenRulesToText,
  resolveSelectedRules
} from '@/lib/event-rules/resolve-rules';
import {
  slugsToRuleIds,
  suggestRuleSlugsHeuristic
} from '@/lib/event-rules/suggestions';
import type {
  EventAnnouncementInput,
  EventRuleSetData,
  EventRulesDisplayData,
  EventRulesLocale,
  OrganizerRuleTemplateData,
  RuleCatalogCategory,
  RuleCatalogRule,
  RuleSuggestionContext,
  RuleSuggestionResult,
  SelectedRuleEntry
} from '@/lib/event-rules/types';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import {
  sanitizeOrganizerHtml,
  sanitizePlainText
} from '@/lib/security/sanitize-html';

import {
  getEventRuleSet,
  isMissingRulesTableError
} from '@/lib/services/event-rules-query';
import { loadEventRulesCatalog } from '@/lib/services/event-rules-catalog';

export { getEventRuleSet } from '@/lib/services/event-rules-query';
export { getEventRulesDisplay } from '@/lib/services/event-rules-display';

function normalizeAnnouncementInput(
  announcement: EventAnnouncementInput,
  sortOrder: number
): EventAnnouncementInput {
  return {
    ...announcement,
    titleTr: sanitizePlainText(announcement.titleTr, 200),
    titleEn: announcement.titleEn
      ? sanitizePlainText(announcement.titleEn, 200)
      : undefined,
    contentTr: sanitizeOrganizerHtml(announcement.contentTr),
    contentEn: announcement.contentEn
      ? sanitizeOrganizerHtml(announcement.contentEn)
      : undefined,
    sortOrder: announcement.sortOrder ?? sortOrder
  };
}

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

async function loadFullCatalog() {
  return loadEventRulesCatalog();
}

export async function listRuleCategoriesWithCounts(
  _locale: EventRulesLocale = 'tr'
): Promise<RuleCatalogCategory[]> {
  const { categories } = await loadFullCatalog();
  return categories;
}

export async function listRulesByCategory(
  categoryId: string,
  filters?: { eventType?: string; search?: string }
): Promise<RuleCatalogRule[]> {
  const { rules } = await loadFullCatalog();
  let filtered = rules.filter((r) => r.categoryId === categoryId);

  if (filters?.eventType) {
    filtered = filtered.filter(
      (r) =>
        r.eventTypes.length === 0 || r.eventTypes.includes(filters.eventType!)
    );
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.titleTr.toLowerCase().includes(q) ||
        r.titleEn.toLowerCase().includes(q) ||
        r.descriptionTr.toLowerCase().includes(q) ||
        r.descriptionEn.toLowerCase().includes(q)
    );
  }

  return filtered;
}

export async function searchRules(
  query: string,
  _locale: EventRulesLocale = 'tr'
): Promise<RuleCatalogRule[]> {
  const { rules } = await loadFullCatalog();
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return rules.filter(
    (r) =>
      r.titleTr.toLowerCase().includes(q) ||
      r.titleEn.toLowerCase().includes(q) ||
      r.descriptionTr.toLowerCase().includes(q) ||
      r.descriptionEn.toLowerCase().includes(q) ||
      r.slug.includes(q)
  );
}

async function verifyEventOwnership(
  eventId: string,
  organizerId: string
): Promise<void> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    select: { id: true, eventType: true }
  });
  if (!event) throw new Error('Etkinlik bulunamadı');
}

export async function saveEventRuleSet(
  eventId: string,
  organizerId: string,
  data: EventRuleSetData & { announcements?: EventAnnouncementInput[] }
): Promise<{ flatRulesText: string }> {
  await ensureDbConnection();
  await verifyEventOwnership(eventId, organizerId);

  const { categories, rules } = await loadFullCatalog();
  const rulesById = buildRulesByIdMap(rules);
  const categoriesById = new Map(
    categories.map((c) => [
      c.id,
      { slug: c.slug, icon: c.icon, titleTr: c.titleTr, titleEn: c.titleEn }
    ])
  );

  const resolved = resolveSelectedRules(
    data.selectedRules,
    rulesById,
    categoriesById
  );
  const flatRulesText = flattenRulesToText(resolved, data.customRules);

  await prisma.$transaction(async (tx) => {
    await tx.eventRuleSet.upsert({
      where: { eventId },
      create: {
        eventId,
        selectedRules: data.selectedRules as unknown as Prisma.InputJsonValue,
        customRules: data.customRules,
        appliedTemplateId: data.appliedTemplateId ?? null
      },
      update: {
        selectedRules: data.selectedRules as unknown as Prisma.InputJsonValue,
        customRules: data.customRules,
        appliedTemplateId: data.appliedTemplateId ?? null
      }
    });

    await tx.event.update({
      where: { id: eventId },
      data: { rules: flatRulesText }
    });

    if (data.announcements) {
      await tx.eventAnnouncement.deleteMany({ where: { eventId } });
      if (data.announcements.length > 0) {
        await tx.eventAnnouncement.createMany({
          data: data.announcements.map((a, idx) => {
            const normalized = normalizeAnnouncementInput(a, idx);
            return {
              eventId,
              titleTr: normalized.titleTr,
              titleEn: normalized.titleEn ?? null,
              contentTr: normalized.contentTr,
              contentEn: normalized.contentEn ?? null,
              sortOrder: normalized.sortOrder ?? idx
            };
          })
        });
      }
    }
  });

  return { flatRulesText };
}

export async function listOrganizerTemplates(
  organizerId: string
): Promise<OrganizerRuleTemplateData[]> {
  await ensureDbConnection();

  const rows = await prisma.organizerRuleTemplate.findMany({
    where: { organizerId },
    orderBy: { sortOrder: 'asc' }
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    selectedRules: parseSelectedRules(row.selectedRuleIds),
    customRules: row.customRules,
    sortOrder: row.sortOrder
  }));
}

export async function saveOrganizerTemplate(
  organizerId: string,
  data: {
    id?: string;
    name: string;
    description?: string;
    selectedRules: SelectedRuleEntry[];
    customRules: string[];
  }
): Promise<OrganizerRuleTemplateData> {
  await ensureDbConnection();

  if (data.id) {
    const existing = await prisma.organizerRuleTemplate.findFirst({
      where: { id: data.id, organizerId }
    });
    if (!existing) throw new Error('Şablon bulunamadı');

    const updated = await prisma.organizerRuleTemplate.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description ?? null,
        selectedRuleIds: data.selectedRules as unknown as Prisma.InputJsonValue,
        customRules: data.customRules
      }
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      selectedRules: parseSelectedRules(updated.selectedRuleIds),
      customRules: updated.customRules,
      sortOrder: updated.sortOrder
    };
  }

  const count = await prisma.organizerRuleTemplate.count({
    where: { organizerId }
  });

  const created = await prisma.organizerRuleTemplate.create({
    data: {
      organizerId,
      name: data.name,
      description: data.description ?? null,
      selectedRuleIds: data.selectedRules as unknown as Prisma.InputJsonValue,
      customRules: data.customRules,
      sortOrder: count
    }
  });

  return {
    id: created.id,
    name: created.name,
    description: created.description,
    selectedRules: parseSelectedRules(created.selectedRuleIds),
    customRules: created.customRules,
    sortOrder: created.sortOrder
  };
}

export async function deleteOrganizerTemplate(
  organizerId: string,
  templateId: string
): Promise<void> {
  await ensureDbConnection();

  const existing = await prisma.organizerRuleTemplate.findFirst({
    where: { id: templateId, organizerId }
  });
  if (!existing) throw new Error('Şablon bulunamadı');

  await prisma.organizerRuleTemplate.delete({ where: { id: templateId } });
}

export async function listEventAnnouncements(
  eventId: string
): Promise<EventAnnouncementInput[]> {
  await ensureDbConnection();

  const rows = await prisma.eventAnnouncement.findMany({
    where: { eventId },
    orderBy: { sortOrder: 'asc' }
  });

  return rows.map((a) => ({
    id: a.id,
    titleTr: a.titleTr,
    titleEn: a.titleEn ?? undefined,
    contentTr: a.contentTr,
    contentEn: a.contentEn ?? undefined,
    sortOrder: a.sortOrder
  }));
}

export async function saveEventAnnouncements(
  eventId: string,
  organizerId: string,
  announcements: EventAnnouncementInput[]
): Promise<void> {
  const existing = await getEventRuleSet(eventId);
  await saveEventRuleSet(eventId, organizerId, {
    selectedRules: existing.ruleSet?.selectedRules ?? [],
    customRules: existing.ruleSet?.customRules ?? [],
    appliedTemplateId: existing.ruleSet?.appliedTemplateId,
    announcements
  });
}

export async function getDefaultRulesForEvent(context: {
  categorySlug?: string;
  eventType?: string;
}): Promise<SelectedRuleEntry[]> {
  const { rules } = await loadFullCatalog();
  const rulesBySlug = buildRulesBySlugMap(rules);

  const slugs = suggestRuleSlugsHeuristic(context, rulesBySlug);
  const ruleIds = slugsToRuleIds(slugs, rulesBySlug);

  const selected: SelectedRuleEntry[] = ruleIds.map((ruleId) => ({ ruleId }));

  const eventType = context.eventType ?? 'other';
  return autoIncludeEtiquetteAndTips(selected, rulesBySlug, eventType);
}

async function suggestRulesWithAi(
  context: RuleSuggestionContext,
  catalogRules: RuleCatalogRule[]
): Promise<string[]> {
  const providerId = resolvePrimaryProvider();
  const provider = getProviderConfig(providerId);

  const ruleList = catalogRules
    .filter((r) => r.categorySlug !== 'biletfeed-tavsiyeleri')
    .slice(0, 200)
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.titleTr,
      eventTypes: r.eventTypes
    }));

  const prompt = `You are an event rules assistant for a Turkish ticketing platform.
Given the event context, select the most relevant rule IDs from the catalog.
Return JSON: { "ruleIds": ["uuid", ...] } with 15-25 rule IDs max.

Event context:
${JSON.stringify(context, null, 2)}

Available rules:
${JSON.stringify(ruleList, null, 2)}`;

  const content = await openAiCompatibleChat(
    provider,
    [
      { role: 'system', content: 'Respond only with valid JSON.' },
      { role: 'user', content: prompt }
    ],
    { jsonMode: true, temperature: 0.2, maxTokens: 2000 }
  );

  const parsed = JSON.parse(content) as { ruleIds?: string[] };
  if (!Array.isArray(parsed.ruleIds)) return [];
  const validIds = new Set(catalogRules.map((r) => r.id));
  return parsed.ruleIds.filter((id) => validIds.has(id));
}

export async function suggestRulesWithAI(
  context: RuleSuggestionContext
): Promise<RuleSuggestionResult> {
  const { rules } = await loadFullCatalog();
  const rulesBySlug = buildRulesBySlugMap(rules);

  if (isAnyAiProviderReady()) {
    try {
      const ruleIds = await suggestRulesWithAi(context, rules);
      if (ruleIds.length > 0) {
        return { ruleIds, source: 'ai' };
      }
    } catch {
      /* fall through to heuristic */
    }
  }

  const slugs = suggestRuleSlugsHeuristic(context, rulesBySlug);
  return {
    ruleIds: slugsToRuleIds(slugs, rulesBySlug),
    source: 'heuristic'
  };
}

export async function getRuleCatalog(): Promise<{
  categories: RuleCatalogCategory[];
  rules: RuleCatalogRule[];
}> {
  return loadFullCatalog();
}

export { invalidateCatalogCache };
