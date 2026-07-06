import type { Prisma } from '@prisma/client';
import { buildRulesByIdMap } from '@/lib/event-rules/cache';
import { flattenRulesToText, resolveSelectedRules } from '@/lib/event-rules/resolve-rules';
import type { EventAnnouncementInput, EventRuleSetData } from '@/lib/event-rules/types';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { loadEventRulesCatalog } from '@/lib/services/event-rules-catalog';

async function normalizeAnnouncementInput(
  announcement: EventAnnouncementInput,
  sortOrder: number
): Promise<EventAnnouncementInput> {
  const { sanitizeOrganizerHtml, sanitizePlainText } = await import(
    '@/lib/security/sanitize-html'
  );

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

async function verifyEventOwnership(eventId: string, organizerId: string): Promise<void> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    select: { id: true }
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

  const { categories, rules } = await loadEventRulesCatalog();
  const rulesById = buildRulesByIdMap(rules);
  const categoriesById = new Map(
    categories.map((c) => [
      c.id,
      { slug: c.slug, icon: c.icon, titleTr: c.titleTr, titleEn: c.titleEn }
    ])
  );

  const resolved = resolveSelectedRules(data.selectedRules, rulesById, categoriesById);
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
        const rows = await Promise.all(
          data.announcements.map((announcement, idx) =>
            normalizeAnnouncementInput(announcement, idx)
          )
        );
        await tx.eventAnnouncement.createMany({
          data: rows.map((normalized, idx) => ({
            eventId,
            titleTr: normalized.titleTr,
            titleEn: normalized.titleEn ?? null,
            contentTr: normalized.contentTr,
            contentEn: normalized.contentEn ?? null,
            sortOrder: normalized.sortOrder ?? idx
          }))
        });
      }
    }
  });

  return { flatRulesText };
}
