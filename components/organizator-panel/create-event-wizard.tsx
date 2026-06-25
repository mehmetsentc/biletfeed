'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Globe,
  ImageIcon,
  MapPin,
  Monitor,
  Plus,
  Sparkles,
  Ticket,
  Trash2,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EventWizardStepper } from '@/components/dashboard/event-wizard-stepper';
import {
  WizardFormRow,
  WizardFormSection,
  WizardOptionCards,
  WizardSelect,
  WizardTextarea
} from '@/components/organizator-panel/wizard-form';
import { categories } from '@/lib/data/mock-events';
import {
  SUPPORTED_CITIES,
  DEFAULT_CITY_SLUG,
  type CitySlug
} from '@/lib/location/cities';
import { cn } from '@/lib/utils';

type EventTypeMode = 'single' | 'recurring';
type LocationMode = '' | 'venue' | 'online' | 'hybrid';

interface SessionRow {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

interface TicketCategory {
  id: string;
  name: string;
  description: string;
  price: string;
  capacity: string;
}

function newSession(): SessionRow {
  return {
    id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  };
}

function newTicketCategory(): TicketCategory {
  return {
    id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
    name: '',
    description: '',
    price: '',
    capacity: ''
  };
}

function sessionToIso(session: SessionRow, useEnd = false): string | null {
  const time = useEnd ? session.endTime || session.startTime : session.startTime;
  if (!session.startDate || !time) return null;
  return new Date(`${session.startDate}T${time}:00`).toISOString();
}

const stepHints = [
  'Etkinlik bilgilerini, tarihini ve konumunu girin.',
  'Kapak görseli yükleyerek etkinliğinizi öne çıkarın.',
  'Bilet türü, fiyat ve kontenjan ayarlarını yapın.',
  'Son kontrolü yapıp etkinliğinizi yayınlayın.'
];

export function CreateOrganizerEventWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [citySlug, setCitySlug] = useState(DEFAULT_CITY_SLUG);
  const [eventTypeMode, setEventTypeMode] = useState<EventTypeMode>('single');
  const [sessions, setSessions] = useState<SessionRow[]>([newSession()]);
  const [location, setLocation] = useState<LocationMode>('venue');
  const [venueName, setVenueName] = useState('');
  const [description, setDescription] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const imageFileRef = useRef<File | null>(null);
  const [ticketType, setTicketType] = useState<'free' | 'paid'>('paid');
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>([newTicketCategory()]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFestival = category === 'festival';

  function updateSession(id: string, field: keyof SessionRow, value: string) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function addSession() {
    setSessions((prev) => [...prev, newSession()]);
  }

  function updateTicketCategory(id: string, field: keyof TicketCategory, value: string) {
    setTicketCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  function addTicketCategory() {
    setTicketCategories((prev) => [...prev, newTicketCategory()]);
  }

  function removeTicketCategory(id: string) {
    setTicketCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function publish() {
    setError(null);
    const first = sessions[0];
    const startDate = sessionToIso(first);

    // endDate: festival = endDate field; others = endTime of same day
    let endDate: string | null;
    if (isFestival && first.endDate) {
      const endTime = first.endTime || first.startTime || '23:59';
      endDate = new Date(`${first.endDate}T${endTime}:00`).toISOString();
    } else {
      endDate = sessionToIso(first, true);
    }

    if (!title.trim() || !category || !description.trim()) {
      setError('Lütfen zorunlu alanları doldurun.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Geçerli bir başlangıç tarihi ve saati girin.');
      return;
    }
    const validCategories = ticketCategories.filter((c) => c.name.trim() && c.capacity);
    if (validCategories.length === 0) {
      setError('En az bir bilet kategorisi ekleyin.');
      return;
    }
    if (ticketType === 'paid' && validCategories.some((c) => !c.price)) {
      setError('Ücretli biletler için her kategoriye fiyat girin.');
      return;
    }

    setPublishing(true);
    try {
      let coverImageUrl: string | undefined;
      if (imageFileRef.current) {
        const fd = new FormData();
        fd.append('file', imageFileRef.current);
        const uploadRes = await fetch('/api/organizer/upload-image', {
          method: 'POST',
          body: fd
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          coverImageUrl = uploadData.url;
        }
      }

      const totalCapacity = validCategories.reduce((sum, c) => sum + Number(c.capacity), 0);
      const minPrice = ticketType === 'free' ? 0 : Math.min(...validCategories.map((c) => Number(c.price) || 0));

      const res = await fetch('/api/organizer/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categorySlug: category,
          citySlug,
          venueName: location === 'online' ? 'Online' : venueName.trim() || undefined,
          startDate,
          endDate,
          isFree: ticketType === 'free',
          price: minPrice,
          capacity: totalCapacity,
          coverImage: coverImageUrl,
          status: 'published',
          ticketCategories: validCategories.map((c) => ({
            name: c.name.trim(),
            description: c.description.trim(),
            price: ticketType === 'free' ? 0 : Number(c.price),
            capacity: Number(c.capacity)
          }))
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

  const categoryName =
    categories.find((c) => c.slug === category)?.name ?? 'Kategori seçilmedi';
  const cityName =
    SUPPORTED_CITIES.find((c) => c.slug === citySlug)?.name ?? citySlug;

  return (
    <div className="mx-auto max-w-4xl pb-28">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative border-b border-border bg-gradient-to-br from-primary/10 via-card to-card px-5 py-6 md:px-8 md:py-8">
          <div className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Link
                href="/organizator-panel/etkinlikler"
                className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background/80 transition-colors hover:bg-muted"
                aria-label="Geri dön"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Organizatör Panel
                  </span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Yeni Etkinlik Oluştur
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stepHints[step - 1]}
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Adım {step} / 4
            </span>
          </div>
        </div>

        <div className="border-b border-border bg-muted/20 px-5 py-6 md:px-8">
          <EventWizardStepper current={step} />
        </div>

        <div className="space-y-6 p-5 md:p-8">
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <WizardFormSection
                title="Etkinlik Detayları"
                description="Temel bilgileri doldurarak başlayın."
                icon={FileText}
              >
                <WizardFormRow label="Etkinlik Başlığı" required>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Etkinliğinizin adını girin"
                    className="h-11 rounded-lg"
                  />
                </WizardFormRow>
                <WizardFormRow label="Etkinlik Kategorisi" required>
                  <WizardSelect
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Lütfen birini seçin</option>
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </WizardSelect>
                </WizardFormRow>
                <WizardFormRow label="Şehir" required>
                  <WizardSelect
                    value={citySlug}
                    onChange={(e) => {
                      const slug = e.target.value as CitySlug;
                      if (SUPPORTED_CITIES.some((c) => c.slug === slug)) {
                        setCitySlug(slug);
                      }
                    }}
                  >
                    {SUPPORTED_CITIES.map((city) => (
                      <option key={city.slug} value={city.slug}>
                        {city.name}
                      </option>
                    ))}
                  </WizardSelect>
                </WizardFormRow>
              </WizardFormSection>

              <WizardFormSection
                title="Tarih & Saat"
                description="Etkinliğinizin ne zaman gerçekleşeceğini belirleyin."
                icon={Calendar}
              >
                <WizardFormRow label="Etkinlik Türü" required>
                  <WizardOptionCards
                    value={eventTypeMode}
                    onChange={setEventTypeMode}
                    options={[
                      {
                        id: 'single',
                        title: 'Tek Etkinlik',
                        description: 'Tek tarih ve seans'
                      },
                      {
                        id: 'recurring',
                        title: 'Tekrarlayan',
                        description: 'Birden fazla seans'
                      }
                    ]}
                  />
                </WizardFormRow>

                {isFestival && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                    🎪 Festival seçildi — birden fazla gün sürebilir. Başlangıç ve bitiş tarihini ayrı girin.
                  </div>
                )}

                <div className="border-t border-border/60 py-5">
                  <p className="mb-4 text-sm font-semibold text-foreground">
                    Seans(lar)<span className="text-destructive">*</span>
                  </p>
                  <div className="space-y-3">
                    {sessions.map((session, index) => (
                      <div
                        key={session.id}
                        className="rounded-xl border border-border bg-muted/20 p-4"
                      >
                        {sessions.length > 1 && (
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Seans {index + 1}
                          </p>
                        )}
                        <div className="grid gap-3 sm:grid-cols-2">
                          {/* Başlangıç Tarihi */}
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                              Başlangıç Tarihi<span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/70" />
                              <Input
                                type="date"
                                value={session.startDate}
                                onChange={(e) => updateSession(session.id, 'startDate', e.target.value)}
                                className="h-11 rounded-lg pl-10"
                              />
                            </div>
                          </div>
                          {/* Bitiş Tarihi */}
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                              Bitiş Tarihi{isFestival && <span className="text-destructive">*</span>}
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/70" />
                              <Input
                                type="date"
                                value={session.endDate}
                                min={session.startDate || undefined}
                                onChange={(e) => updateSession(session.id, 'endDate', e.target.value)}
                                className="h-11 rounded-lg pl-10"
                              />
                            </div>
                          </div>
                          {/* Başlangıç Saati */}
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                              Başlangıç Saati<span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/70" />
                              <Input
                                type="time"
                                value={session.startTime}
                                onChange={(e) => updateSession(session.id, 'startTime', e.target.value)}
                                className="h-11 rounded-lg pl-10"
                              />
                            </div>
                          </div>
                          {/* Bitiş Saati */}
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                              Bitiş Saati
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/70" />
                              <Input
                                type="time"
                                value={session.endTime}
                                onChange={(e) => updateSession(session.id, 'endTime', e.target.value)}
                                className="h-11 rounded-lg pl-10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {eventTypeMode === 'recurring' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSession}
                      className="mt-3 gap-1.5"
                    >
                      <Plus className="size-4" />
                      Seans Ekle
                    </Button>
                  )}
                </div>
              </WizardFormSection>

              <WizardFormSection
                title="Konum"
                description="Etkinliğin nerede gerçekleşeceğini seçin."
                icon={MapPin}
              >
                <WizardFormRow label="Etkinlik formatı" required>
                  <WizardOptionCards
                    value={location}
                    onChange={(v) => setLocation(v as LocationMode)}
                    options={[
                      {
                        id: 'venue',
                        title: 'Fiziksel mekan',
                        description: 'Salon, açık hava, stadyum',
                        icon: MapPin
                      },
                      {
                        id: 'online',
                        title: 'Online',
                        description: 'Canlı yayın veya webinar',
                        icon: Monitor
                      },
                      {
                        id: 'hybrid',
                        title: 'Hibrit',
                        description: 'Hem fiziksel hem online',
                        icon: Globe
                      }
                    ]}
                  />
                </WizardFormRow>
                {location !== 'online' && (
                  <WizardFormRow label="Mekan adı">
                    <Input
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="Örn: Volkswagen Arena"
                      className="h-11 rounded-lg"
                    />
                  </WizardFormRow>
                )}
              </WizardFormSection>

              <WizardFormSection
                title="Açıklama"
                description="Katılımcılara etkinliğinizi tanıtın."
                icon={FileText}
              >
                <WizardFormRow label="Etkinlik Açıklaması" required alignTop>
                  <WizardTextarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Etkinliğinizin özel yanlarını ve diğer önemli detayları açıklayın."
                  />
                </WizardFormRow>
              </WizardFormSection>
            </div>
          )}

          {step === 2 && (
            <WizardFormSection
              title="Etkinlik Görseli"
              description="Kapak görseli etkinliğinizin keşfedilme oranını artırır."
              icon={ImageIcon}
            >
              <div className="py-5">
                <label
                  className={cn(
                    'flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all',
                    previewImage
                      ? 'border-primary/40 bg-primary/5 p-2'
                      : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5'
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
                      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Upload className="size-6" />
                      </span>
                      <p className="mt-4 font-semibold text-foreground">
                        Kapak görseli yükleyin
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Önerilen: 1920×1080 px · JPG veya PNG
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        imageFileRef.current = file;
                        setPreviewImage(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              </div>
            </WizardFormSection>
          )}

          {step === 3 && (
            <WizardFormSection
              title="Bilet Kategorileri"
              description="Her kategori için ad, fiyat, kontenjan ve açıklama belirleyin."
              icon={Ticket}
            >
              <WizardFormRow label="Bilet türü" required>
                <WizardOptionCards
                  value={ticketType}
                  onChange={setTicketType}
                  options={[
                    { id: 'free', title: 'Ücretsiz', description: 'Kayıt ile giriş' },
                    { id: 'paid', title: 'Ücretli', description: 'Bilet satışı açık' }
                  ]}
                />
              </WizardFormRow>

              <div className="space-y-4 pt-2">
                {ticketCategories.map((cat, index) => (
                  <div key={cat.id} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        Kategori {index + 1}
                      </p>
                      {ticketCategories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicketCategory(cat.id)}
                          className="flex items-center gap-1 text-xs text-destructive hover:opacity-80"
                        >
                          <Trash2 className="size-3.5" />
                          Kaldır
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Kategori Adı<span className="text-destructive">*</span>
                        </label>
                        <Input
                          value={cat.name}
                          onChange={(e) => updateTicketCategory(cat.id, 'name', e.target.value)}
                          placeholder="Örn: Sahne Önü, Backstage, VIP, Genel Giriş"
                          className="h-11 rounded-lg"
                        />
                      </div>
                      {ticketType === 'paid' && (
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Fiyat (₺)<span className="text-destructive">*</span>
                          </label>
                          <Input
                            type="number"
                            value={cat.price}
                            onChange={(e) => updateTicketCategory(cat.id, 'price', e.target.value)}
                            placeholder="250"
                            className="h-11 rounded-lg"
                          />
                        </div>
                      )}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Kontenjan<span className="text-destructive">*</span>
                        </label>
                        <Input
                          type="number"
                          value={cat.capacity}
                          onChange={(e) => updateTicketCategory(cat.id, 'capacity', e.target.value)}
                          placeholder="100"
                          className="h-11 rounded-lg"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Açıklama
                        </label>
                        <Input
                          value={cat.description}
                          onChange={(e) => updateTicketCategory(cat.id, 'description', e.target.value)}
                          placeholder="Örn: Sahne önü, ayakta alan. Sınırlı sayıda."
                          className="h-11 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTicketCategory}
                  className="gap-1.5"
                >
                  <Plus className="size-4" />
                  Kategori Ekle
                </Button>

                {ticketCategories.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Toplam kontenjan:{' '}
                    <strong>
                      {ticketCategories.reduce((s, c) => s + (Number(c.capacity) || 0), 0)}
                    </strong>{' '}
                    bilet
                  </p>
                )}
              </div>
            </WizardFormSection>
          )}

          {step === 4 && (
            <WizardFormSection
              title="Önizleme"
              description="Yayınlamadan önce son kontrolü yapın."
              icon={Sparkles}
            >
              <div className="space-y-5 py-5">
                {previewImage && (
                  <div className="relative aspect-video overflow-hidden rounded-xl border border-border">
                    <Image
                      src={previewImage}
                      alt="Kapak"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="rounded-xl border border-border bg-muted/20 p-5">
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {categoryName}
                  </span>
                  <h3 className="mt-3 text-xl font-bold text-foreground">
                    {title || 'Etkinlik Başlığı'}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {cityName}
                    {venueName ? ` · ${venueName}` : ''}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {description || 'Açıklama eklenmedi.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {ticketCategories.filter((c) => c.name).map((c) => (
                      <span key={c.id} className="rounded-lg bg-background px-3 py-1.5 text-sm font-medium ring-1 ring-border">
                        {c.name}
                        {ticketType === 'paid' && c.price ? ` · ${c.price} ₺` : ticketType === 'free' ? ' · Ücretsiz' : ''}
                        {c.capacity ? ` · ${c.capacity} kişi` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </WizardFormSection>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={publishing}
              className="min-w-[100px]"
            >
              Geri
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}
          <Button
            onClick={() => (step < 4 ? setStep(step + 1) : publish())}
            className="min-w-[160px] bg-primary px-8 text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
            disabled={publishing}
          >
            {publishing
              ? 'Yayınlanıyor…'
              : step < 4
                ? 'Kaydet ve Devam Et'
                : 'Etkinliği Yayınla'}
          </Button>
        </div>
      </div>
    </div>
  );
}
