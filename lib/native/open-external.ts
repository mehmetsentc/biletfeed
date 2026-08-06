import { Capacitor } from '@capacitor/core';

/** Native kabukta sistem tarayıcısı / SFSafariViewController */
export async function openExternalUrl(url: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url, presentationStyle: 'popover' });
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
