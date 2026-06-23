'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import {
  lockAccountMode,
  readAccountModeState,
  type AccountMode
} from '@/lib/auth/account-mode';

export function useAccountMode() {
  const { user } = useAuth();
  const [accountMode, setModeState] = useState<AccountMode>('user');
  const [isModeLocked, setIsModeLocked] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setModeState('user');
      setIsModeLocked(false);
      return;
    }

    const stored = readAccountModeState(user.uid);
    if (stored) {
      setModeState(stored.mode);
      setIsModeLocked(stored.locked);
      return;
    }

    setModeState('user');
    setIsModeLocked(false);
  }, [user?.uid]);

  useEffect(() => {
    function onModeChange(event: Event) {
      const detail = (
        event as CustomEvent<{
          uid: string;
          mode: AccountMode;
          locked?: boolean;
        }>
      ).detail;
      if (user?.uid && detail?.uid === user.uid) {
        setModeState(detail.mode);
        if (typeof detail.locked === 'boolean') {
          setIsModeLocked(detail.locked);
        }
      }
    }

    window.addEventListener('account-mode-change', onModeChange);
    return () => window.removeEventListener('account-mode-change', onModeChange);
  }, [user?.uid]);

  const selectAccountMode = useCallback(
    (mode: AccountMode) => {
      if (!user?.uid || isModeLocked) return;
      lockAccountMode(user.uid, mode);
      setModeState(mode);
      setIsModeLocked(true);
    },
    [user?.uid, isModeLocked]
  );

  return {
    accountMode,
    isModeLocked,
    selectAccountMode,
    isOrganizerMode: accountMode === 'organizer',
    isUserMode: accountMode === 'user'
  };
}
