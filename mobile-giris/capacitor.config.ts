import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() || 'https://giris.biletfeed.com';

const config: CapacitorConfig = {
  appId: 'com.biletfeed.giris',
  appName: 'BiletFeed Giriş',
  webDir: 'www',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a'
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['apple.com', 'google.com']
    }
  }
};

export default config;
