type TrackPayload = Record<string, string | number | boolean | undefined>

const UTM_STORAGE_KEY = 'activehq:utm'

export interface AttributionData {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  referrer?: string
  landing_page?: string
}

export function initializeAttribution(): void {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const attribution: AttributionData = {
    utm_source: params.get('utm_source') ?? undefined,
    utm_medium: params.get('utm_medium') ?? undefined,
    utm_campaign: params.get('utm_campaign') ?? undefined,
    utm_term: params.get('utm_term') ?? undefined,
    utm_content: params.get('utm_content') ?? undefined,
    referrer: document.referrer || undefined,
    landing_page: `${window.location.pathname}${window.location.search}`,
  }

  const hasAnyAttribution = Object.values(attribution).some(Boolean)
  if (hasAnyAttribution) {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(attribution))
  }
}

export function getAttribution(): AttributionData {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem(UTM_STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as AttributionData
  } catch {
    return {}
  }
}

export function buildLeadSource(defaultSource = 'public_site'): string {
  const attribution = getAttribution()
  const utmSource = attribution.utm_source ?? 'direct'
  const utmMedium = attribution.utm_medium ?? 'none'
  const utmCampaign = attribution.utm_campaign ?? 'na'
  // Kept concise to fit backend source length constraints.
  const encoded = `${defaultSource}|${utmSource}|${utmMedium}|${utmCampaign}`
  return encoded.slice(0, 50)
}

export function trackEvent(eventName: string, payload: TrackPayload = {}): void {
  if (typeof window === 'undefined') return

  const eventPayload = {
    ...payload,
    page_path: window.location.pathname,
  }

  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function') {
    gtag('event', eventName, eventPayload)
  }

  if (import.meta.env.DEV) {
    console.log('[analytics]', eventName, eventPayload)
  }
}
