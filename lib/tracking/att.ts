/**
 * iOS App Tracking Transparency (ATT) durumunu native tarafta kontrol eder /
 * gerekirse sistem izin diyaloğunu gösterir.
 *
 * Yalnızca Capacitor iOS'ta anlamlıdır. Web'de ve Android'de her zaman `true`
 * döner — Android'de ATT kavramı yok, web'de izleme rızası mevcut çerez onay
 * banner'ı ile yönetiliyor.
 *
 * App Store Guideline 5.1.2(i): Uygulama web içeriğinde tracking amaçlı çerez
 * topluyorsa (GA4 vb.), kullanıcıdan önce bu izni almak zorunludur. İzin
 * verilmezse tracking scriptleri hiç yüklenmemelidir.
 */
export async function isTrackingAuthorized(): Promise<boolean> {
  const { Capacitor } = await import('@capacitor/core');
  if (Capacitor.getPlatform() !== 'ios') return true;

  try {
    const { AppTrackingTransparency, AppTrackingTransparencyStatus } =
      await import('capacitor-app-tracking-transparency');

    const att = new AppTrackingTransparency();
    let status = await att.getStatus();

    if (status === AppTrackingTransparencyStatus.notDetermined) {
      status = await att.requestPermission();
    }

    return status === AppTrackingTransparencyStatus.authorized;
  } catch {
    // Plugin çağrısı başarısız olursa güvenli taraf: tracking'i kapalı say
    return false;
  }
}
