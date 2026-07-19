'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Star } from 'lucide-react';
import { AccountProfileTabs } from '@/components/account/account-profile-tabs';
import { SubmitReviewDialog } from '@/components/account/submit-review-dialog';
import { loadLocalReviews } from '@/lib/account/local-reviews';
import { formatEventDate } from '@/lib/data/mock-events';
import type {
  PendingReviewEvent,
  UserReviewItem
} from '@/lib/services/user-reviews';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

type ReviewTab = 'pending' | 'reviews';

const tabs: { id: ReviewTab; label: string }[] = [
  { id: 'pending', label: 'Bekleyenler' },
  { id: 'reviews', label: 'Değerlendirmelerim' }
];

const emptyCopy: Record<
  ReviewTab,
  { title: string; description: string }
> = {
  pending: {
    title: 'Değerlendirme bekleyen etkinlik bulunamadı',
    description: 'Şu an değerlendirme yapabileceğiniz etkinlik bulunmamaktadır.'
  },
  reviews: {
    title: 'Henüz değerlendirme yapmadınız',
    description: 'Katıldığınız etkinlikleri değerlendirerek burada görebilirsiniz.'
  }
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={
            index < rating
              ? 'size-4 fill-amber-400 text-amber-400'
              : 'size-4 text-muted-foreground/40'
          }
        />
      ))}
    </div>
  );
}

function PendingEventCard({
  event,
  onReview
}: {
  event: PendingReviewEvent;
  onReview: () => void;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={event.coverImage}
          alt={event.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={`/etkinlik/${event.slug}`}
          className="font-semibold hover:text-[var(--bf-accent-ink)]"
        >
          {event.title}
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          {event.organizerName}
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {formatEventDate(event.startDate)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {event.venue}, {event.city}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onReview}
        className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Değerlendir
      </button>
    </article>
  );
}

function ReviewCard({ review }: { review: UserReviewItem }) {
  return (
    <article className="flex gap-4 rounded-xl border border-border bg-background p-4">
      {review.event.coverImage && (
        <div className="relative hidden size-20 shrink-0 overflow-hidden rounded-lg sm:block">
          <Image
            src={review.event.coverImage}
            alt=""
            fill
            className="object-cover"
            sizes="80px"
            unoptimized
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <Link
          href={`/etkinlik/${review.event.slug}`}
          className="font-semibold hover:text-[var(--bf-accent-ink)]"
        >
          {review.event.title}
        </Link>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {review.event.organizerName}
        </p>
        <div className="mt-2">
          <Stars rating={review.rating} />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {review.comment}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {new Date(review.createdAt).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>
    </article>
  );
}

export function MyReviewsPageClient({
  initialPending,
  initialReviews
}: {
  initialPending: PendingReviewEvent[];
  initialReviews: UserReviewItem[];
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<ReviewTab>('pending');
  const [pending, setPending] = useState(initialPending);
  const [reviews, setReviews] = useState(initialReviews);
  const [selectedEvent, setSelectedEvent] = useState<PendingReviewEvent | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const local = loadLocalReviews(user.uid);
    if (local.length === 0) return;

    setReviews((prev) => {
      const ids = new Set(prev.map((r) => r.id));
      const merged = [...prev];
      for (const item of local) {
        if (!ids.has(item.id)) merged.push(item);
      }
      return merged.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    setPending((prev) =>
      prev.filter(
        (item) =>
          !local.some(
            (review) =>
              review.event.slug === item.slug ||
              review.event.title === item.title
          )
      )
    );
  }, [user]);

  function openReviewDialog(event: PendingReviewEvent) {
    setSelectedEvent(event);
    setDialogOpen(true);
  }

  function handleSubmitted(review: UserReviewItem, eventId: string) {
    setReviews((prev) => [review, ...prev]);
    setPending((prev) => prev.filter((item) => item.eventId !== eventId));
    setTab('reviews');
    router.refresh();
  }

  const empty = emptyCopy[tab];
  const hasItems = tab === 'pending' ? pending.length > 0 : reviews.length > 0;

  return (
    <div className="max-w-6xl">
      <AccountProfileTabs />

      <section className="mt-2 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <h1 className="text-xl font-bold tracking-tight">Değerlendirmelerim</h1>
          <div className="inline-flex w-fit rounded-full bg-muted/80 p-1">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  tab === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-14 md:px-6 md:py-20">
          {!hasItems ? (
            <div className="mx-auto max-w-md text-center">
              <p className="text-lg font-semibold text-foreground/90">
                {empty.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {empty.description}
              </p>
            </div>
          ) : tab === 'pending' ? (
            <div className="mx-auto max-w-3xl space-y-4">
              {pending.map((event) => (
                <PendingEventCard
                  key={event.eventId}
                  event={event}
                  onReview={() => openReviewDialog(event)}
                />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      </section>

      <SubmitReviewDialog
        event={selectedEvent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmitted={handleSubmitted}
      />
    </div>
  );
}
