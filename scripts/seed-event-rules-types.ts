import type { RuleParameterType } from '@prisma/client';

export interface SeedRule {
  categorySlug: string;
  slug: string;
  titleTr: string;
  titleEn: string;
  descriptionTr: string;
  descriptionEn: string;
  eventTypes?: string[];
  isDefault?: boolean;
  isRecommended?: boolean;
  requiresParameter?: boolean;
  parameterType?: RuleParameterType;
  sortOrder?: number;
}
