'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { CookiePreferences } from '@/lib/cookies/consent';

const categories: Array<{
  key: keyof Omit<CookiePreferences, 'necessary'>;
  title: string;
  description: string;
}> = [
  {
    key: 'functional',
    title: 'İşlevsel Çerezler',
    description: 'Şehir seçimi ve tercihlerinizi hatırlamamızı sağlar.'
  },
  {
    key: 'analytics',
    title: 'Performans / Analitik',
    description: 'Site kullanımını anonim olarak ölçmemize yardımcı olur.'
  },
  {
    key: 'marketing',
    title: 'Reklam / Pazarlama',
    description: 'İlgi alanlarınıza uygun içerik ve reklam sunar.'
  }
];

export function CookiePreferencesDialog({
  open,
  onOpenChange,
  initialPreferences,
  onSave,
  onAcceptAll
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPreferences: CookiePreferences;
  onSave: (preferences: CookiePreferences) => void;
  onAcceptAll: () => void;
}) {
  const [prefs, setPrefs] = useState(initialPreferences);

  useEffect(() => {
    if (open) setPrefs(initialPreferences);
  }, [open, initialPreferences]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Çerez Tercihleri</DialogTitle>
          <DialogDescription>
            Hangi çerez kategorilerine izin vermek istediğinizi seçin.{' '}
            <Link href="/cerezler" className="text-primary underline">
              Çerez Politikası
            </Link>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4 opacity-80">
            <div>
              <p className="font-medium">Zorunlu Çerezler</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Oturum ve güvenlik için gereklidir; kapatılamaz.
              </p>
            </div>
            <Switch checked disabled onCheckedChange={() => {}} aria-label="Zorunlu çerezler" />
          </div>

          {categories.map((category) => (
            <div
              key={category.key}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div>
                <Label htmlFor={`cookie-${category.key}`} className="font-medium">
                  {category.title}
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <Switch
                id={`cookie-${category.key}`}
                checked={prefs[category.key]}
                onCheckedChange={(checked) =>
                  setPrefs((current) => ({ ...current, [category.key]: checked }))
                }
              />
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onSave(prefs)}>
            Seçimleri Kaydet
          </Button>
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onAcceptAll}
          >
            Tümünü Kabul Et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
