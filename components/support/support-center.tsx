'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  CreditCard,
  Gift,
  HelpCircle,
  Info,
  MessageSquarePlus,
  Search,
  Ticket,
  User,
  XCircle
} from 'lucide-react';
import type { SupportArticle, SupportCategory } from '@/lib/data/support-center';
import {
  getPopularArticles,
  searchArticles
} from '@/lib/data/support-center';
import { getPanelUrl, supportHref } from '@/lib/config/domain';
import { companyLegal } from '@/lib/config/company';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const categoryIcons: Record<SupportCategory['icon'], typeof HelpCircle> = {
  faq: HelpCircle,
  ticket: Ticket,
  event: Calendar,
  payment: CreditCard,
  account: User,
  info: Info,
  cancel: XCircle,
  promo: Gift
};

function CategoryIcon({ icon }: { icon: SupportCategory['icon'] }) {
  const Icon = categoryIcons[icon];
  return (
    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-[var(--bf-accent-ink)]">
      <Icon className="size-6" strokeWidth={1.75} />
    </div>
  );
}

export function SupportHome({
  categories,
  articles
}: {
  categories: SupportCategory[];
  articles: SupportArticle[];
}) {
  const [query, setQuery] = useState('');
  const popular = useMemo(() => getPopularArticles(), []);
  const results = useMemo(() => searchArticles(query), [query]);

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6 sm:py-12">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-bf-orange-400 to-bf-orange-600 px-6 py-10 text-[var(--bf-neon-on)] shadow-lg sm:px-10">
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-medium text-[var(--bf-neon-on)]/70">BiletFeed Destek</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Merhaba, size nasıl yardımcı olabiliriz?
          </h1>
          <div className="relative mt-6">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Makale ara…"
              className="h-11 border-0 bg-white pl-9 text-zinc-900 shadow-sm"
            />
          </div>
        </div>
        <BookOpen className="pointer-events-none absolute -right-4 -top-4 size-32 text-[var(--bf-neon-on)]/10" />
      </div>

      {query.trim() && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-zinc-900">
            {results.length > 0
              ? `${results.length} sonuç bulundu`
              : 'Sonuç bulunamadı'}
          </h2>
          <ul className="mt-4 space-y-2">
            {results.map((a) => (
              <li key={a.slug}>
                <Link
                  href={supportHref(`/makale/${a.slug}`)}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  <span className="font-medium text-zinc-900">{a.title}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {a.summary}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!query.trim() && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="#bilgi-tabani"
            className="group flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-[var(--bf-orange-border)] hover:shadow-md"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--bf-orange-surface)] text-[var(--bf-accent-ink)]">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 group-hover:text-[var(--bf-accent-ink)]">
                Makalelere göz atın
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Bilgi tabanımızdan bilet, ödeme ve hesap konularında cevaplar
                bulun.
              </p>
            </div>
          </Link>
          <Link
            href={supportHref('/destek-talebi')}
            className="group flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-[var(--bf-orange-border)] hover:shadow-md"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[var(--bf-accent-ink)]">
              <MessageSquarePlus className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 group-hover:text-[var(--bf-accent-ink)]">
                Destek talebi gönder
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Sorununuzu formu doldurarak veya e-posta ile iletin.
              </p>
            </div>
          </Link>
        </div>
      )}

      {!query.trim() && (
        <section id="bilgi-tabani">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[var(--bf-accent-ink)]">Bilgi tabanı</h2>
            <p className="text-sm text-zinc-500">Tüm konuları görüntüleyin</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => {
              const count = articles.filter(
                (a) => a.categorySlug === cat.slug
              ).length;
              return (
                <Link
                  key={cat.slug}
                  href={supportHref(`/kategori/${cat.slug}`)}
                  className={cn(
                    'flex flex-col items-center rounded-2xl border border-zinc-200 bg-white px-4 py-8 text-center shadow-sm',
                    'transition-all hover:border-[var(--bf-orange-border)] hover:shadow-md'
                  )}
                >
                  <CategoryIcon icon={cat.icon} />
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-zinc-800">
                    {cat.title}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">{count} makale</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {!query.trim() && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--bf-accent-ink)]">
              En popüler makaleler
            </h2>
            <Link
              href={supportHref('/kategori/sss')}
              className="text-sm font-medium text-[var(--bf-accent-ink)] hover:underline"
            >
              Tüm makaleler
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {popular.map((article) => (
              <Link
                key={article.slug}
                href={supportHref(`/makale/${article.slug}`)}
                className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-[var(--bf-orange-border)] hover:bg-[var(--bf-orange-surface)]/30"
              >
                <BookOpen className="mt-0.5 size-4 shrink-0 text-[var(--bf-accent-ink)]" />
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">{article.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
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

      <div className="rounded-2xl border border-dashed border-[var(--bf-orange-border)] bg-primary/5 px-5 py-4 text-center text-sm text-zinc-600">
        BiletFeed destek merkezi —{' '}
        <a
          href={`mailto:${companyLegal.email}`}
          className="font-medium text-[var(--bf-accent-ink)] hover:underline"
        >
          {companyLegal.email}
        </a>
      </div>
    </div>
  );
}

export function SupportArticleView({ article }: { article: SupportArticle }) {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <Link
          href={supportHref(`/kategori/${article.categorySlug}`)}
          className="text-sm font-medium text-[var(--bf-accent-ink)] hover:underline"
        >
          ← Kategoriye dön
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
          {article.title}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{article.summary}</p>
        <p className="mt-1 text-xs text-zinc-400">
          Son güncelleme:{' '}
          {new Date(article.updatedAt).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        {article.sections.map((section, i) => (
          <div key={i} className="space-y-3">
            {section.heading && (
              <h2 className="text-lg font-semibold text-zinc-900">
                {section.heading}
              </h2>
            )}
            {(section.paragraphs ?? []).map((p, j) => (
              <p key={j} className="text-sm leading-relaxed text-zinc-600">
                {p}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-600">
                {section.bullets.map((b, k) => (
                  <li key={k}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={supportHref('/')}
          className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-50"
        >
          Destek ana sayfa
        </Link>
        <Link
          href={supportHref('/destek-talebi')}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Destek talebi gönder
        </Link>
      </div>
    </article>
  );
}

export function SupportCategoryView({
  category,
  articles
}: {
  category: SupportCategory;
  articles: SupportArticle[];
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <Link
          href={supportHref('/')}
          className="text-sm font-medium text-[var(--bf-accent-ink)] hover:underline"
        >
          ← Destek merkezi
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">
          {category.title}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{category.description}</p>
      </div>

      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link
              href={supportHref(`/makale/${a.slug}`)}
              className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-zinc-50"
            >
              <BookOpen className="size-4 shrink-0 text-[var(--bf-accent-ink)]" />
              <div>
                <p className="font-medium text-zinc-900">{a.title}</p>
                <p className="text-xs text-zinc-500">{a.summary}</p>
              </div>
            </Link>
          </li>
        ))}
        {articles.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-zinc-500">
            Bu kategoride henüz makale yok.
          </li>
        )}
      </ul>

      {category.slug === 'etkinlik-olusturma' && (
        <div className="rounded-2xl border border-[var(--bf-orange-border)] bg-[var(--bf-orange-surface)]/80 px-5 py-5">
          <p className="text-sm font-semibold text-zinc-900">
            Rehberi okuduktan sonra etkinlik oluşturmaya hazır mısınız?
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Organizatör panelinden yeni etkinlik sihirbazını başlatabilirsiniz.
          </p>
          <a
            href={getPanelUrl('/etkinlik/yeni')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Etkinlik oluştur →
          </a>
        </div>
      )}
    </div>
  );
}
