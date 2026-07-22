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
      launchShowDuration: 2000,
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
