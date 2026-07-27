/** Kapı terminali — cookie silinse bile tarama için oturum taşıma */

const SESSION_KEY = 'bf_scanner_bearer';
const SCOPE_KEY = 'bf_scanner_gate_scope';

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function storeScannerBearerTokens(params: {
  sessionToken: string;
  gateScopeToken?: string | null;
}): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(SESSION_KEY, params.sessionToken);
    if (params.gateScopeToken) {
      store.setItem(SCOPE_KEY, params.gateScopeToken);
    } else {
      store.removeItem(SCOPE_KEY);
    }
  } catch {
    /* private mode / quota */
  }
}

export function clearScannerBearerTokens(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(SESSION_KEY);
    store.removeItem(SCOPE_KEY);
  } catch {
    /* ignore */
  }
}

export function getScannerAuthHeaders(): Record<string, string> {
  const store = storage();
  if (!store) return {};
  try {
    const token = store.getItem(SESSION_KEY);
    const scope = store.getItem(SCOPE_KEY);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (scope) headers['X-Scanner-Gate-Scope'] = scope;
    return headers;
  } catch {
    return {};
  }
}
