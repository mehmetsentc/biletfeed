import type { RuleParameterType } from '@prisma/client';
import {
  AGE_LIMIT_OPTIONS,
  CHILD_POLICY_OPTIONS,
  DRESS_CODE_OPTIONS,
  REFUND_POLICY_OPTIONS
} from '@/lib/event-rules/constants';
import { getLocalizedField } from '@/lib/event-rules/i18n';
import type {
  EventAnnouncementInput,
  EventRulesDisplayData,
  EventRulesLocale,
  ResolvedRuleItem,
  ResolvedRuleSection,
  RuleCatalogRule,
  SelectedRuleEntry
} from '@/lib/event-rules/types';
import { PUBLIC_RULE_SECTIONS, RULE_CATEGORY_SLUGS } from '@/lib/event-rules/constants';

interface CategoryMeta {
  slug: string;
  icon: string;
  titleTr: string;
  titleEn: string;
}

function findOptionLabel(
  options: Array<{ value: string; labelTr: string; labelEn: string }>,
  value: string,
  locale: EventRulesLocale
): string {
  const opt = options.find((o) => o.value === value);
  if (!opt) return value;
  return locale === 'en' ? opt.labelEn : opt.labelTr;
}

function formatParameterValue(
  parameterType: RuleParameterType,
  value: string,
  locale: EventRulesLocale
): string {
  switch (parameterType) {
    case 'age_limit':
      return findOptionLabel(AGE_LIMIT_OPTIONS, value, locale);
    case 'dress_code':
      return findOptionLabel(DRESS_CODE_OPTIONS, value, locale);
    case 'child_policy':
      return findOptionLabel(CHILD_POLICY_OPTIONS, value, locale);
    case 'refund_policy':
      return findOptionLabel(REFUND_POLICY_OPTIONS, value, locale);
    default:
      return value;
  }
}

function buildDisplayText(
  rule: RuleCatalogRule,
  locale: EventRulesLocale,
  parameterValue?: string
): string {
  const title = getLocalizedField(rule, 'title', locale);
  const description = getLocalizedField(rule, 'description', locale);

  if (rule.requiresParameter && parameterValue) {
    const paramLabel = formatParameterValue(rule.parameterType, parameterValue, locale);
    return `${title}: ${paramLabel}. ${description}`;
  }

  return description || title;
}

export function resolveSelectedRules(
  selectedRules: SelectedRuleEntry[],
  rulesById: Map<string, RuleCatalogRule>,
  categoriesById: Map<string, CategoryMeta>,
  locale: EventRulesLocale = 'tr'
): ResolvedRuleItem[] {
  const resolved: ResolvedRuleItem[] = [];

  for (const entry of selectedRules) {
    const rule = rulesById.get(entry.ruleId);
    if (!rule) continue;

    const category = categoriesById.get(rule.categoryId);
    if (!category) continue;

    const parameterLabel =
      rule.requiresParameter && entry.parameterValue
        ? formatParameterValue(rule.parameterType, entry.parameterValue, locale)
        : undefined;

    resolved.push({
      id: rule.id,
      slug: rule.slug,
      categorySlug: category.slug,
      categoryTitle: getLocalizedField(category, 'title', locale),
      title: getLocalizedField(rule, 'title', locale),
      description: getLocalizedField(rule, 'description', locale),
      icon: rule.icon,
      parameterValue: entry.parameterValue,
      parameterLabel,
      displayText: buildDisplayText(rule, locale, entry.parameterValue)
    });
  }

  return resolved;
}

export function groupRulesIntoSections(
  items: ResolvedRuleItem[],
  customRules: string[],
  locale: EventRulesLocale = 'tr'
): ResolvedRuleSection[] {
  const sections: ResolvedRuleSection[] = [];

  for (const sectionDef of PUBLIC_RULE_SECTIONS) {
    const sectionItems = items.filter((item) =>
      sectionDef.categorySlugs.includes(item.categorySlug as typeof RULE_CATEGORY_SLUGS[keyof typeof RULE_CATEGORY_SLUGS])
    );

    if (sectionItems.length === 0) continue;

    sections.push({
      slug: sectionDef.slug,
      title: locale === 'en' ? sectionDef.titleEn : sectionDef.titleTr,
      icon: sectionItems[0]?.icon ?? 'info',
      items: sectionItems
    });
  }

  const categorizedSlugs = new Set(
    PUBLIC_RULE_SECTIONS.flatMap((s) => s.categorySlugs)
  );
  const uncategorized = items.filter((i) => !categorizedSlugs.has(i.categorySlug));

  if (uncategorized.length > 0) {
    sections.push({
      slug: 'other',
      title: locale === 'en' ? 'Other Rules' : 'Diğer Kurallar',
      icon: 'list',
      items: uncategorized
    });
  }

  if (customRules.length > 0) {
    const customItems: ResolvedRuleItem[] = customRules.map((text, idx) => ({
      id: `custom-${idx}`,
      slug: `custom-${idx}`,
      categorySlug: 'custom',
      categoryTitle: locale === 'en' ? 'Custom' : 'Özel',
      title: text,
      description: text,
      icon: null,
      displayText: text
    }));

    sections.push({
      slug: 'custom-rules',
      title: locale === 'en' ? 'Organizer Rules' : 'Organizatör Kuralları',
      icon: 'file-text',
      items: customItems
    });
  }

  return sections;
}

export function flattenRulesToText(
  items: ResolvedRuleItem[],
  customRules: string[]
): string {
  const lines = [
    ...items.map((i) => i.displayText),
    ...customRules.filter(Boolean)
  ];
  return lines.join('\n');
}

export function buildEventRulesDisplay(
  selectedRules: SelectedRuleEntry[],
  customRules: string[],
  announcements: EventAnnouncementInput[],
  rulesById: Map<string, RuleCatalogRule>,
  categoriesById: Map<string, CategoryMeta>,
  locale: EventRulesLocale = 'tr'
): EventRulesDisplayData {
  const resolved = resolveSelectedRules(
    selectedRules,
    rulesById,
    categoriesById,
    locale
  );

  const sections = groupRulesIntoSections(resolved, customRules, locale);

  return {
    sections,
    announcements: announcements.map((a, idx) => ({
      id: a.id ?? `announcement-${idx}`,
      title: getLocalizedField(a, 'title', locale),
      contentHtml: getLocalizedField(a, 'content', locale)
    })),
    flatRulesText: flattenRulesToText(resolved, customRules)
  };
}

export function autoIncludeEtiquetteAndTips(
  selectedRules: SelectedRuleEntry[],
  rulesBySlug: Map<string, RuleCatalogRule>,
  eventType: string
): SelectedRuleEntry[] {
  const existingIds = new Set(selectedRules.map((r) => r.ruleId));
  const additions: SelectedRuleEntry[] = [...selectedRules];

  const etiquetteSlugs = [
    'gorgu-saygili-davran',
    'gorgu-telefon-sessiz',
    'gorgu-alan-temizligi'
  ];

  for (const slug of etiquetteSlugs) {
    const rule = rulesBySlug.get(slug);
    if (rule && !existingIds.has(rule.id)) {
      additions.push({ ruleId: rule.id });
      existingIds.add(rule.id);
    }
  }

  const tipSlug = `tip-${eventType || 'other'}-genel`;
  const tipRule = rulesBySlug.get(tipSlug);
  if (tipRule && !existingIds.has(tipRule.id)) {
    additions.push({ ruleId: tipRule.id });
  }

  return additions;
}
