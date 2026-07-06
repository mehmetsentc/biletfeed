import type { Prisma } from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import type { OrganizerRuleTemplateData, SelectedRuleEntry } from '@/lib/event-rules/types';
import { parseSelectedRules } from '@/lib/services/event-rules-query';

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

  const count = await prisma.organizerRuleTemplate.count({ where: { organizerId } });
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
