import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  GLOBAL_LOGOUT_COOKIE,
  clearGlobalLogoutMarker,
  isGlobalLogoutActive,
  markGlobalLogout
} from '@/lib/auth/global-logout';

describe('global logout marker', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      cookie: ''
    });
    let jar = '';
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => jar,
      set: (value: string) => {
        const [pair] = value.split(';');
        const [name, rawVal = ''] = pair.split('=');
        if (value.includes('max-age=0')) {
          jar = jar
            .split('; ')
            .filter((part) => part && !part.startsWith(`${name}=`))
            .join('; ');
          return;
        }
        const next = `${name}=${rawVal}`;
        const others = jar
          .split('; ')
          .filter((part) => part && !part.startsWith(`${name}=`));
        jar = [...others, next].filter(Boolean).join('; ');
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks and detects active global logout', () => {
    expect(isGlobalLogoutActive()).toBe(false);
    markGlobalLogout();
    expect(document.cookie).toContain(GLOBAL_LOGOUT_COOKIE);
    expect(isGlobalLogoutActive()).toBe(true);
  });

  it('clears the marker', () => {
    markGlobalLogout();
    clearGlobalLogoutMarker();
    expect(isGlobalLogoutActive()).toBe(false);
  });
});
