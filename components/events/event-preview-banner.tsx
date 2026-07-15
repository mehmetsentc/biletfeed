import { Clock, Eye } from 'lucide-react';
import { getServerTranslations } from '@/lib/i18n/server';
import { cn } from '@/lib/utils';

interface EventPreviewBannerProps {
  kind: 'draft' | 'pending';
  className?: string;
}

export async function EventPreviewBanner({
  kind,
  className
}: EventPreviewBannerProps) {
  const { t } = await getServerTranslations();
  const isDraft = kind === 'draft';

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
        isDraft
          ? 'border-slate-200 bg-slate-50 text-slate-800'
          : 'border-amber-200 bg-amber-50 text-amber-950',
        className
      )}
    >
      {isDraft ? (
        <Eye className="mt-0.5 size-4 shrink-0" />
      ) : (
        <Clock className="mt-0.5 size-4 shrink-0" />
      )}
      <div>
        <p className="font-semibold">
          {isDraft ? t.events.draftPreview : t.events.pendingPreview}
        </p>
        <p className="mt-0.5 opacity-90">
          {isDraft ? t.events.draftPreviewBody : t.events.pendingPreviewBody}
        </p>
      </div>
    </div>
  );
}
