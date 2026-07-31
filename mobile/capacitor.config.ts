import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() || 'https://biletfeed.com';

const config: CapacitorConfig = {
  appId: 'com.biletfeed.app',
  appName: 'BiletFeed',
  webDir: 'www',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
    androidScheme: 'https'
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
