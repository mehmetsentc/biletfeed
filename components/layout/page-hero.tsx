import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export function PageHero({
  title,
  subtitle,
  leading,
  breadcrumbs,
  className
}: PageHeroProps) {
  return (
    <section
      className={cn(
        'border-b bg-gradient-to-br from-primary/10 via-background to-accent/5 py-12 md:py-16',
        className
      )}
    >
      <div className="container mx-auto px-4">
        {breadcrumbs && (
          <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[var(--bf-accent-ink)]">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="flex items-center gap-3 text-3xl font-bold md:gap-4 md:text-4xl">
          {leading}
          <span>{title}</span>
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
