import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { PushNotifications, Token } from '@capacitor/push-notifications'

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

/**
 * Android-first push token registration helper.
 * iOS can use the same flow once APNs is configured in Apple Developer/Xcode.
 */
export async function registerNativePushToken(): Promise<string | null> {
  if (!isNativeApp) return null

  let granted = false
  try {
    const perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'granted') {
      granted = true
    } else {
      const req = await PushNotifications.requestPermissions()
      granted = req.receive === 'granted'
    }
  } catch {
    return null
  }
  if (!granted) return null

  return new Promise((resolve) => {
    let settled = false
    const settle = (value: string | null) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    const timeout = window.setTimeout(() => settle(null), 12000)

    PushNotifications.addListener('registration', (token: Token) => {
      window.clearTimeout(timeout)
      settle(token.value)
    })
    PushNotifications.addListener('registrationError', () => {
      window.clearTimeout(timeout)
      settle(null)
    })

    void PushNotifications.register()
  })
}
