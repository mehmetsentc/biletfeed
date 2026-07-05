'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useAccountMode } from '@/hooks/use-account-mode';
import { isOrganizerApproved } from '@/lib/config/organizer-approval';

/** Profil menüsü / banner için organizatör onay durumu. */
export function useOrganizerApproval() {
  const { user } = useAuth();
  const { isOrganizerMode, isModeLocked } = useAccountMode();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const enabled = Boolean(user && isModeLocked && isOrganizerMode);

  useEffect(() => {
    if (!enabled) {
      setStatus(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch('/api/account/organizer', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) {
          setStatus(data?.organizer?.status ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, user?.uid]);

  return {
    loading,
    status,
    isApproved: isOrganizerApproved(status)
  };
}
