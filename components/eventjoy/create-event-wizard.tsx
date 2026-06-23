'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useEventJoy } from '@/components/providers/eventjoy-provider';
import {
  EVENT_TYPES,
  invitationTemplates
} from '@/lib/eventjoy/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function CreateEventWizard() {
  const router = useRouter();
  const { addEvent } = useEventJoy();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const template = invitationTemplates.find((t) => t.id === selectedTemplate);

  function handleNext() {
    setError(null);
    if (step === 1 && !selectedTemplate) {
      setError('Lütfen bir şablon seçin.');
      return;
    }
    if (step === 2) {
      if (!title.trim() || !type || !date || !time) {
        setError('Başlık, tür, tarih ve saat zorunludur.');
        return;
      }
    }
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    const event = addEvent({
      title,
      type,
      date,
      time,
      location,
      description,
      coverImage: template?.image,
      coverColor: template?.coverColor || 'from-primary to-primary/80'
    });
    router.push(`/eventjoy/etkinlik/${event.id}`);
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-7rem)] max-w-2xl pb-28">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/eventjoy/etkinlikler"
          className="flex size-9 items-center justify-center rounded-full border border-border transition hover:bg-muted"
          aria-label="Geri"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground md:text-2xl">
            Yeni Etkinlik
          </h1>
          <p className="text-sm text-muted-foreground">Adım {step} / 3</p>
        </div>
      </div>

      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {step === 1 && (
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-bold text-foreground">Davetiye şablonu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Etkinliğinize uygun bir görsel seçin.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {invitationTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplate(t.id)}
                className={cn(
                  'overflow-hidden rounded-xl border-2 text-left transition',
                  selectedTemplate === t.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40'
                )}
              >
                <img
                  src={t.image}
                  alt={t.name}
                  className="aspect-square w-full object-cover"
                />
                <p className="px-2 py-2 text-xs font-medium text-foreground">
                  {t.name}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-bold text-foreground">Etkinlik detayları</h2>
          <div className="space-y-2">
            <Label htmlFor="title">Etkinlik başlığı *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Yaz aile buluşması"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Etkinlik türü *</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Seçin</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Tarih *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Saat *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Konum</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Mekan veya adres"
            />
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-bold text-foreground">Açıklama ve özet</h2>
          <div className="space-y-2">
            <Label htmlFor="description">Etkinlik açıklaması</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Misafirlerinize kısa bir not yazın…"
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-semibold text-foreground">{title || '—'}</p>
            <p className="mt-1 text-muted-foreground">
              {type} · {date} {time}
            </p>
            {location && (
              <p className="mt-1 text-muted-foreground">{location}</p>
            )}
          </div>
        </section>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 p-4 backdrop-blur-md lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-2xl gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep(step - 1)}
            >
              Geri
            </Button>
          )}
          <Button type="button" className="flex-1" onClick={handleNext}>
            {step < 3 ? 'Devam Et' : 'Etkinliği Oluştur'}
          </Button>
        </div>
      </div>
    </div>
  );
}
