'use client';

import { useRouter } from 'next/navigation';
import { InterestsForm } from '@/components/account/interests-form';

export default function InterestsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <InterestsForm showSkip onComplete={() => router.push('/')} />
    </div>
  );
}
