import { MyReviewsPageClient } from '@/components/account/my-reviews-page-client';
import { verifySessionCookie } from '@/lib/auth/session';
import {
  getPendingReviewEventsByFirebaseUid,
  getUserReviewsByFirebaseUid
} from '@/lib/services/user-reviews';
import { createPageMetadata } from '@/lib/seo/metadata';
import { redirect } from 'next/navigation';

export const metadata = createPageMetadata({
  title: 'Değerlendirmelerim',
  path: '/degerlendirmelerim'
});

export default async function MyReviewsPage() {
  const session = await verifySessionCookie();
  if (!session) redirect('/giris?redirect=/degerlendirmelerim');

  const [pending, reviews] = await Promise.all([
    getPendingReviewEventsByFirebaseUid(session.uid),
    getUserReviewsByFirebaseUid(session.uid)
  ]);

  return (
    <MyReviewsPageClient initialPending={pending} initialReviews={reviews} />
  );
}
