/** Eski /dashboard/* → organizatör panel yolu eşlemesi */
export function mapLegacyDashboardPath(pathname: string): string {
  if (!pathname.startsWith('/dashboard')) {
    return pathname;
  }

  const rest = pathname.replace(/^\/dashboard/, '') || '/baslangic';
  return rest === '/' ? '/baslangic' : rest;
}

/** Dev ortamında /organizator-panel önekli tam yol */
export function mapLegacyDashboardToDevPanelPath(pathname: string): string {
  const panelPath = mapLegacyDashboardPath(pathname);
  if (panelPath.startsWith('/organizator-panel')) {
    return panelPath;
  }
  return `/organizator-panel${panelPath}`;
}
