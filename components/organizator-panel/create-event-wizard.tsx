'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  ImageIcon,
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
  WizardSelect
} from '@/components/organizator-panel/wizard-form';
import { categories } from '@/lib/data/mock-events';
import {
  SUPPORTED_CITIES,
  DEFAULT_CITY_SLUG,
  type CitySlug
} from '@/lib/location/cities';
import type { EventWizardInitialData } from '@/lib/organizator/event-wizard-data';
import { EVENT_WIZARD_STEPS } from '@/lib/organizator/event-wizard-constants';
import { WizardStepVenue } from '@/components/organizator-panel/event-wizard/wizard-step-venue';
import { WizardStepContent } from '@/components/organizator-panel/event-wizard/wizard-step-content';
import { WizardStepParticipation } from '@/components/organizator-panel/event-wizard/wizard-step-participation';
import { WizardStepPublish } from '@/components/organizator-panel/event-wizard/wizard-step-publish';
import type {
  AttendeeQuestionRow,
  PerformerRow
} from '@/components/organizator-panel/event-wizard/types';
import { cn } from '@/lib/utils';
import {
  clearEventWizardDraft,
  loadEventWizardDraft,
  saveEventWizardDraft
} from '@/lib/organizator/event-wizard-draft';

const TOTAL_STEPS = EVENT_WIZARD_STEPS.length;

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
  ticketTypeId?: string;
  name: string;
  description: string;
  price: string;
  capacity: string;
  sold: number;
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
    capacity: '',
    sold: 0
  };
}

function initialTicketCategory(data: EventWizardInitialData['ticketCategories'][number]): TicketCategory {
  return {
    id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
    ticketTypeId: data.ticketTypeId,
    name: data.name,
    description: data.description,
    price: data.price,
    capacity: data.capacity,
    sold: data.sold
  };
}

function initialSession(data: EventWizardInitialData['sessions'][number]): SessionRow {
  return {
    id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime
  };
}

function sessionToIso(session: SessionRow, useEnd = false): string | null {
  const time = useEnd ? session.endTime || session.startTime : session.startTime;
  if (!session.startDate || !time) return null;
  return new Date(`${session.startDate}T${time}:00`).toISOString();
}

const createStepHints = [
  'Etkinlik adı, kategori ve tarih bilgilerini girin.',
  'Mekan, adres ve etiketleri belirleyin.',
  'Katılımcıları ve etkinlik açıklamasını ekleyin.',
  'Kapak görseli ve bilet kategorilerini ayarlayın.',
  'Katılımcı soruları ve gizlilik seçeneklerini yapılandırın.',
  'Son kontrolü yapın; taslak kaydedin veya yayınlayın.'
];

const editStepHints = [
  'Etkinlik adı, kategori ve tarih bilgilerini güncelleyin.',
  'Mekan, adres ve etiketleri düzenleyin.',
  'Katılımcıları ve açıklamayı güncelleyin.',
  'Kapak görseli ve bilet kategorilerini düzenleyin.',
  'Katılımcı soruları ve gizlilik ayarlarını güncelleyin.',
  'Değişiklikleri kaydetmeden önce son kontrolü yapın.'
];

interface CreateOrganizerEventWizardProps {
  mode?: 'create' | 'edit';
  eventId?: string;
  initialData?: EventWizardInitialData;
}

