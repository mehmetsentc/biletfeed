'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { saveLocalReview } from '@/lib/account/local-reviews';
import type {
  PendingReviewEvent,
  UserReviewItem
} from '@/lib/services/user-reviews';
import { cn } from '@/lib/utils';

type SubmitReviewDialogProps = {
  event: PendingReviewEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: (review: UserReviewItem, eventId: string) => void;
};

export function SubmitReviewDialog({
  event,
  open,
  onOpenChange,
  onSubmitted
}: SubmitReviewDialogProps) {
  const { user, isConfigured } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function resetForm() {
    setRating(0);
    setHoverRating(0);
    setComment('');
    setError('');
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !user) return;

    if (rating < 1) {
      setError('Lütfen puan verin.');
      return;
    }
    if (comment.trim().length < 3) {
      setError('Yorum en az 3 karakter olmalıdır.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (isConfigured) {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.eventId,
            rating,
            comment: comment.trim()
          })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Değerlendirme kaydedilemedi');
        }
        onSubmitted(data.review, event.eventId);
      } else {
        const localReview: UserReviewItem = {
          id: `local-${Date.now()}`,
          rating,
          comment: comment.trim(),
          createdAt: new Date().toISOString(),
          event: {
            title: event.title,
            slug: event.slug,
            coverImage: event.coverImage,
            organizerName: event.organizerName,
            organizerSlug: event.organizerSlug
          }
        };
        saveLocalReview(user.uid, localReview);
        onSubmitted(localReview, event.eventId);
      }

      handleOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Değerlendirme kaydedilemedi'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[480px]">
        <div className="border-b border-border px-6 py-5">
          <DialogTitle className="text-xl font-bold">Değerlendirme Yap</DialogTitle>
          {event && (
            <p className="mt-1 text-sm text-muted-foreground">{event.title}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div>
            <p className="mb-2 text-sm font-medium">Puanınız</p>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                return (
                  <button
                    key={value}
                    type="button"
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(value)}
                    className="rounded p-0.5 transition-transform hover:scale-110"
                    aria-label={`${value} yıldız`}
                  >
                    <Star
                      className={cn(
                        'size-8',
                        value <= displayRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/40'
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="review-comment"
              className="mb-2 block text-sm font-medium"
            >
              Yorumunuz
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Etkinlik deneyiminizi paylaşın..."
              className="w-full resize-none rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none ring-primary/40 focus:bg-background focus:ring-2"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={submitting} className="rounded-full px-6">
              {submitting ? 'Gönderiliyor…' : 'Gönder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
