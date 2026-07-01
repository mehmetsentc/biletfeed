'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  CreditCard,
  HelpCircle,
  Layers,
  MessageSquarePlus,
  Search,
  Ticket,
  User,
  XCircle
} from 'lucide-react';
import type { HelpArticle, HelpCategory } from '@/lib/data/organizer-help-center';
import {
  getPopularArticles,
  searchHelpArticles
} from '@/lib/data/organizer-help-center';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const categoryIcons: Record<HelpCategory['icon'], typeof HelpCircle> = {
  faq: HelpCircle,
  ticket: Ticket,
  event: Calendar,
  payment: CreditCard,
  account: User,
  cancel: XCircle
};

function CategoryIcon({ icon }: { icon: HelpCategory['icon'] }) {
  const Icon = categoryIcons[icon];
  return (
    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="size-6" strokeWidth={1.75} />
    </div>
  );
}

export function OrganizerHelpHome({
  categories,
  articles
}: {
  categories: HelpCategory[];
  articles: HelpArticle[];
}) {
  const [query, setQuery] = useState('');
  const popular = useMemo(() => getPopularArticles(), []);
  const results = useMemo(() => searchHelpArticles(query), [query]);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-primary via-primary to-primary/85 px-6 py-10 text-primary-foreground shadow-[var(--shadow-md)] sm:px-10">
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-medium text-primary-foreground/80">BiletFeed Yardım</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Merhaba, size nasıl yardımcı olabiliriz?
          </h1>
          <div className="relative mt-6">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Makale ara…"
              className="h-11 border-0 bg-white pl-9 text-foreground shadow-sm"
            />
          </div>
        </div>
        <Layers className="pointer-events-none absolute -right-4 -top-4 size-32 text-white/10" />
      </div>

      {/* Arama sonuçları */}
      {query.trim() && (
        <section className="rounded-[var(--radius-card)] border bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-foreground">
            {results.length > 0
              ? `${results.length} sonuç bulundu`
              : 'Sonuç bulunamadı'}
          </h2>
          <ul className="mt-4 space-y-2">
            {results.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/organizator-panel/yardim/makale/${a.slug}`}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                >
                  <span className="font-medium text-foreground">{a.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{a.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* CTA kartları */}
      {!query.trim() && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="#bilgi-tabani"
            className="group flex gap-4 rounded-[var(--radius-card)] border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary">
                Makalelere göz atın
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bilgi tabanımızdan panel kullanımı ve en iyi uygulamaları öğrenin.
              </p>
            </div>
          </Link>
          <Link
            href="/organizator-panel/iletisim"
            className="group flex gap-4 rounded-[var(--radius-card)] border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquarePlus className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary">
                Destek talebi gönder
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Formu doldurarak sorununuzu destek ekibimize iletin.
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Kategoriler */}
      {!query.trim() && (
        <section id="bilgi-tabani">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary">Bilgi tabanı</h2>
              <p className="text-sm text-muted-foreground">Tüm makaleleri görüntüleyin</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const count = articles.filter((a) => a.categorySlug === cat.slug).length;
              return (
                <Link
                  key={cat.slug}
                  href={`/organizator-panel/yardim/kategori/${cat.slug}`}
                  className={cn(
                    'flex flex-col items-center rounded-[var(--radius-card)] border bg-card px-5 py-8 text-center shadow-sm',
                    'transition-all hover:border-primary/30 hover:shadow-md'
                  )}
                >
                  <CategoryIcon icon={cat.icon} />
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-foreground">
                    {cat.title}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{count} makale</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Popüler makaleler */}
      {!query.trim() && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">En popüler makaleler</h2>
            <Link
              href="/organizator-panel/yardim/kategori/sss"
              className="text-sm font-medium text-primary hover:underline"
            >
              Tüm makaleler
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {popular.map((article) => (
              <Link
                key={article.slug}
                href={`/organizator-panel/yardim/makale/${article.slug}`}
                className="flex items-start gap-3 rounded-[var(--radius-card)] border bg-card p-4 shadow-sm transition-colors hover:border-primary/20 hover:bg-primary/[0.02]"
              >
                <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{article.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Güncellendi:{' '}
                    {new Date(article.updatedAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="rounded-[var(--radius-card)] border border-dashed border-primary/30 bg-primary/[0.03] px-5 py-4 text-center text-sm text-muted-foreground">
        BiletFeed organizatör yardım merkezi —{' '}
        <Link href="/organizator-panel/iletisim" className="font-medium text-primary hover:underline">
          destek@biletfeed.com
        </Link>
      </div>
    </div>
  );
}

export function HelpArticleView({ article }: { article: HelpArticle }) {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/organizator-panel/yardim/kategori/${article.categorySlug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Kategoriye dön
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {article.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{article.summary}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Son güncelleme:{' '}
          {new Date(article.updatedAt).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>

      <div className="space-y-6 rounded-[var(--radius-card)] border bg-card p-6 shadow-sm">
        {article.sections.map((section, i) => (
          <div key={i} className="space-y-3">
            {section.heading && (
              <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
            )}
            {section.paragraphs.map((p, j) => (
              <p key={j} className="text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {section.bullets.map((b, k) => (
                  <li key={k}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/organizator-panel/yardim">Yardım ana sayfa</Link>
        </Button>
        <Button asChild>
          <Link href="/organizator-panel/iletisim">Destek talebi gönder</Link>
        </Button>
      </div>
    </article>
  );
}

export function HelpCategoryView({
  category,
  articles
}: {
  category: HelpCategory;
  articles: HelpArticle[];
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/organizator-panel/yardim" className="text-sm font-medium text-primary hover:underline">
          ← Yardım merkezi
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-foreground">{category.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border bg-card shadow-sm">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/organizator-panel/yardim/makale/${a.slug}`}
              className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30"
            >
              <BookOpen className="size-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.summary}</p>
              </div>
            </Link>
          </li>
        ))}
        {articles.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-muted-foreground">
            Bu kategoride henüz makale yok.
          </li>
        )}
      </ul>
    </div>
  );
}
