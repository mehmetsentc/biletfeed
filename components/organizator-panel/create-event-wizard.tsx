'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { EventStatus } from '@prisma/client';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  ImageIcon,
  Plus,
  Sparkles,
  Ticket,
  Trash2
} from 'lucide-react';
import { CoverImagePicker } from '@/components/organizator-panel/cover-image-picker';
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
import type { EventWizardInitialData } from '@/lib/organizator/event-wizard-data';
import { EVENT_WIZARD_STEPS } from '@/lib/organizator/event-wizard-constants';
import { WizardStepVenue } from '@/components/organizator-panel/event-wizard/wizard-step-venue';
import { WizardStepContent } from '@/components/organizator-panel/event-wizard/wizard-step-content';
import { WizardStepParticipation } from '@/components/organizator-panel/event-wizard/wizard-step-participation';
import { WizardStepPublish } from '@/components/organizator-panel/event-wizard/wizard-step-publish';
import {
  WizardStepRules,
  type EventRuleSetState
} from '@/components/organizator-panel/event-wizard/wizard-step-rules';
import type {
  AttendeeQuestionRow,
  PerformerRow
} from '@/components/organizator-panel/event-wizard/types';
import { cn } from '@/lib/utils';
import {
  clearEventWizardDraft,
  loadEventWizardDraft,
  saveEventWizardDraft,
  type EventWizardDraft
} from '@/lib/organizator/event-wizard-draft';

const TOTAL_STEPS = EVENT_WIZARD_STEPS.length;

type EventTypeMode = 'single' | 'recurring';
type LocationMode = '' | 'venue' | 'online' | 'hybrid';

interface SessionRow {
  id: string;
  eventId?: string;
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
  seatsPerUnit: string;
  sold: number;
  showLowStockBadge: boolean;
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
    seatsPerUnit: '1',
    sold: 0,
    showLowStockBadge: false
  };
}

function isValidTicketCategory(c: TicketCategory): boolean {
  const name = c.name.trim();
  const capacityRaw = String(c.capacity ?? '').trim();
  if (!name || !capacityRaw) return false;
  if (name.length > 200) return false;
  if ((c.description ?? '').trim().length > 2000) return false;
  const capacityNum = Number(capacityRaw);
  return Number.isFinite(capacityNum) && capacityNum > 0;
}

function ticketCategoryValidationError(categories: TicketCategory[]): string | null {
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i]!;
    const label = `Kategori ${i + 1}`;
    const name = c.name.trim();
    if (!name) {
      return `${label}: "Kategori Adı" boş bırakılamaz.`;
    }
    if (name.length > 200) {
      return `${label}: "Kategori Adı" en fazla 200 karakter olabilir (şu an ${name.length}).`;
    }
    if ((c.description ?? '').trim().length > 500) {
      return `${label}: Açıklama en fazla 2000 karakter olabilir.`;
    }
    const capacityNum = Number(String(c.capacity ?? '').trim());
    if (!Number.isFinite(capacityNum) || capacityNum < 1) {
      return `${label}: Geçerli bir kontenjan girin.`;
    }
  }
  return null;
}

function ticketCategoriesFromDraft(
  raw: EventWizardDraft['ticketCategories'] | undefined
): TicketCategory[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [newTicketCategory()];
  }
  return raw.map((c) => ({
    id: c.id || String(Date.now()) + Math.random().toString(36).slice(2, 7),
    name: c.name ?? '',
    description: c.description ?? '',
    price: c.price != null ? String(c.price) : '',
    capacity: c.capacity != null ? String(c.capacity) : '',
    seatsPerUnit:
      'seatsPerUnit' in c && c.seatsPerUnit != null
        ? String(c.seatsPerUnit)
        : '1',
    sold: 0,
    showLowStockBadge: c.showLowStockBadge ?? false
  }));
}

function initialTicketCategory(data: EventWizardInitialData['ticketCategories'][number]): TicketCategory {
  return {
    id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
    ticketTypeId: data.ticketTypeId,
    name: data.name,
    description: data.description,
    price: data.price,
    capacity: data.capacity,
    seatsPerUnit: data.seatsPerUnit ?? '1',
    sold: data.sold,
    showLowStockBadge: data.showLowStockBadge
  };
}