export function CreateOrganizerEventWizard({
  mode = 'create',
  eventId,
  initialData
}: CreateOrganizerEventWizardProps) {
  const isEdit = mode === 'edit';
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [citySlug, setCitySlug] = useState<CitySlug>(
    (initialData?.citySlug as CitySlug) ?? DEFAULT_CITY_SLUG
  );
  const [eventTypeMode, setEventTypeMode] = useState<EventTypeMode>('single');
  const [sessions, setSessions] = useState<SessionRow[]>(
    initialData?.sessions.map(initialSession) ?? [newSession()]
  );
  const [location, setLocation] = useState<LocationMode>(initialData?.location ?? 'venue');
  const [venueName, setVenueName] = useState(initialData?.venueName ?? '');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueDetail, setVenueDetail] = useState('');
  const [onlineUrl, setOnlineUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [performers, setPerformers] = useState<PerformerRow[]>([]);
  const [attendeeQuestions, setAttendeeQuestions] = useState<AttendeeQuestionRow[]>([]);
  const [preventQuestionCopy, setPreventQuestionCopy] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');
  const [hiddenFromSearch, setHiddenFromSearch] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [previewImage, setPreviewImage] = useState<string | null>(initialData?.coverImage ?? null);
  const imageFileRef = useRef<File | null>(null);
  const [ticketType, setTicketType] = useState<'free' | 'paid'>(initialData?.ticketType ?? 'paid');
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>(
    initialData?.ticketCategories.length
      ? initialData.ticketCategories.map(initialTicketCategory)
      : [newTicketCategory()]
  );
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    if (isEdit || draftRestored) return;
    const draft = loadEventWizardDraft();
    if (!draft) {
      setDraftRestored(true);
      return;
    }
    setStep(draft.step);
    setTitle(draft.title);
    setCategory(draft.category);
    setCitySlug(draft.citySlug);
    setEventTypeMode(draft.eventTypeMode);
    setSessions(draft.sessions);
    setLocation(draft.location);
    setVenueName(draft.venueName);
    setVenueAddress(draft.venueAddress);
    setVenueDetail(draft.venueDetail);
    setOnlineUrl(draft.onlineUrl);
    setTags(draft.tags);
    setPerformers(draft.performers);
    setAttendeeQuestions(draft.attendeeQuestions);
    setPreventQuestionCopy(draft.preventQuestionCopy);
    setAccessPassword(draft.accessPassword);
    setHiddenFromSearch(draft.hiddenFromSearch);
    setTermsAccepted(draft.termsAccepted);
    setDescription(draft.description);
    setTicketType(draft.ticketType);
    setTicketCategories(
      draft.ticketCategories.map((c) => ({ ...c, sold: 0 }))
    );
    if (draft.previewImageUrl?.startsWith('http')) {
      setPreviewImage(draft.previewImageUrl);
    }
    setDraftRestored(true);
  }, [isEdit, draftRestored]);

  useEffect(() => {
    if (isEdit || !draftRestored) return;
    const timer = window.setTimeout(() => {
      saveEventWizardDraft({
        step,
        title,
        category,
        citySlug,
        eventTypeMode,
        sessions,
        location,
        venueName,
        venueAddress,
        venueDetail,
        onlineUrl,
        tags,
        performers,
        description,
        ticketType,
        ticketCategories: ticketCategories.map(({ sold: _sold, ...c }) => c),
        attendeeQuestions,
        preventQuestionCopy,
        accessPassword,
        hiddenFromSearch,
        termsAccepted,
        previewImageUrl: previewImage?.startsWith('http') ? previewImage : null
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [
    isEdit,
    draftRestored,
    step,
    title,
    category,
    citySlug,
    eventTypeMode,
    sessions,
    location,
    venueName,
    venueAddress,
    venueDetail,
    onlineUrl,
    tags,
    performers,
    description,
    ticketType,
    ticketCategories,
    attendeeQuestions,
    preventQuestionCopy,
    accessPassword,
    hiddenFromSearch,
    termsAccepted,
    previewImage
  ]);

  const stepHints = isEdit ? editStepHints : createStepHints;
  const backHref = isEdit && eventId
    ? `/organizator-panel/etkinlik/${eventId}`
    : '/organizator-panel/etkinlikler';

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
    const target = ticketCategories.find((c) => c.id === id);
    if (target && target.sold > 0) {
      setError('Satışı yapılmış bilet kategorisi silinemez.');
      return;
    }
    setTicketCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function saveEvent(targetStatus: 'draft' | 'published') {
    setError(null);
    const first = sessions[0];
    const startDate = sessionToIso(first);

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
    if (location !== 'online' && !venueName.trim()) {
      setError('Lütfen etkinlik mekanını seçin veya girin.');
      return;
    }
    if (!isEdit && targetStatus === 'published' && !termsAccepted) {
      setError('Yayınlamak için organizatör kullanıcı sözleşmesini kabul etmelisiniz.');
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
    const belowSold = validCategories.find(
      (c) => c.sold > 0 && Number(c.capacity) < c.sold
    );
    if (belowSold) {
      setError(`"${belowSold.name}" kontenjanı satılan bilet sayısından az olamaz.`);
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
      } else if (isEdit && previewImage?.startsWith('http')) {
        coverImageUrl = previewImage;
      }

      const totalCapacity = validCategories.reduce((sum, c) => sum + Number(c.capacity), 0);
      const minPrice = ticketType === 'free' ? 0 : Math.min(...validCategories.map((c) => Number(c.price) || 0));
      const isOnline = location === 'online' || location === 'hybrid';

      const payload = {
        title: title.trim(),
        description: description.trim(),
        categorySlug: category,
        citySlug,
        venueName: location === 'online' ? 'Online' : venueName.trim() || undefined,
        venueAddress: venueAddress.trim() || undefined,
        venueDetail: venueDetail.trim() || undefined,
        startDate,
        endDate,
        isFree: ticketType === 'free',
        price: minPrice,
        capacity: totalCapacity,
        coverImage: coverImageUrl,
        isOnline,
        onlineUrl: onlineUrl.trim() || undefined,
        tags,
        performers: performers.map((p) => ({ name: p.name, type: p.type })),
        attendeeQuestions: attendeeQuestions.map((q) => ({
          question: q.question,
          required: q.required
        })),
        preventQuestionCopy,
        accessPassword: accessPassword.trim() || undefined,
        hiddenFromSearch,
        ticketCategories: validCategories.map((c) => ({
          ...(c.ticketTypeId ? { id: c.ticketTypeId } : {}),
          name: c.name.trim(),
          description: c.description.trim(),
          price: ticketType === 'free' ? 0 : Number(c.price),
          capacity: Number(c.capacity)
        })),
        status: targetStatus,
        ...(targetStatus === 'published' ? { organizerTermsAccepted: true } : {})
      };

      const res = await fetch(
        isEdit && eventId ? `/api/organizer/events/${eventId}` : '/api/organizer/events',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEdit ? 'Kayıt başarısız' : 'Kayıt başarısız'));

      if (!isEdit) clearEventWizardDraft();

      router.push(isEdit && eventId ? `/organizator-panel/etkinlik/${eventId}` : '/organizator-panel/etkinlikler');
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
                href={backHref}
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
                  {isEdit ? 'Etkinliği Düzenle' : 'Yeni Etkinlik Oluştur'}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stepHints[step - 1]}
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Adım {step} / {TOTAL_STEPS}
            </span>
          </div>
        </div>

        <div className="border-b border-border bg-muted/20 px-5 py-6 md:px-8">
          <EventWizardStepper current={step} steps={[...EVENT_WIZARD_STEPS]} />
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
            </div>
          )}

          {step === 2 && (
            <WizardStepVenue
              location={location}
              onLocationChange={setLocation}
              venueName={venueName}
              onVenueNameChange={setVenueName}
              venueAddress={venueAddress}
              onVenueAddressChange={setVenueAddress}
              venueDetail={venueDetail}
              onVenueDetailChange={setVenueDetail}
              onlineUrl={onlineUrl}
              onOnlineUrlChange={setOnlineUrl}
              tags={tags}
              onTagsChange={setTags}
            />
          )}

          {step === 3 && (
            <WizardStepContent
              description={description}
              onDescriptionChange={setDescription}
              performers={performers}
              onPerformersChange={setPerformers}
            />
          )}

          {step === 4 && (
            <div className="space-y-6">
              <WizardFormSection
                title="Etkinlik Görseli"
                description="Kapak görseli etkinliğinizin keşfedilme oranını artırır. Tavsiye: 1920×1080 px, max. 10 MB."
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
                      {ticketCategories.length > 1 && cat.sold === 0 && (
                        <button
                          type="button"
                          onClick={() => removeTicketCategory(cat.id)}
                          className="flex items-center gap-1 text-xs text-destructive hover:opacity-80"
                        >
                          <Trash2 className="size-3.5" />
                          Kaldır
                        </button>
                      )}
                      {cat.sold > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {cat.sold} bilet satıldı
                        </span>
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
            </div>
          )}

          {step === 5 && (
            <WizardStepParticipation
              attendeeQuestions={attendeeQuestions}
              onAttendeeQuestionsChange={setAttendeeQuestions}
              preventQuestionCopy={preventQuestionCopy}
              onPreventQuestionCopyChange={setPreventQuestionCopy}
              accessPassword={accessPassword}
              onAccessPasswordChange={setAccessPassword}
              hiddenFromSearch={hiddenFromSearch}
              onHiddenFromSearchChange={setHiddenFromSearch}
            />
          )}

          {step === 6 && (
            <WizardStepPublish
              isEdit={isEdit}
              previewImage={previewImage}
              title={title}
              categoryName={categoryName}
              cityName={cityName}
              venueName={location === 'online' ? 'Online' : venueName}
              description={description}
              tags={tags}
              performers={performers}
              attendeeQuestions={attendeeQuestions}
              ticketSummary={ticketCategories
                .filter((c) => c.name)
                .map((c) => ({
                  name: c.name,
                  priceLabel:
                    ticketType === 'paid' && c.price
                      ? `${c.price} ₺`
                      : ticketType === 'free'
                        ? 'Ücretsiz'
                        : '',
                  capacity: c.capacity ? `${c.capacity} kişi` : ''
                }))}
              termsAccepted={termsAccepted}
              onTermsAcceptedChange={setTermsAccepted}
            />
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

          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="min-w-[160px] bg-primary px-8 text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
              disabled={publishing}
            >
              Kaydet ve Devam Et
            </Button>
          ) : isEdit ? (
            <Button
              onClick={() => saveEvent('published')}
              className="min-w-[160px] bg-primary px-8 text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
              disabled={publishing}
            >
              {publishing ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
            </Button>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => saveEvent('draft')}
                disabled={publishing}
                className="min-w-[140px]"
              >
                {publishing ? 'Kaydediliyor…' : 'Taslak Olarak Kaydet'}
              </Button>
              <Button
                onClick={() => saveEvent('published')}
                disabled={publishing || !termsAccepted}
                className="min-w-[140px] bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
              >
                {publishing ? 'Yayınlanıyor…' : 'Etkinliği Yayınla'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
