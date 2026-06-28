'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ReviewRow = {
  id: string;
  rating: number;
  comment: string;
  isHidden: boolean;
  createdAt: string;
  user: { displayName: string; email: string };
  event: { title: string; slug: string };
};

export function ModerationPanel({ initialReviews }: { initialReviews: ReviewRow[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleHidden(id: string, hidden: boolean) {
    setBusyId(id);
    const res = await fetch(`/api/organizer/reviews/${id}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden })
    });
    setBusyId(null);
    if (res.ok) {
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isHidden: hidden } : r))
      );
    }
  }

  async function removeReview(id: string) {
    if (!confirm('Bu yorumu kalıcı olarak kaldırmak istiyor musunuz?')) return;
    setBusyId(id);
    const res = await fetch(`/api/organizer/reviews/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    setBusyId(null);
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted text-left">
          <tr>
            <th className="p-3 font-medium">Etkinlik</th>
            <th className="p-3 font-medium">Kullanıcı</th>
            <th className="p-3 font-medium">Puan</th>
            <th className="p-3 font-medium">Yorum</th>
            <th className="p-3 font-medium">Durum</th>
            <th className="p-3 font-medium">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id} className="border-b last:border-0 align-top">
              <td className="p-3">{review.event.title}</td>
              <td className="p-3">
                <p>{review.user.displayName}</p>
                <p className="text-xs text-muted-foreground">{review.user.email}</p>
              </td>
              <td className="p-3">{review.rating}/5</td>
              <td className="p-3 max-w-xs">{review.comment}</td>
              <td className="p-3">
                <Badge variant={review.isHidden ? 'destructive' : 'success'}>
                  {review.isHidden ? 'Gizli' : 'Yayında'}
                </Badge>
              </td>
              <td className="p-3 space-x-2 whitespace-nowrap">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === review.id}
                  onClick={() => toggleHidden(review.id, !review.isHidden)}
                >
                  {review.isHidden ? 'Göster' : 'Gizle'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busyId === review.id}
                  onClick={() => removeReview(review.id)}
                >
                  Sil
                </Button>
              </td>
            </tr>
          ))}
          {reviews.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-muted-foreground">
                Henüz yorum yok.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