function initialSession(data: EventWizardInitialData['sessions'][number]): SessionRow {
  return {
    id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
    eventId: data.eventId,
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

/** "HH:MM" → dakika cinsinden değer */
function timeToMinutes(t: string): number {
  const [h = 0, m = 0] = t.split(':').map(Number);
  return h * 60 + m;
}

/** YYYY-MM-DD string'ine N gün ekler */
function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`); // öğlen → DST güvenli
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function sessionToDateRange(
  session: SessionRow,
  isFestival: boolean
): { startDate: string; endDate: string; eventId?: string } | null {
  const startDate = sessionToIso(session);
  if (!startDate) return null;

  let endDate: string;
  if (isFestival && session.endDate) {
    // Festival: kullanıcının seçtiği bitiş tarihi
    const endTime = session.endTime || session.startTime || '23:59';
    endDate = new Date(`${session.endDate}T${endTime}:00`).toISOString();
  } else if (session.endTime) {
    // Gece yarısı geçiyor mu kontrol et (örn: başlangıç 20:00 → bitiş 02:00)
    const startMin = timeToMinutes(session.startTime);
    const endMin = timeToMinutes(session.endTime);
    const dateForEnd = endMin <= startMin
      ? addDaysToDateStr(session.startDate, 1) // ertesi gün
      : session.startDate;
    endDate = new Date(`${dateForEnd}T${session.endTime}:00`).toISOString();
  } else {
    endDate = startDate;
  }

  return { startDate, endDate, ...(session.eventId ? { eventId: session.eventId } : {}) };
}

function isValidSessionRow(session: SessionRow): boolean {
  return Boolean(session.startDate?.trim() && session.startTime?.trim());
}

const createStepHints = [
  'Etkinlik adı, kategori ve tarih bilgilerini girin.',
  'Mekan, adres ve etiketleri belirleyin.',
  'Katılımcıları ve etkinlik açıklamasını ekleyin.',
  'Kapak görseli ve bilet kategorilerini ayarlayın.',
  'Etkinlik kurallarını ve bilgilendirmeleri yapılandırın.',
  'Katılımcı soruları ve gizlilik seçeneklerini yapılandırın.',
  'Son kontrolü yapın; taslak kaydedin veya onaya gönderin.'
];

const editStepHints = [
  'Etkinlik adı, kategori ve tarih bilgilerini güncelleyin.',
  'Mekan, adres ve etiketleri düzenleyin.',
  'Katılımcıları ve açıklamayı güncelleyin.',
  'Kapak görseli ve bilet kategorilerini düzenleyin.',
  'Etkinlik kurallarını ve bilgilendirmeleri güncelleyin.',
  'Katılımcı soruları ve gizlilik ayarlarını güncelleyin.',
  'Değişiklikleri kaydetmeden önce son kontrolü yapın.'
];

interface CreateOrganizerEventWizardProps {
  mode?: 'create' | 'edit';
  eventId?: string;
  initialData?: EventWizardInitialData;
  initialStatus?: EventStatus;
}

export function CreateOrganizerEventWizard({
  mode = 'create',
  eventId,
  initialData,
  initialStatus
}: CreateOrganizerEventWizardProps) {
  const isEdit = mode === 'edit';
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [citySlug, setCitySlug] = useState<CitySlug>(
    (initialData?.citySlug as CitySlug) ?? DEFAULT_CITY_SLUG
  );
  const [eventTypeMode, setEventTypeMode] = useState<EventTypeMode>(
    initialData?.eventTypeMode ?? 'single'
  );
  const [sessions, setSessions] = useState<SessionRow[]>(
    initialData?.sessions.map(initialSession) ?? [newSession()]
  );
  const [location, setLocation] = useState<LocationMode>(initialData?.location ?? 'venue');
  const [venueName, setVenueName] = useState(initialData?.venueName ?? '');
  const [venueAddress, setVenueAddress] = useState(initialData?.venueAddress ?? '');
  const [venueDetail, setVenueDetail] = useState('');
  const [ruleSet, setRuleSet] = useState<EventRuleSetState>(
    initialData?.ruleSet ?? {
      selectedRules: [],
      customRules: initialData?.eventRules
        ? initialData.eventRules.split(/\r?\n/).filter(Boolean)
        : [],
      announcements: []
    }
  );
  const [onlineUrl, setOnlineUrl] = useState('');
  const [venueMapUrl, setVenueMapUrl] = useState<string | undefined>(initialData?.venueMapUrl);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [performers, setPerformers] = useState<PerformerRow[]>(
    () =>
      initialData?.performers.map((p, index) => ({
        id: p.artistId ? `perf-${p.artistId}` : `perf-${index}-${p.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: p.name,
        type: p.type,
        artistId: p.artistId,
        image: p.image,
        role: p.role ?? ''
      })) ?? []
  );
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
  const [submitSuccess, setSubmitSuccess] = useState<'pending' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(isEdit);
  const ticketCategoriesRef = useRef(ticketCategories);
  ticketCategoriesRef.current = ticketCategories;

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
    setTicketCategories(ticketCategoriesFromDraft(draft.ticketCategories));
    if (draft.ruleSet) {
      setRuleSet(draft.ruleSet);
    }
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
        previewImageUrl: previewImage?.startsWith('http') ? previewImage : null,
        ruleSet
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
    previewImage,
    ruleSet
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

  function updateTicketCategory<K extends keyof TicketCategory>(
    id: string,
    field: K,
    value: TicketCategory[K]
  ) {
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

  const persistDraftSnapshot = useCallback(
    (nextStep?: number) => {
      if (isEdit || !draftRestored) return;
      saveEventWizardDraft({
        step: nextStep ?? step,
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
        ticketCategories: ticketCategoriesRef.current.map(({ sold: _sold, ...c }) => ({
          ...c,
          price: c.price != null ? String(c.price) : '',
          capacity: c.capacity != null ? String(c.capacity) : ''
        })),
        attendeeQuestions,
        preventQuestionCopy,
        accessPassword,
        hiddenFromSearch,
        termsAccepted,
        previewImageUrl: previewImage?.startsWith('http') ? previewImage : null,
        ruleSet
      });
    },
    [
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
      attendeeQuestions,
      preventQuestionCopy,
      accessPassword,
      hiddenFromSearch,
      termsAccepted,
      previewImage,
      ruleSet
    ]
  );

  function goToNextStep() {
    setError(null);
    if (step === 4) {
      const categories = ticketCategoriesRef.current;
      const categoryError = ticketCategoryValidationError(categories);
      if (categoryError) {
        setError(categoryError);
        return;
      }
      const valid = categories.filter(isValidTicketCategory);
      if (valid.length === 0) {
        setError('En az bir bilet kategorisi ekleyin.');
        return;
      }
      if (ticketType === 'paid' && valid.some((c) => !String(c.price ?? '').trim())) {
        setError('Ücretli biletler için her kategoriye fiyat girin.');
        return;
      }
    }
    persistDraftSnapshot(step + 1);
    setStep(step + 1);
  }

  async function saveEvent(targetStatus?: 'draft' | 'pending') {
    setError(null);
    persistDraftSnapshot();
    const isFestival = category === 'festival';
    const activeSessions =
      eventTypeMode === 'recurring'
        ? sessions.filter(isValidSessionRow)
        : sessions.slice(0, 1);

    if (eventTypeMode === 'recurring' && activeSessions.length < 2) {
      setError('Tekrarlayan etkinlik için en az iki geçerli seans girin.');
      return;
    }

    const sessionDates = activeSessions
      .map((session) => sessionToDateRange(session, isFestival))
      .filter((range): range is { startDate: string; endDate: string } => range !== null);

    if (sessionDates.length === 0) {
      setError('Geçerli bir başlangıç tarihi ve saati girin.');
      return;
    }

    if (sessionDates.length !== activeSessions.length) {
      setError('Tüm seanslar için geçerli tarih ve saat girin.');
      return;
    }

    const first = sessionDates[0];
    const startDate = first.startDate;
    const endDate = first.endDate;

    if (!title.trim() || !category || !description.trim()) {
      setError('Lütfen zorunlu alanları doldurun.');
      return;
    }
    if (location !== 'online' && !venueName.trim()) {
      setError('Lütfen etkinlik mekanını seçin veya girin.');
      return;
    }
    if (targetStatus === 'pending' && !termsAccepted) {
      setError('Onaya göndermek için organizatör kullanıcı sözleşmesini kabul etmelisiniz.');
      return;
    }
    const categories = ticketCategoriesRef.current;
    const categoryError = ticketCategoryValidationError(categories);
    if (categoryError) {
      setError(categoryError);
      return;
    }
    const validCategories = categories.filter(isValidTicketCategory);
    if (validCategories.length === 0) {
      setError('En az bir bilet kategorisi ekleyin.');
      return;
    }
    if (ticketType === 'paid' && validCategories.some((c) => !String(c.price ?? '').trim())) {
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
          credentials: 'include',
          body: fd
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          coverImageUrl = uploadData.url;
        }
      } else if (previewImage?.startsWith('http')) {
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
        ...(isOnline && onlineUrl.trim() ? { onlineUrl: onlineUrl.trim() } : {}),
        tags,
        performers: performers
          .filter((p) => p.name.trim())
          .map((p) => ({
            name: p.name.trim(),
            type: p.type,
            ...(p.artistId ? { artistId: p.artistId } : {}),
            ...(p.role !== undefined ? { role: p.role } : {})
          })),
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
          capacity: Number(c.capacity),
          seatsPerUnit: Math.max(1, Number(c.seatsPerUnit) || 1),
          showLowStockBadge: c.showLowStockBadge
        })),
        ...(venueMapUrl ? { venueMapUrl } : {}),
        ...(targetStatus ? { status: targetStatus } : {}),
        ...(targetStatus === 'pending' ? { organizerTermsAccepted: true } : {}),
        ...(eventTypeMode === 'recurring' && sessionDates.length >= 2
          ? { sessions: sessionDates }
          : {})
      };

      const res = await fetch(
        isEdit && eventId ? `/api/organizer/events/${eventId}` : '/api/organizer/events',
        {
          method: isEdit ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEdit ? 'Kayıt başarısız' : 'Kayıt başarısız'));

      const savedEvents: Array<{ id: string }> = Array.isArray(data.events)
        ? data.events
        : data.event
          ? [data.event]
          : [];

      for (const ev of savedEvents) {
        const rulesRes = await fetch(`/api/organizer/events/${ev.id}/rules`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedRules: ruleSet.selectedRules,
            customRules: ruleSet.customRules,
            appliedTemplateId: ruleSet.appliedTemplateId ?? null,
            // Başlığı veya içeriği boş olan duyuruları gönderme
            announcements: ruleSet.announcements.filter(
              (a) => a.titleTr.trim().length > 0 && a.contentTr.replace(/<[^>]*>/g, '').trim().length > 0
            )
          })
        });
        if (!rulesRes.ok) {
          const rulesData = (await rulesRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(rulesData.error || 'Etkinlik kuralları kaydedilemedi');
        }
      }

      if (!isEdit) clearEventWizardDraft();

      if (!isEdit && targetStatus === 'pending') {
        setSubmitSuccess('pending');
        setPublishing(false);
        return;
      }

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

  if (submitSuccess === 'pending') {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Clock className="size-8" />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-foreground">Onay bekliyor</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Etkinliğiniz BiletFeed ekibine iletildi. İnceleme tamamlandığında yayına alınacak
          ve e-posta ile bilgilendirileceksiniz.
        </p>
        <Button asChild className="mt-8">
          <Link href="/organizator-panel/etkinlikler">Etkinliklerime Git</Link>
        </Button>
      </div>
    );
  }

  if (!isEdit && !draftRestored) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Taslak yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-28">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative border-b border-border bg-gradient-to-br from-primary/10 via-card to-card px-4 py-5 md:px-8 md:py-8">
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
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {stepHints[step - 1]}
                </p>
              </div>
            </div>
            <span className="hidden shrink-0 items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:inline-flex">
              Adım {step} / {TOTAL_STEPS}
            </span>
          </div>
        </div>

        <div className="border-b border-border bg-muted/20 px-4 py-4 md:px-8 md:py-6">
          <EventWizardStepper current={step} steps={[...EVENT_WIZARD_STEPS]} />
        </div>

        <div className="space-y-6 p-4 md:p-8">
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
                            {session.endTime && session.startTime &&
                              session.endTime <= session.startTime && (
                              <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-500">
                                <span>⚠</span>
                                Bitiş saati başlangıçtan önce — etkinlik ertesi güne uzanıyor (+1 gün otomatik)
                              </p>
                            )}
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
              venueMapUrl={venueMapUrl}
              onVenueMapUrlChange={setVenueMapUrl}
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
                description="Kapak görseli etkinliğinizin keşfedilme oranını artırır. Dosyayı sürükleyip bırakabilir, yükleyebilir veya görsel linki ekleyebilirsiniz. Tavsiye: 1920×1080 px, max. 5 MB."
                icon={ImageIcon}
              >
              <div className="py-5">
                <CoverImagePicker
                  previewUrl={previewImage}
                  onPreviewChange={setPreviewImage}
                  onFileChange={(file) => {
                    imageFileRef.current = file;
                  }}
                />
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
                          maxLength={200}
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
                          Satılabilir adet<span className="text-destructive">*</span>
                        </label>
                        <Input
                          type="number"
                          value={cat.capacity}
                          onChange={(e) => updateTicketCategory(cat.id, 'capacity', e.target.value)}
                          placeholder="1"
                          className="h-11 rounded-lg"
                        />
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Masa/loca için genelde 1
                        </p>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Kişi / QR sayısı
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={cat.seatsPerUnit}
                          onChange={(e) =>
                            updateTicketCategory(cat.id, 'seatsPerUnit', e.target.value)
                          }
                          placeholder="1"
                          className="h-11 rounded-lg"
                        />
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          1 satın alımda kaç QR üretilecek (ör. Bistro=4)
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Bilgi / Politika Notu
                        </label>
                        <WizardTextarea
                          value={cat.description}
                          onChange={(e) => updateTicketCategory(cat.id, 'description', e.target.value)}
                          placeholder="Örn: İptal &amp; İade Politikası — Satın alımdan itibaren 48 saat içinde iptal hakkınız bulunmaktadır."
                          rows={4}
                          maxLength={2000}
                        />
                        {cat.description.trim().length > 0 && (
                          <p className="mt-1 text-right text-xs text-muted-foreground">
                            {cat.description.trim().length}/2000
                          </p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={cat.showLowStockBadge}
                            onChange={(e) =>
                              updateTicketCategory(cat.id, 'showLowStockBadge', e.target.checked)
                            }
                            className="mt-0.5 size-4 shrink-0 rounded border-border"
                          />
                          <span>
                            Satış ekranında &quot;Tükenmek üzere&quot; göster
                          </span>
                        </label>
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
            <WizardStepRules
              categorySlug={category}
              tags={tags}
              title={title}
              description={description}
              isOnline={location === 'online' || location === 'hybrid'}
              isFree={ticketType === 'free'}
              ruleSet={ruleSet}
              onRuleSetChange={setRuleSet}
            />
          )}

          {step === 6 && (
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

          {step === 7 && (
            <WizardStepPublish
              isEdit={isEdit}
              showTerms={
                !isEdit ||
                initialStatus === 'draft' ||
                initialStatus === 'pending' ||
                initialStatus === 'published' ||
                initialStatus === 'completed'
              }
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
              ruleSet={ruleSet}
              termsAccepted={termsAccepted}
              onTermsAcceptedChange={setTermsAccepted}
            />
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 md:gap-4 md:px-6 md:py-4">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={publishing}
              className="shrink-0 px-4 sm:min-w-[100px]"
            >
              Geri
            </Button>
          ) : (
            <div className="hidden sm:block sm:min-w-[100px]" />
          )}

          {step < TOTAL_STEPS ? (
            <Button
              onClick={goToNextStep}
              className={cn(
                'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90',
                step > 1 ? 'min-w-0 flex-1 sm:flex-none sm:min-w-[160px]' : 'ml-auto min-w-[160px] px-8'
              )}
              disabled={publishing}
            >
              Kaydet ve Devam Et
            </Button>
          ) : isEdit ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => saveEvent()}
                disabled={publishing}
                className="min-w-[160px]"
              >
                {publishing ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
              </Button>
              {(initialStatus === 'draft' ||
                initialStatus === 'pending' ||
                initialStatus === 'published' ||
                initialStatus === 'completed') && (
                <Button
                  onClick={() => saveEvent('pending')}
                  disabled={publishing || !termsAccepted}
                  className="min-w-[160px] bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                >
                  {publishing
                    ? 'Gönderiliyor…'
                    : initialStatus === 'published' || initialStatus === 'completed'
                      ? 'Yeniden Onaya Gönder'
                      : 'Onaya Gönder'}
                </Button>
              )}
            </div>
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
                onClick={() => saveEvent('pending')}
                disabled={publishing || !termsAccepted}
                className="min-w-[140px] bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
              >
                {publishing ? 'Gönderiliyor…' : 'Onaya Gönder'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
