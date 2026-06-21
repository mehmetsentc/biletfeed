'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { interestPages } from '@/lib/data/interest-categories';
import { cn } from '@/lib/utils';

interface InterestsFormProps {
  backHref?: string;
  onComplete?: () => void;
  showSkip?: boolean;
}

export function InterestsForm({
  backHref = '/profil',
  onComplete,
  showSkip = false
}: InterestsFormProps) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const categories = interestPages[page] ?? interestPages[0];
  const totalPages = interestPages.length;

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleRestart() {
    setSelected([]);
    setPage(0);
  }

  function handleSave() {
    if (onComplete) {
      onComplete();
      return;
    }
    router.push('/');
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-muted/30">
      <div className="container mx-auto max-w-3xl flex-1 px-4 py-8 md:py-12">
        <div className="flex items-start gap-3">
          <Link
            href={backHref}
            className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted"
            aria-label="Geri dön"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              İlgi alanlarınızı bizimle paylaşın
            </h1>
            <p className="mt-2 text-muted-foreground">
              Kişiselleştirilmiş etkinlik önerileri almak için aşağıdan ilgi
              alanlarınızı seçin.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-8">
          {categories.map((category) => (
            <section
              key={category.id}
              className="border-b border-border pb-8 last:border-b-0"
            >
              <h2 className="text-lg font-bold">{category.title}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {category.tags.map((tag) => {
                  const active = selected.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggle(tag.id)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'border-neutral-400 bg-neutral-300 text-foreground dark:border-neutral-500 dark:bg-neutral-600 dark:text-white'
                          : 'border-border bg-background text-foreground hover:border-neutral-300'
                      )}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="border-t bg-background px-4 py-4">
        <div className="container mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 rounded-full"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Önceki sayfa"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 rounded-full"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              aria-label="Sonraki sayfa"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Sıfırla
            </button>
            {showSkip && (
              <Button variant="ghost" onClick={() => router.push('/')}>
                Atla
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={selected.length === 0}
              className="bg-[#1a1d23] text-white hover:bg-[#1a1d23]/90"
            >
              Kaydet ({selected.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
