'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  items: Array<{ id: string; displayText: string }>;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, PREVIEW_COUNT);
  const hasMore = items.length > PREVIEW_COUNT;

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <ul className={cn('mt-3 space-y-2', compact && 'text-sm')}>
        {visible.map((item) => (
          <li key={item.id} className="flex gap-2 text-muted-foreground">
            <span className="text-primary">•</span>
            <span>{item.displayText}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 gap-1 text-primary"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Daha az göster' : 'Tümünü Göster'}
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
  accepted,
  onAcceptedChange
}: {
  data: EventRulesDisplayData;
  accepted: boolean;
  onAcceptedChange: (v: boolean) => void;
}) {
  const allItems = data.sections.flatMap((s) => s.items);
  if (allItems.length === 0 && data.announcements.length === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
      <h3 className="text-sm font-semibold">Etkinlik Hakkında Bilmeniz Gerekenler</h3>
      <EventRulesDisplay data={data} compact />
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
        />
        <span>Etkinlik kurallarını okudum ve kabul ediyorum.</span>
      </label>
    </div>
  );
}
