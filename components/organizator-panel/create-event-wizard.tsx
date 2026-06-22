'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EventWizardStepper } from '@/components/dashboard/event-wizard-stepper';
import { FormRow, FormSection } from '@/components/dashboard/form-row';
import { categories } from '@/lib/data/mock-events';
import { SUPPORTED_CITIES, DEFAULT_CITY_SLUG, type CitySlug } from '@/lib/location/cities';
import { cn } from '@/lib/utils';

type EventTypeMode = 'single' | 'recurring';

interface SessionRow {
  id: string;
  startDate: string;
  startTime: string;
  endTime: string;
}

function newSession(): SessionRow {
  return {
    id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
    startDate: '',
    startTime: '',
    endTime: ''
  };
}

function sessionToIso(session: SessionRow, useEnd = false): string | null {
  const time = useEnd ? session.endTime || session.startTime : session.startTime;
  if (!session.startDate || !time) return null;
  return new Date(`${session.startDate}T${time}:00`).toISOString();
}

export function CreateOrganizerEventWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [citySlug, setCitySlug] = useState(DEFAULT_CITY_SLUG);
  const [eventTypeMode, setEventTypeMode] = useState<EventTypeMode>('single');
  const [sessions, setSessions] = useState<SessionRow[]>([newSession()]);
  const [location, setLocation] = useState('');
  const [venueName, setVenueName] = useState('');
  const [description, setDescription] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [ticketType, setTicketType] = useState<'free' | 'paid'>('paid');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateSession(id: string, field: keyof SessionRow, value: string) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function addSession() {
    setSessions((prev) => [...prev, newSession()]);
  }

  async function publish() {
    setError(null);
    const first = sessions[0];
    const startDate = sessionToIso(first);
    const endDate = sessionToIso(first, true);

    if (!title.trim() || !category || !description.trim() || !capacity) {
      setError('Lütfen zorunlu alanları doldurun.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Geçerli bir başlangıç tarihi ve saati girin.');
      return;
    }
    if (ticketType === 'paid' && !price) {
      setError('Ücretli etkinlik için fiyat girin.');
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch('/api/organizer/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categorySlug: category,
          citySlug,
          venueName:
            location === 'online'
              ? 'Online'
              : venueName.trim() || undefined,
          startDate,
          endDate,
          isFree: ticketType === 'free',
          price: ticketType === 'paid' ? Number(price) : 0,
          capacity: Number(capacity),
          status: 'published'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yayınlama başarısız');

      router.push('/organizator-panel/etkinlikler');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
      setPublishing(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/organizator-panel/etkinlikler"
          className="flex size-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted"
          aria-label="Geri dön"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-2xl font-bold md:text-3xl">Yeni Etkinlik Oluştur</h1>
      </div>

      <EventWizardStepper current={step} className="mb-10" />

      {error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {step === 1 && (
        <div className="space-y-8">
          <FormSection title="Etkinlik Detayları">
            <FormRow label="Etkinlik Başlığı" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Etkinliğinizin adını girin"
              />
            </FormRow>
            <FormRow label="Etkinlik Kategorisi" required>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Lütfen birini seçin</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Şehir" required>
              <select
                value={citySlug}
                onChange={(e) => {
                  const slug = e.target.value as CitySlug;
                  if (SUPPORTED_CITIES.some((c) => c.slug === slug)) {
                    setCitySlug(slug);
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {SUPPORTED_CITIES.map((city) => (
                  <option key={city.slug} value={city.slug}>
                    {city.name}
                  </option>
                ))}
              </select>
            </FormRow>
          </FormSection>

          <FormSection title="Tarih & Saat">
            <FormRow label="Etkinlik Türü" required>
              <div className="flex flex-wrap gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="eventTypeMode"
                    checked={eventTypeMode === 'single'}
                    onChange={() => setEventTypeMode('single')}
                    className="accent-[#1a1d23]"
                  />
                  Tek Etkinlik
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="eventTypeMode"
                    checked={eventTypeMode === 'recurring'}
                    onChange={() => setEventTypeMode('recurring')}
                    className="accent-[#1a1d23]"
                  />
                  Tekrarlayan Etkinlik
                </label>
              </div>
            </FormRow>

            <div className="border-b border-border px-4 py-6 md:px-6">
              <p className="mb-4 text-sm font-medium">
                Seans(lar)<span className="text-destructive">*</span>
              </p>
              <div className="space-y-4">
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                  >
                    <div>
                      {index === 0 && (
                        <label className="mb-1.5 block text-xs text-muted-foreground">
                          Başlangıç Tarihi<span className="text-destructive">*</span>
                        </label>
                      )}
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="date"
                          value={session.startDate}
                          onChange={(e) =>
                            updateSession(session.id, 'startDate', e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      {index === 0 && (
                        <label className="mb-1.5 block text-xs text-muted-foreground">
                          Başlangıç Saati<span className="text-destructive">*</span>
                        </label>
                      )}
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="time"
                          value={session.startTime}
                          onChange={(e) =>
                            updateSession(session.id, 'startTime', e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      {index === 0 && (
                        <label className="mb-1.5 block text-xs text-muted-foreground">
                          Bitiş Saati
                        </label>
                      )}
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="time"
                          value={session.endTime}
                          onChange={(e) =>
                            updateSession(session.id, 'endTime', e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                    {index === sessions.length - 1 && eventTypeMode === 'recurring' && (
                      <div className={cn('flex items-end', index === 0 && 'pb-0.5')}>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={addSession}
                          aria-label="Seans ekle"
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </FormSection>

          <FormSection title="Konum">
            <FormRow label="Etkinliğiniz nerede gerçekleşecek?" required>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Lütfen birini seçin</option>
                <option value="venue">Fiziksel mekan</option>
                <option value="online">Online etkinlik</option>
                <option value="hybrid">Hibrit (fiziksel + online)</option>
              </select>
            </FormRow>
            {location !== 'online' && location !== '' && (
              <FormRow label="Mekan adı">
                <Input
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="Örn: Volkswagen Arena"
                />
              </FormRow>
            )}
          </FormSection>

          <FormSection title="Ek Bilgiler">
            <FormRow label="Etkinlik Açıklaması" required alignTop>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Etkinliğinizin özel yanlarını ve diğer önemli detayları açıklayın."
                className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </FormRow>
          </FormSection>
        </div>
      )}

      {step === 2 && (
        <FormSection title="Etkinlik Görseli">
          <div className="p-6">
            <label
              className={cn(
                'flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 p-8 transition-colors hover:border-primary/40',
                previewImage && 'border-solid p-0'
              )}
            >
              {previewImage ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                  <Image
                    src={previewImage}
                    alt="Kapak önizleme"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <>
                  <p className="font-medium">Kapak görseli yükleyin</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Önerilen boyut: 1920×1080 px (yükleme yakında)
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPreviewImage(URL.createObjectURL(file));
                }}
              />
            </label>
          </div>
        </FormSection>
      )}

      {step === 3 && (
        <FormSection title="Bilet Ayarları">
          <FormRow label="Bilet türü" required>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { id: 'free' as const, title: 'Ücretsiz', desc: 'Kayıt ile giriş' },
                  { id: 'paid' as const, title: 'Ücretli', desc: 'Bilet satışı açık' }
                ] as const
              ).map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setTicketType(type.id)}
                  className={cn(
                    'rounded-lg border p-4 text-left transition-colors',
                    ticketType === type.id
                      ? 'border-[#1a1d23] bg-[#1a1d23]/5'
                      : 'hover:border-primary/40'
                  )}
                >
                  <p className="font-semibold">{type.title}</p>
                  <p className="text-sm text-muted-foreground">{type.desc}</p>
                </button>
              ))}
            </div>
          </FormRow>
          {ticketType === 'paid' && (
            <FormRow label="Bilet fiyatı (₺)" required>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="250"
              />
            </FormRow>
          )}
          <FormRow label="Kontenjan" required>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="500"
            />
          </FormRow>
        </FormSection>
      )}

      {step === 4 && (
        <FormSection title="Önizleme">
          <div className="space-y-4 p-6">
            {previewImage && (
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <Image src={previewImage} alt="Kapak" fill className="object-cover" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold">{title || 'Etkinlik Başlığı'}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {categories.find((c) => c.slug === category)?.name ?? 'Kategori seçilmedi'}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {description || 'Açıklama eklenmedi.'}
            </p>
            <p className="text-sm font-medium">
              {ticketType === 'free'
                ? 'Ücretsiz etkinlik'
                : `Bilet: ${price || '—'} ₺ · Kontenjan: ${capacity || '—'}`}
            </p>
          </div>
        </FormSection>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={publishing}>
              Geri
            </Button>
          ) : (
            <div />
          )}
          <Button
            onClick={() => (step < 4 ? setStep(step + 1) : publish())}
            className="bg-[#1a1d23] px-8 text-white hover:bg-[#1a1d23]/90"
            disabled={publishing}
          >
            {publishing
              ? 'Yayınlanıyor...'
              : step < 4
                ? 'Kaydet ve Devam Et'
                : 'Etkinliği Yayınla'}
          </Button>
        </div>
      </div>
    </div>
  );
}
