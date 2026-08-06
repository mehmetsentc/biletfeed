import { getPanelUrl, panelHref, panelLoginHref } from '@/lib/config/domain';
import { openExternalUrl } from '@/lib/native/open-external';
import { Capacitor } from '@capacitor/core';

function normalizePanelPath(path: string): string {
  const trimmed = path.trim() || '/baslangic';
  if (trimmed.startsWith('/organizator-panel')) {
    return trimmed.replace(/^\/organizator-panel/, '') || '/baslangic';
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/**
 * Organizatör paneli — native uygulama içinde WebView'a gömülmez;
 * sistem tarayıcısında açılır. App oturumu kısa ömürlü handoff ile Safari'ye taşınır
 * (WKWebView ↔ Safari çerezleri ayrıdır).
 */
export async function openOrganizerPanel(
  path = '/etkinlik/yeni'
): Promise<void> {
  const cleanPath = normalizePanelPath(path);
  const absoluteFallback = panelHref(
    cleanPath.startsWith('/organizator-panel')
      ? cleanPath
      : `/organizator-panel${cleanPath}`
  );
  const fallbackUrl = absoluteFallback.startsWith('http')
    ? absoluteFallback
    : getPanelUrl(cleanPath);

  if (!Capacitor.isNativePlatform()) {
    await openExternalUrl(fallbackUrl);
    return;
  }

  try {
    const res = await fetch('/api/auth/panel-handoff', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirect: cleanPath })
    });
    if (res.ok) {
      const data = (await res.json()) as { bridgeUrl?: string };
      if (data.bridgeUrl?.startsWith('http')) {
        await openExternalUrl(data.bridgeUrl);
        return;
      }
    }
    if (res.status === 401) {
      await openExternalUrl(
        panelLoginHref(
          cleanPath.startsWith('/organizator-panel')
            ? cleanPath
            : `/organizator-panel${cleanPath}`
        )
      );
      return;
    }
  } catch {
    // handoff yoksa düz panel URL
  }

  await openExternalUrl(fallbackUrl);
}
