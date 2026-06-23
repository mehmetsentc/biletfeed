export type AccountMode = 'user' | 'organizer';

export interface AccountModeState {
  mode: AccountMode;
  locked: boolean;
}

const STORAGE_PREFIX = 'biletfeed-account-mode';

function storageKey(uid: string): string {
  return `${STORAGE_PREFIX}:${uid}`;
}

function parseStored(raw: string | null): AccountModeState | null {
  if (!raw) return null;

  if (raw === 'user' || raw === 'organizer') {
    return { mode: raw, locked: true };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AccountModeState>;
    if (parsed.mode === 'user' || parsed.mode === 'organizer') {
      return { mode: parsed.mode, locked: Boolean(parsed.locked) };
    }
  } catch {
    return null;
  }

  return null;
}

export function readAccountModeState(uid: string): AccountModeState | null {
  if (typeof window === 'undefined') return null;
  return parseStored(localStorage.getItem(storageKey(uid)));
}

/** @deprecated use readAccountModeState */
export function readAccountMode(uid: string): AccountMode | null {
  return readAccountModeState(uid)?.mode ?? null;
}

function writeState(uid: string, state: AccountModeState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(uid), JSON.stringify(state));
  window.dispatchEvent(
    new CustomEvent('account-mode-change', { detail: { uid, ...state } })
  );
}

export function writeAccountMode(uid: string, mode: AccountMode): void {
  const current = readAccountModeState(uid);
  writeState(uid, {
    mode,
    locked: current?.locked ?? false
  });
}

export function lockAccountMode(uid: string, mode: AccountMode): void {
  writeState(uid, { mode, locked: true });
}

export function defaultAccountModeForRole(
  role: string | undefined
): AccountMode {
  if (
    role === 'ROLE_ORGANIZER' ||
    role === 'ROLE_ADMIN' ||
    role === 'ROLE_SUPER_ADMIN'
  ) {
    return 'organizer';
  }
  return 'user';
}
