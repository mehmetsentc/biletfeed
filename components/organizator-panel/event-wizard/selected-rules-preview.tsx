'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { resolveSelectedRules } from '@/lib/event-rules/resolve-rules';
import type {
  RuleCatalogCategory,
  RuleCatalogRule,
  SelectedRuleEntry
} from '@/lib/event-rules/types';
import { cn } from '@/lib/utils';

interface SelectedRulesPreviewProps {
  selectedRules: SelectedRuleEntry[];
  customRules: string[];
  rules: RuleCatalogRule[];
  categories: RuleCatalogCategory[];
  compact?: boolean;
  className?: string;
}

export function SelectedRulesPreview({
  selectedRules,
  customRules,
  rules,
  categories,
  compact,
  className
}: SelectedRulesPreviewProps) {
  const rulesById = useMemo(
    () => new Map(rules.map((rule) => [rule.id, rule])),
    [rules]
  );

  const categoriesById = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          {
            slug: category.slug,
            icon: category.icon,
            titleTr: category.titleTr,
            titleEn: category.titleEn
          }
        ])
      ),
    [categories]
  );

  const resolved = useMemo(
    () => resolveSelectedRules(selectedRules, rulesById, categoriesById, 'tr'),
    [selectedRules, rulesById, categoriesById]
  );

  if (resolved.length === 0 && customRules.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        Henüz kural seçilmedi. Aşağıdaki kategorilerden kuralları işaretleyin veya AI önerisi
        kullanın.
      </p>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {resolved.map((item) => {
        const rule = rulesById.get(item.id);
        const needsParameter =
          rule?.requiresParameter &&
          !item.parameterValue?.trim();

        return (
          <div
            key={item.id}
            className={cn(
              'rounded-lg border border-border bg-card p-3',
              compact && 'p-2.5'
            )}
          >
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            {item.description ? (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            ) : null}
            {item.parameterLabel ? (
              <p className="mt-2 inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {item.parameterLabel}
              </p>
            ) : null}
            {needsParameter ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="size-3.5 shrink-0" />
                Bu kural için bir değer seçmeniz gerekir.
              </p>
            ) : null}
          </div>
        );
      })}

      {customRules.map((rule, index) => (
        <div
          key={`custom-${index}`}
          className={cn(
            'rounded-lg border border-dashed border-border bg-muted/20 p-3',
            compact && 'p-2.5'
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Özel kural
          </p>
          <p className="mt-1 text-sm text-foreground">{rule}</p>
        </div>
      ))}
    </div>
  );
}

interface RulesPreviewWithCatalogProps {
  selectedRules: SelectedRuleEntry[];
  customRules: string[];
  compact?: boolean;
  className?: string;
}

export function RulesPreviewWithCatalog({
  selectedRules,
  customRules,
  compact,
  className
}: RulesPreviewWithCatalogProps) {
  const [rules, setRules] = useState<RuleCatalogRule[]>([]);
  const [categories, setCategories] = useState<RuleCatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/organizer/event-rules/catalog', {
          credentials: 'include'
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          rules: RuleCatalogRule[];
          categories: RuleCatalogCategory[];
        };
        if (!cancelled) {
          setRules(data.rules);
          setCategories(data.categories);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Kurallar yükleniyor…
      </div>
    );
  }

  return (
    <SelectedRulesPreview
      selectedRules={selectedRules}
      customRules={customRules}
      rules={rules}
      categories={categories}
      compact={compact}
      className={className}
    />
  );
}
