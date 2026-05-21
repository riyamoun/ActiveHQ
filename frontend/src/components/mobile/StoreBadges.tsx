/**
 * Play / App Store badges — set env URLs after apps are approved.
 * VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.activehq.app
 * VITE_APP_STORE_URL=https://apps.apple.com/app/idXXXXXXXXX
 */

const PLAY_URL = import.meta.env.VITE_PLAY_STORE_URL?.trim()
const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL?.trim()

export default function StoreBadges({ className = '' }: { className?: string }) {
  if (!PLAY_URL && !APP_STORE_URL) return null

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {PLAY_URL && (
        <a
          href={PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:border-emerald-500/50 transition-colors"
          aria-label="Get ActiveHQ on Google Play"
        >
          <span aria-hidden>▶</span>
          Google Play
        </a>
      )}
      {APP_STORE_URL && (
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:border-emerald-500/50 transition-colors"
          aria-label="Download ActiveHQ on the App Store"
        >
          <span aria-hidden></span>
          App Store
        </a>
      )}
    </div>
  )
}
