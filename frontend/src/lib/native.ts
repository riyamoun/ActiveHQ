import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'

export const isNativeApp = Capacitor.isNativePlatform()
export const nativePlatform = Capacitor.getPlatform()

/**
 * Native-only setup: status bar, Android back button → history back.
 */
export async function initializeNativeApp(): Promise<void> {
  if (!isNativeApp) return

  try {
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#000000' })
  } catch {
    // StatusBar plugin not available on web
  }

  if (nativePlatform === 'android') {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        App.minimizeApp()
      }
    })
  }
}
