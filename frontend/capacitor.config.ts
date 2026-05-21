import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Native shell config for Play Store / App Store builds.
 * Web assets come from `npm run build:mobile` → `dist/`.
 */
const config: CapacitorConfig = {
  appId: 'com.activehq.app',
  appName: 'ActiveHQ',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    allowNavigation: [
      'activehq.fit',
      'www.activehq.fit',
      'activehq-api.onrender.com',
      '*.onrender.com',
      'accounts.google.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
    },
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },
}

export default config
