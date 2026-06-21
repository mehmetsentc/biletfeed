'use client';

import { useRouter } from 'next/navigation';
import { InterestsForm } from '@/components/account/interests-form';

export default function InterestsPage() {
  const router = useRouter();

  return (
    <InterestsForm
      backHref="/"
      showSkip
      onComplete={() => router.push('/')}
    />
  );
}
