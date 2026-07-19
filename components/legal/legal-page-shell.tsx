import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { JsonLd } from '@/lib/seo/json-ld';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/seo/schemas';
import { siteConfig } from '@/lib/config/site';
import { cn } from '@/lib/utils';

export interface LegalPageSection {
  id: string;
  label: string;
}

interface LegalPageShellProps {
  title: string;
  description: string;
  path: string;
  lastUpdated: string;
  sections?: LegalPageSection[];
  children: React.ReactNode;
  className?: string;
}

function formatLastUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function LegalPageShell({
  title,
  description,
  path,
  lastUpdated,
  sections,
  children,
  className
}: LegalPageShellProps) {
  const pageUrl = `${siteConfig.url}${path}`;
  const breadcrumbs = [
    { name: 'Ana Sayfa', url: siteConfig.url },
    { name: title, url: pageUrl }
  ];

  return (
    <>
      <JsonLd
        data={[
          buildWebPageSchema({
            name: title,
            description,
            url: pageUrl,
            dateModified: lastUpdated
          }),
          buildBreadcrumbSchema(breadcrumbs)
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground">
              Ana Sayfa
            </Link>
          </li>
          <li aria-hidden className="flex items-center">
            <ChevronRight className="size-3.5" />
          </li>
          <li className="font-medium text-foreground" aria-current="page">
            {title}
          </li>
        </ol>
      </nav>

      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Son güncelleme: {formatLastUpdated(lastUpdated)}
        </p>
      </header>

      <div
        className={cn(
          sections && sections.length > 3 ? 'lg:grid lg:grid-cols-[220px_1fr] lg:gap-10' : '',
          className
        )}
      >
        {sections && sections.length > 3 && (
          <nav
            aria-label="İçindekiler"
            className="mb-8 hidden lg:sticky lg:top-24 lg:block lg:self-start"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              İçindekiler
            </p>
            <ul className="space-y-1 border-l border-border pl-3">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block py-1 text-sm text-muted-foreground transition-colors hover:text-[var(--bf-accent-ink)]"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <article
          className={cn(
            'min-w-0 max-w-none prose prose-neutral dark:prose-invert',
            'prose-headings:scroll-mt-24 prose-a:text-[var(--bf-accent-ink)]'
          )}
        >
          {children}
        </article>
      </div>
    </>
  );
}
