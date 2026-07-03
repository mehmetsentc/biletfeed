import type { EventRulesLocale } from '@/lib/event-rules/types';

export function getLocalizedField(
  obj: object,
  field: string,
  locale: EventRulesLocale = 'tr'
): string {
  const record = obj as Record<string, unknown>;
  const trKey = `${field}Tr`;
  const enKey = `${field}En`;
  const trVal = record[trKey];
  const enVal = record[enKey];

  if (locale === 'en') {
    if (typeof enVal === 'string' && enVal.trim()) return enVal;
    if (typeof trVal === 'string') return trVal;
    return '';
  }

  if (typeof trVal === 'string') return trVal;
  if (typeof enVal === 'string') return enVal;
  return '';
}

export function resolveLocaleFromCookie(
  cookieValue?: string | null
): EventRulesLocale {
  if (cookieValue === 'en') return 'en';
  return 'tr';
}
