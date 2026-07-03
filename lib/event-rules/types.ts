import type { RuleParameterType } from '@prisma/client';

export type EventRulesLocale = 'tr' | 'en';

export interface SelectedRuleEntry {
  ruleId: string;
  parameterValue?: string;
}

export interface EventRuleSetData {
  selectedRules: SelectedRuleEntry[];
  customRules: string[];
  appliedTemplateId?: string | null;
}

export interface EventAnnouncementInput {
  id?: string;
  titleTr: string;
  titleEn?: string;
  contentTr: string;
  contentEn?: string;
  sortOrder?: number;
}

export interface ResolvedRuleItem {
  id: string;
  slug: string;
  categorySlug: string;
  categoryTitle: string;
  title: string;
  description: string;
  icon?: string | null;
  parameterValue?: string;
  parameterLabel?: string;
  displayText: string;
}

export interface ResolvedRuleSection {
  slug: string;
  title: string;
  icon: string;
  items: ResolvedRuleItem[];
}

export interface EventRulesDisplayData {
  sections: ResolvedRuleSection[];
  announcements: Array<{
    id: string;
    title: string;
    contentHtml: string;
  }>;
  flatRulesText: string;
}

export interface RuleCatalogRule {
  id: string;
  slug: string;
  categoryId: string;
  categorySlug: string;
  subcategory: string | null;
  titleTr: string;
  titleEn: string;
  descriptionTr: string;
  descriptionEn: string;
  icon: string | null;
  sortOrder: number;
  eventTypes: string[];
  isDefault: boolean;
  isRecommended: boolean;
  requiresParameter: boolean;
  parameterType: RuleParameterType;
  parameterOptions: unknown;
}

export interface RuleCatalogCategory {
  id: string;
  slug: string;
  icon: string;
  titleTr: string;
  titleEn: string;
  descriptionTr: string | null;
  descriptionEn: string | null;
  sortOrder: number;
  ruleCount: number;
}

export interface OrganizerRuleTemplateData {
  id: string;
  name: string;
  description: string | null;
  selectedRules: SelectedRuleEntry[];
  customRules: string[];
  sortOrder: number;
}

export interface RuleSuggestionContext {
  eventType?: string;
  categorySlug?: string;
  tags?: string[];
  title?: string;
  description?: string;
  isOnline?: boolean;
  isFree?: boolean;
}

export interface RuleSuggestionResult {
  ruleIds: string[];
  source: 'ai' | 'heuristic';
}
