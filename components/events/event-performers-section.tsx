import { Mic2, Users } from 'lucide-react';

export type EventPerformerDisplay = {
  name: string;
  type: 'person' | 'group';
};

interface EventPerformersSectionProps {
  performers: EventPerformerDisplay[];
}

export function EventPerformersSection({
  performers
}: EventPerformersSectionProps) {
  if (performers.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="text-lg font-bold">Sanatçılar / Katılımcılar</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {performers.map((performer) => {
          const Icon = performer.type === 'group' ? Users : Mic2;
          return (
            <li
              key={`${performer.type}-${performer.name}`}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[var(--bf-accent-ink)]">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {performer.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {performer.type === 'group' ? 'Grup / Organizasyon' : 'Sanatçı'}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
