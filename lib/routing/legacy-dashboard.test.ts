import { describe, expect, it } from 'vitest';
import {
  mapLegacyDashboardPath,
  mapLegacyDashboardToDevPanelPath
} from './legacy-dashboard';

describe('mapLegacyDashboardPath', () => {
  it('maps /dashboard to /baslangic', () => {
    expect(mapLegacyDashboardPath('/dashboard')).toBe('/baslangic');
  });

  it('maps nested dashboard routes', () => {
    expect(mapLegacyDashboardPath('/dashboard/etkinlikler')).toBe('/etkinlikler');
    expect(mapLegacyDashboardPath('/dashboard/etkinlik/yeni')).toBe('/etkinlik/yeni');
  });

  it('leaves non-dashboard paths unchanged', () => {
    expect(mapLegacyDashboardPath('/etkinlikler')).toBe('/etkinlikler');
  });
});

describe('mapLegacyDashboardToDevPanelPath', () => {
  it('prefixes organizator-panel in dev', () => {
    expect(mapLegacyDashboardToDevPanelPath('/dashboard')).toBe(
      '/organizator-panel/baslangic'
    );
    expect(mapLegacyDashboardToDevPanelPath('/dashboard/tarayici')).toBe(
      '/organizator-panel/tarayici'
    );
  });
});
