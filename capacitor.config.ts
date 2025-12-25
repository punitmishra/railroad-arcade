import type { CapacitorConfig } from '@capacitor/cli';

// For development: use local server
// For production: use hosted URL (native app loads from web server)
const serverUrl = process.env.CAPACITOR_SERVER_URL || 'https://railroad-arcade-v5.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.railroadarcade.app',
  appName: 'Railroad Arcade',
  webDir: 'public', // Fallback assets only
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Load from hosted server (enables full API support)
    url: serverUrl,
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#050508',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#050508',
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Railroad Arcade',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
