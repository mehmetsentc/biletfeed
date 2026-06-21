'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PageHero } from '@/components/layout/page-hero';
import { mockFaqs } from '@/lib/data/mock-user';
import { cn } from '@/lib/utils';

export default function FaqPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <PageHero title="Sık Sorulan Sorular" subtitle="Merak ettiklerinizin cevapları" />
      <div className="container mx-auto max-w-3xl space-y-8 px-4 py-12">
        {mockFaqs.map((section) => (
          <div key={section.category}>
            <h2 className="mb-4 text-lg font-bold">{section.category}</h2>
            <div className="space-y-2">
              {section.items.map((item, i) => {
                const key = `${section.category}-${i}`;
                const isOpen = open === key;
                return (
                  <div key={key} className="overflow-hidden rounded-xl border bg-card">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : key)}
                      className="flex w-full items-center justify-between p-4 text-left font-medium"
                    >
                      {item.q}
                      <ChevronDown
                        className={cn(
                          'size-5 shrink-0 text-muted-foreground transition-transform',
                          isOpen && 'rotate-180'
                        )}
                      />
                    </button>
                    {isOpen && (
                      <p className="border-t px-4 pb-4 pt-2 text-sm text-muted-foreground">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
