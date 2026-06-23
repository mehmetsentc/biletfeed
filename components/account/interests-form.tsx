'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsPageHeader } from '@/components/account/settings-form';
import { interestPages } from '@/lib/data/interest-categories';
import { cn } from '@/lib/utils';

interface InterestsFormProps {
  onComplete?: () => void;
  showSkip?: boolean;
}

export function InterestsForm({
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
    router.push('/profil');
  }

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="İlgi Alanları"
        description="Kişiselleştirilmiş etkinlik önerileri almak için ilgi alanlarınızı seçin."
      />

      <div className="space-y-8">
        {categories.map((category) => (
          <section
            key={category.id}
            className="rounded-xl border border-border bg-card p-5 md:p-6"
          >
            <h2 className="text-base font-bold">{category.title}</h2>
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
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground hover:border-primary/30'
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

      <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
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
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
  );
}
