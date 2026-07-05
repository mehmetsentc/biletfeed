import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { MockEvent } from '@/lib/data/mock-events';
import { HomeEventScrollCard } from '@/components/home/home-event-scroll-card';
import { cn } from '@/lib/utils';

type HomeEventScrollRailProps = {
  title: string;
  events: MockEvent[];
  href?: string;
  className?: string;
};

export function HomeEventScrollRail({
  title,
  events,
  href,
  className
}: HomeEventScrollRailProps) {
  if (events.length === 0) return null;

  return (
    <section className={cn('py-5', className)}>
      <div className="mb-3 flex items-center justify-between gap-3 px-4">
        <h2 className="text-lg font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
        {href ? (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary"
          >
            Tümü
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {events.map((event) => (
          <HomeEventScrollCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
