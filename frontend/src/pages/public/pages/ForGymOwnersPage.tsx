import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Users,
  IndianRupee,
  Bell,
  MessageCircle,
  CheckCircle2,
  Fingerprint,
  Wifi,
} from 'lucide-react';
import { SeoMeta } from '@/components/seo/SeoMeta';
import { trackEvent } from '@/lib/analytics';

const WHATSAPP_LINK =
  'https://wa.me/919354349118?text=Hi%20ActiveHQ%2C%20I%20run%20a%20gym%20and%20want%20to%20book%20a%20demo.';

const features = [
  {
    n: '01',
    title: 'Member lifecycle',
    quip: 'From first walk-in to loyal renewal',
    body: "Every member, every renewal, every drop-off — visible the moment it happens. Know who's slipping before they ghost.",
    points: ['One-tap check-in', 'Inactivity alerts', 'Automated follow-ups'],
    Icon: Users,
  },
  {
    n: '02',
    title: 'Money you can trust',
    quip: 'Cash in the drawer = number on screen',
    body: 'Cash, UPI, card — all tracked in the same flow. Every rupee accounted, every dues number defensible. Owners get the day-end summary on WhatsApp.',
    points: ['Cash + UPI in one ledger', 'Daily collection on WhatsApp', 'Dues tracked member-by-member'],
    Icon: IndianRupee,
  },
  {
    n: '03',
    title: 'Renewals on autopilot',
    quip: 'No more chasing on Sunday evening',
    body: '7-day, 3-day and expiry-day nudges go out on WhatsApp without you opening the app. UPI payment links built in. Renewals close themselves.',
    points: ['Renewal nudges on autopilot', 'Expiry dashboard', 'One-click payment links'],
    Icon: Bell,
  },
];

const trustItems = [
  { Icon: IndianRupee, label: 'Cash + UPI' },
  { Icon: MessageCircle, label: 'WhatsApp built-in' },
  { Icon: Fingerprint, label: 'Biometric ready' },
  { Icon: Wifi, label: 'Works on any device' },
];

export function ForGymOwnersPage() {
  return (
    <div className="bg-black text-white">
      <SeoMeta
        title="For Gym Owners | ActiveHQ"
        description="See how ActiveHQ improves renewals, tracks payments, and streamlines day-to-day operations for Indian gym owners."
        path="/for-gym-owners"
      />

      {/* HERO */}
      <section className="relative pt-24 pb-16 sm:pb-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] bg-lime-400/10 blur-[180px] rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime-400/30 bg-lime-400/5 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-xs tracking-[0.2em] uppercase text-lime-400 font-medium">
              For gym owners
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight max-w-3xl">
            Built for those who
            <br />
            <span className="text-lime-400">build bodies.</span>
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-white/60 max-w-2xl leading-relaxed">
            Early mornings, cash counting, member follow-ups, renewal chasing — we get it.
            ActiveHQ handles the operational grind so you can stay on the floor with your members.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              to="/contact"
              onClick={() =>
                trackEvent('cta_click', { location: 'owners_hero', cta: 'book_demo' })
              }
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-lime-400 text-black font-bold hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(163,230,53,0.5)] transition-all"
            >
              Book a 15-min demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent('cta_click', { location: 'owners_hero', cta: 'whatsapp' })
              }
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-white/20 text-white font-semibold hover:border-lime-400/60 hover:text-lime-400 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Talk on WhatsApp
            </a>
          </div>

          {/* Trust strip */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            {trustItems.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/60 text-sm">
                <Icon className="w-4 h-4 text-lime-400" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-white/10 py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-20 sm:space-y-24">
          {features.map(({ n, title, quip, body, points, Icon }, idx) => (
            <div
              key={n}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                idx % 2 === 1 ? 'lg:[&>div:first-child]:order-2' : ''
              }`}
            >
              {/* Visual */}
              <div className="relative">
                <div className="absolute -inset-6 bg-lime-400/10 blur-[80px] rounded-full" />
                <div className="relative rounded-2xl border border-white/10 bg-zinc-950 p-8 sm:p-10">
                  <div className="w-14 h-14 rounded-2xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-lime-400" />
                  </div>
                  <p className="mt-8 text-2xl sm:text-3xl font-light text-white/90 leading-tight">
                    "{quip}"
                  </p>
                  <div className="mt-8 flex items-center justify-between text-xs text-white/40 uppercase tracking-wide">
                    <span>{n}</span>
                    <span>ActiveHQ</span>
                  </div>
                </div>
              </div>

              {/* Copy */}
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-lime-400 mb-4">
                  Chapter {n}
                </p>
                <h2 className="text-4xl sm:text-5xl font-bold leading-tight">{title}</h2>
                <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-lg">
                  {body}
                </p>
                <ul className="mt-8 space-y-3">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-white/80">
                      <CheckCircle2 className="w-5 h-5 text-lime-400 mt-0.5 flex-shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROMISE QUOTE */}
      <section className="py-20 sm:py-24 border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-2xl sm:text-3xl font-light leading-relaxed text-white/85">
            "Built so a 2-hour daily admin grind shrinks to under 10 minutes —
            so owners spend more time on the floor, not the counter."
          </p>
          <div className="mt-8 text-white/50 text-sm tracking-wide">
            — The ActiveHQ promise · Founding access open
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="relative py-24 sm:py-28 border-t border-white/10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-lime-400/10 blur-[180px] rounded-full" />
        </div>

        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-lime-400 mb-4">
            Investment
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
            One price.{' '}
            <span className="text-white/40 font-light">No surprises.</span>
          </h2>

          <div className="mt-12 relative rounded-3xl border border-lime-400/30 bg-black p-10 sm:p-14 shadow-[0_0_80px_rgba(163,230,53,0.15)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-lime-400 text-black text-[11px] font-bold tracking-[0.2em] uppercase">
              Founding Offer
            </div>

            <div className="text-6xl sm:text-7xl font-bold">
              <span className="text-white/40 text-3xl align-top">₹</span>
              <span className="text-lime-400">3,000</span>
              <span className="text-white/40 text-xl font-light">/year</span>
            </div>
            <div className="mt-1 text-white/50">+ ₹0 setup for founding gyms · usually ₹2,500</div>

            <div className="mt-10 grid sm:grid-cols-2 gap-3 text-left max-w-md mx-auto">
              {[
                'Unlimited members',
                'All features included',
                'WhatsApp automation',
                'Staff training',
                'Data migration',
                'Lifetime price-lock',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-white/80 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-lime-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            <Link
              to="/contact"
              onClick={() =>
                trackEvent('cta_click', { location: 'owners_pricing', cta: 'book_demo' })
              }
              className="inline-flex items-center gap-2 mt-10 px-8 py-4 rounded-full bg-lime-400 text-black font-bold hover:bg-lime-300 transition-colors"
            >
              Book a demo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 sm:py-32 border-t border-white/10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-lime-400/10 blur-[180px] rounded-full" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <h2 className="text-5xl sm:text-6xl font-bold leading-tight">
            Your gym, on{' '}
            <span className="text-lime-400">one screen.</span>
          </h2>
          <p className="mt-6 text-lg text-white/60">
            See it on a 15-minute call. We migrate your old data live, on the same call.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/contact"
              onClick={() =>
                trackEvent('cta_click', { location: 'owners_final_cta', cta: 'book_demo' })
              }
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-lime-400 text-black font-bold hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(163,230,53,0.5)] transition-all"
            >
              Book a 15-min demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent('cta_click', { location: 'owners_final_cta', cta: 'whatsapp' })
              }
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white font-semibold hover:border-lime-400/60 hover:text-lime-400 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Talk on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
