import type { CapacitorConfig } from '@capacitor/cli';
import { CAPACITOR_PAYMENT_ALLOW_NAVIGATION } from './payment-allow-navigation';

const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() || 'https://biletfeed.com';

const config: CapacitorConfig = {
  appId: 'com.biletfeed.app',
  appName: 'BiletFeed',
  webDir: 'www',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
    androidScheme: 'https',
    // Tosla ProcessCardForm + banka 3DS sayfaları WebView'da kalsın.
    // Yoksa iOS harici Safari'ye POST atar → boş "ProcessCardForm" indirmesi.
    allowNavigation: [...CAPACITOR_PAYMENT_ALLOW_NAVIGATION]
  },
  plugins: {
    SplashScreen: {
      // Native açılış ekranı statik (yalnızca ikon, ortalanmış, küçük boyut) —
      // gerçek "küçükten orta büyüklüğe büyüme" animasyonu web tarafında
      // (CapacitorSplashOverlay) devam eder. Native ekran sadece WebView
      // hazır olana kadarki kısa boşluğu kapatır, bu yüzden süresi kısa.
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000'
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['apple.com', 'google.com']
    }
  }
};

export default config;
