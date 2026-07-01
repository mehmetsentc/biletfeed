import { Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventPreviewBannerProps {
  kind: 'draft' | 'pending';
  className?: string;
}

export function EventPreviewBanner({ kind, className }: EventPreviewBannerProps) {
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
          {isDraft ? 'Taslak önizleme' : 'Onay bekliyor — henüz herkese açık değil'}
        </p>
        <p className="mt-0.5 opacity-90">
          {isDraft
            ? 'Bu sayfa yalnızca size görünür. Etkinliği onaya gönderdikten sonra admin incelemesine alınır.'
            : 'Etkinliğiniz BiletFeed ekibi tarafından inceleniyor. Onaylandığında otomatik olarak yayına alınacaktır.'}
        </p>
      </div>
    </div>
  );
}
