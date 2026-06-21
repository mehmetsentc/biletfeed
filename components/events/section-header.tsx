import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkText?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  href,
  linkText = 'Tümünü Gör',
  className
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-8 flex items-end justify-between gap-4', className)}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link href={href}>
          <Button variant="ghost" className="gap-2 text-primary">
            {linkText}
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}
