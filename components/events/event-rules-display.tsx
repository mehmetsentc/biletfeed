'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/components/providers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { EventRulesDisplayData } from '@/lib/event-rules/types';
import { cn } from '@/lib/utils';

const PREVIEW_COUNT = 5;

interface EventRulesDisplayProps {
  data: EventRulesDisplayData;
  compact?: boolean;
  className?: string;
}

function AnnouncementBlock({
  title,
  contentHtml
}: {
  title: string;
  contentHtml: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <h4 className="font-semibold text-foreground">{title}</h4>
      <div
        className="prose prose-sm mt-2 max-w-none text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
}

function SectionCard({
  title,
  items,
  compact
}: {
  title: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    displayText: string;
    parameterValue?: string;
    parameterLabel?: string;
  }>;
  compact?: boolean;
}) {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, PREVIEW_COUNT);
  const hasMore = items.length > PREVIEW_COUNT;

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <ul className={cn('mt-3 space-y-3', compact && 'text-sm')}>
        {visible.map((item) => (
          <li key={item.id} className="text-muted-foreground">
            <p className="font-medium text-foreground">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 leading-relaxed">{item.description}</p>
            ) : null}
            {item.parameterLabel ? (
              <p className="mt-1.5 inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-[var(--bf-accent-ink)]">
                {item.parameterLabel}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {hasMore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 gap-1 text-[var(--bf-accent-ink)]"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? t.events.showLess : t.events.showAll}
          <ChevronDown
            className={cn('size-4 transition-transform', expanded && 'rotate-180')}
          />
        </Button>
      )}
    </div>
  );
}

export function EventRulesDisplay({ data, compact, className }: EventRulesDisplayProps) {
  if (
    data.sections.length === 0 &&
    data.announcements.length === 0
  ) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {data.sections.map((section) => (
        <SectionCard
          key={section.slug}
          title={section.title}
          items={section.items}
          compact={compact}
        />
      ))}

      {data.announcements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold">Organizatör Bilgilendirmeleri</h3>
          {data.announcements.map((ann) => (
            <AnnouncementBlock
              key={ann.id}
              title={ann.title}
              contentHtml={ann.contentHtml}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function EventRulesAcceptanceList({
  data,
  plainLines,
  eventTitle,
  accepted,
  onAcceptedChange
}: {
  data?: EventRulesDisplayData;
  plainLines?: string[];
  eventTitle?: string;
  accepted: boolean;
  onAcceptedChange: (v: boolean) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasStructured =
    data &&
    (data.sections.some((s) => s.items.length > 0) || data.announcements.length > 0);
  const lines = plainLines?.filter(Boolean) ?? [];
  const hasPlain = lines.length > 0;

  if (!hasStructured && !hasPlain) return null;

  const previewItems = useMemo(() => {
    if (!data) return [];
    return data.sections.flatMap((s) => s.items).slice(0, 3);
  }, [data]);

  const totalRuleCount = useMemo(() => {
    if (!data) return lines.length;
    const items = data.sections.reduce((n, s) => n + s.items.length, 0);
    return items + data.announcements.length;
  }, [data, lines.length]);

  const dialogTitle = eventTitle
    ? `Etkinlik Kuralları — ${eventTitle}`
    : 'Etkinlik Kuralları';

  return (
    <>
      <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Etkinlik Kuralları</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Satın almadan önce kuralları okuyup onaylamanız gerekir.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--bf-accent-ink)]">
            {totalRuleCount} madde
          </span>
        </div>

        {hasStructured && previewItems.length > 0 && (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {previewItems.map((item) => (
              <li key={item.id} className="flex gap-2 leading-snug">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>
                  <span className="font-medium text-foreground">{item.title}</span>
                  {item.displayText ? (
                    <span className="text-muted-foreground"> — {item.displayText}</span>
                  ) : null}
                </span>
              </li>
            ))}
            {totalRuleCount > previewItems.length && (
              <li className="text-xs text-muted-foreground">
                + {totalRuleCount - previewItems.length} madde daha
              </li>
            )}
          </ul>
        )}

        {hasPlain && !hasStructured && (
          <ul className="max-h-28 space-y-2 overflow-y-auto text-sm text-muted-foreground">
            {lines.slice(0, 4).map((line) => (
              <li key={line} className="flex gap-2 leading-snug">
                <span className="text-[var(--bf-accent-ink)]">•</span>
                <span>{line}</span>
              </li>
            ))}
            {lines.length > 4 && (
              <li className="text-xs text-muted-foreground">
                + {lines.length - 4} madde daha
              </li>
            )}
          </ul>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2 border-primary/30 text-[var(--bf-accent-ink)] hover:bg-primary/5"
          onClick={() => setDialogOpen(true)}
        >
          <FileText className="size-4" />
          Kuralları Oku
        </Button>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-primary"
            checked={accepted}
            onChange={(e) => onAcceptedChange(e.target.checked)}
          />
          <span className="text-foreground">
            <button
              type="button"
              className="font-semibold text-[var(--bf-accent-ink)] underline underline-offset-2 hover:text-[var(--bf-accent-ink)]/80"
              onClick={(e) => {
                e.preventDefault();
                setDialogOpen(true);
              }}
            >
              Etkinlik kurallarını
            </button>{' '}
            okudum ve kabul ediyorum.
          </span>
        </label>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[min(90dvh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border px-5 py-4 text-left">
            <DialogTitle className="text-base font-bold">{dialogTitle}</DialogTitle>
            <DialogDescription>
              Aşağıdaki kurallar bu etkinlik için geçerlidir. Onaylamadan önce
              lütfen tamamını okuyun.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {hasStructured && data ? (
              <EventRulesDisplay data={data} compact />
            ) : (
              <ul className="space-y-3 text-sm text-muted-foreground">
                {lines.map((line) => (
                  <li key={line} className="flex gap-2 leading-relaxed">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-foreground">{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter className="border-t border-border px-5 py-4">
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setDialogOpen(false)}
            >
              Okudum, Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
