import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react'
import { formatInr, PRICING } from '@/constants/pricing'
import { trackEvent } from '@/lib/analytics'

const WHATSAPP_LINK =
  'https://wa.me/919354349118?text=Hi%20ActiveHQ%2C%20I%20run%20a%20gym%20and%20want%20to%20book%20a%20demo.'

const DEFAULT_FEATURES = [
  'Unlimited members',
  'Cash + UPI tracking',
  'WhatsApp automation',
  'Biometric integration',
  'Free data migration',
  'Lifetime price-lock for founding gyms',
]

type PublicPricingProps = {
  location: string
  features?: string[]
  showWhatsApp?: boolean
}

export function PublicPricing({
  location,
  features = DEFAULT_FEATURES,
  showWhatsApp = true,
}: PublicPricingProps) {
  const { normal, founding } = PRICING

  return (
    <section className="relative py-24 sm:py-32 border-t border-white/10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <PricingGlow />
      </div>

      <div className="relative max-w-5xl mx-auto px-5 sm:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime-400/30 bg-lime-400/5">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-xs tracking-[0.2em] uppercase text-lime-400 font-medium">
              {founding.limitedNote}
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold leading-tight mt-6">
            Simple pricing. <span className="text-white/40 font-light">No surprises.</span>
          </h2>
          <p className="mt-5 text-lg text-white/60 max-w-xl mx-auto">
            We migrate your old data on the demo call itself. You only pay once you&apos;re
            convinced.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <PlanCard
            title={normal.label}
            yearly={normal.yearlyInr}
            setup={normal.setupInr}
            yearlyNote={normal.yearlyNote}
          />
          <PlanCard
            title={founding.label}
            badge={founding.badge}
            yearly={founding.yearlyInr}
            setup={founding.setupInr}
            yearlyNote={founding.yearlyNote}
            subtitle={founding.limitedNote}
            highlighted
          />
        </div>

        <div className="mt-8 grid sm:grid-cols-2 gap-3 text-left max-w-md mx-auto">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-white/80">
              <CheckCircle2 className="w-4 h-4 text-lime-400 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/contact"
            onClick={() => trackEvent('cta_click', { location, cta: 'book_demo' })}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-lime-400 text-black font-bold hover:bg-lime-300 transition-colors"
          >
            Book a 15-min demo
            <ArrowRight className="w-4 h-4" />
          </Link>
          {showWhatsApp && (
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('cta_click', { location, cta: 'whatsapp' })}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-white/20 text-white font-semibold hover:border-lime-400/60 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Talk on WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

function PlanCard({
  title,
  badge,
  yearly,
  setup,
  yearlyNote,
  subtitle,
  highlighted = false,
}: {
  title: string
  badge?: string
  yearly: number
  setup: number
  yearlyNote: string
  subtitle?: string
  highlighted?: boolean
}) {
  return (
    <div
      className={`relative rounded-3xl border p-8 sm:p-10 text-center ${
        highlighted
          ? 'border-lime-400/30 bg-black shadow-[0_0_80px_rgba(163,230,53,0.15)]'
          : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-lime-400 text-black text-[11px] font-bold tracking-[0.2em] uppercase">
          {badge}
        </div>
      )}
      <p className="text-sm tracking-[0.15em] uppercase text-white/50">{title}</p>
      <div className="mt-4 text-5xl sm:text-6xl font-bold">
        <span className="text-white/40 text-2xl align-top">₹</span>
        <span className={highlighted ? 'text-lime-400' : 'text-white'}>
          {formatInr(yearly)}
        </span>
        <span className="text-white/40 text-lg font-light"> {yearlyNote}</span>
      </div>
      <p className="mt-2 text-white/50">+ ₹{formatInr(setup)} one-time setup</p>
      {subtitle && <p className="mt-3 text-xs text-lime-400/90">{subtitle}</p>}
    </div>
  )
}

function PricingGlow() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-lime-400/10 blur-[180px] rounded-full" />
  )
}
