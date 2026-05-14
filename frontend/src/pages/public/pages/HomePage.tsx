import { Link } from 'react-router-dom';
import {
  ArrowRight,
  MessageCircle,
  IndianRupee,
  Smartphone,
  Banknote,
  Bell,
  Fingerprint,
  Wifi,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Calendar,
  TrendingUp,
  Brain,
  Dumbbell,
  Apple,
  User,
} from 'lucide-react';
import { SeoMeta } from '@/components/seo/SeoMeta';
import { Reveal } from '@/components/Reveal';
import { trackEvent } from '@/lib/analytics';

const WHATSAPP_LINK =
  'https://wa.me/919354349118?text=Hi%20ActiveHQ%2C%20I%20run%20a%20gym%20and%20want%20to%20book%20a%20demo.';

const siteUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PUBLIC_SITE_URL) ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://activehq.fit');

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ActiveHQ',
  url: siteUrl,
  email: 'info@activehq.fit',
  telephone: '+91 93543 49118',
};

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ActiveHQ',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    priceCurrency: 'INR',
    price: '3000',
  },
};

export function HomePage() {
  return (
    <div className="bg-black text-white overflow-hidden">
      <SeoMeta
        title="ActiveHQ — Run your gym in 10 minutes a day | Indian Gym Management Software"
        description="Cash + UPI collection, WhatsApp renewals, biometric attendance — all in one screen. Built for Indian gyms."
        path="/"
        schemas={[orgSchema, softwareSchema]}
      />

      {/* ════════════════════════════════════════════════════════════════
          HERO — bold, black, neon-green
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16">
        {/* Glow background — animated drift */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-lime-400/10 blur-[180px] rounded-full animate-ambient" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[140px] rounded-full animate-ambient" style={{ animationDelay: '4s' }} />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left: copy */}
            <div className="lg:col-span-7">
              <Reveal variant="up">
                <div className="inline-flex flex-wrap items-center gap-2 mb-7">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime-400/30 bg-lime-400/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                    <span className="text-xs tracking-[0.2em] uppercase text-lime-400 font-medium">
                      Made in India
                    </span>
                  </span>
                  <Link
                    to="/coach"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-white/[0.03] text-xs text-white/80 hover:border-lime-400/40 hover:text-white transition-colors"
                  >
                    <Brain className="w-3 h-3 text-lime-400" />
                    New · Free AI Coach
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </Reveal>

              <Reveal variant="up" delay={80}>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight">
                  Run your gym in
                  <br />
                  <span className="text-lime-400">10 minutes</span>{' '}
                  <span className="text-white/40 font-light">a day.</span>
                </h1>
              </Reveal>

              <Reveal variant="up" delay={140}>
                <p className="mt-8 text-lg sm:text-xl text-white/70 leading-relaxed max-w-2xl">
                  Cash, UPI, attendance, renewals, dues — every part of your gym in one screen.
                  Reminders go out on WhatsApp. Payments land in your bank. You get your evenings back.
                </p>
              </Reveal>

              {/* CTAs */}
              <Reveal variant="up" delay={200}>
                <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Link
                    to="/contact"
                    onClick={() =>
                      trackEvent('cta_click', { location: 'hero', cta: 'book_demo' })
                    }
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-lime-400 text-black font-bold text-base hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(163,230,53,0.5)] transition-all"
                  >
                    Book a 15-min demo
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackEvent('cta_click', { location: 'hero', cta: 'whatsapp' })
                    }
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-white/20 text-white font-semibold hover:border-lime-400/60 hover:text-lime-400 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Talk on WhatsApp
                  </a>
                </div>
              </Reveal>

              {/* Trust strip */}
              <Reveal variant="up" delay={260}>
                <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
                  {[
                    { icon: Banknote, label: 'Cash + UPI' },
                    { icon: MessageCircle, label: 'WhatsApp built-in' },
                    { icon: Fingerprint, label: 'Biometric ready' },
                    { icon: Wifi, label: 'Works on any device' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-white/60 text-sm">
                      <Icon className="w-4 h-4 text-lime-400" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right: dashboard mock */}
            <div className="lg:col-span-5">
              <Reveal variant="scale" delay={150}>
                <DashboardMock />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          STATS — defensible, honest "built for" framing
      ════════════════════════════════════════════════════════════════ */}
      <section className="border-y border-white/10 py-14">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10 min', label: 'Daily admin · target' },
              { value: '₹0', label: 'Setup fee · founding gyms' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '24/7', label: 'WhatsApp support' },
            ].map((stat, i) => (
              <Reveal key={stat.label} variant="up" delay={i * 80}>
                <div className="text-3xl sm:text-4xl font-bold text-lime-400">{stat.value}</div>
                <div className="mt-1 text-sm text-white/50">{stat.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          PERSONAL TRACK — "Built for you too"
          The big differentiator: same platform, also a free AI coach
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-lime-400/10 blur-[160px] rounded-full animate-ambient" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#25D366]/8 blur-[140px] rounded-full animate-ambient" style={{ animationDelay: '6s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left: copy */}
            <div className="lg:col-span-6">
              <Reveal variant="up">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime-400/30 bg-lime-400/5 mb-6">
                  <Brain className="w-3.5 h-3.5 text-lime-400" />
                  <span className="text-xs tracking-[0.2em] uppercase text-lime-400 font-medium">
                    New · Free for everyone
                  </span>
                </div>
              </Reveal>

              <Reveal variant="up" delay={80}>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.02] tracking-tight">
                  Don't run a gym?{' '}
                  <span className="text-lime-400">We built one for you too.</span>
                </h2>
              </Reveal>

              <Reveal variant="up" delay={140}>
                <p className="mt-6 text-lg text-white/70 leading-relaxed max-w-xl">
                  Free AI coach. Indian diet plans. Workouts for home or gym. BMI, macros, 1-rep max —
                  all in 60 seconds. No signup. No paywall.
                </p>
              </Reveal>

              <Reveal variant="up" delay={200}>
                <div className="mt-8 grid sm:grid-cols-2 gap-3">
                  {[
                    { Icon: Apple, t: 'Indian diet plan', s: 'Roti, dal, paneer — real food' },
                    { Icon: Dumbbell, t: 'Workout split', s: 'Home or gym, your call' },
                    { Icon: User, t: 'Body metrics', s: 'BMI, BMR, TDEE, macros' },
                    { Icon: Sparkles, t: 'AI insights', s: 'Coach-style commentary' },
                  ].map(({ Icon, t, s }) => (
                    <div key={t} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-lime-400/40 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-lime-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{t}</div>
                        <div className="text-xs text-white/50 mt-0.5">{s}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal variant="up" delay={280}>
                <div className="mt-10 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/coach"
                    onClick={() =>
                      trackEvent('cta_click', { location: 'personal_block', cta: 'coach' })
                    }
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-lime-400 text-black font-bold hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(163,230,53,0.5)] transition-all"
                  >
                    Try AI Coach — free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/coach#builder"
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-white/20 text-white font-semibold hover:border-lime-400/60 hover:text-lime-400 transition-colors"
                  >
                    See sample plan
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* Right: coach mock */}
            <div className="lg:col-span-6">
              <Reveal variant="scale" delay={150}>
                <CoachHomeMock />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          A DAY AT YOUR GYM
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal variant="up" className="max-w-2xl mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-lime-400 mb-4">
              A day at your gym
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
              Open at 6 AM. Close at 10 PM.
              <br />
              <span className="text-white/40 font-light">ActiveHQ runs in the background.</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                tag: 'Morning',
                title: 'One-tap check-in',
                body: 'Members scan in via QR or biometric. You see who is in, in real time.',
                Icon: Calendar,
              },
              {
                tag: 'Midday',
                title: 'Payments without paperwork',
                body: 'Take cash or UPI. Receipts go on WhatsApp. Daily reconciliation in minutes.',
                Icon: IndianRupee,
              },
              {
                tag: 'Evening',
                title: 'Renewals on autopilot',
                body: '7-day, 3-day, expiry-day reminders go out on WhatsApp without you lifting a finger.',
                Icon: Bell,
              },
              {
                tag: 'Closing',
                title: 'Close the day in a tap',
                body: "Today's collection, attendance, dues — one screen, ready for tomorrow.",
                Icon: TrendingUp,
              },
            ].map(({ tag, title, body, Icon }, idx) => (
              <Reveal key={title} variant="up" delay={idx * 80}>
                <div className="group h-full relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-lime-400/40 hover:bg-white/[0.04] transition-all tilt">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-lime-400">
                      {tag}
                    </span>
                    <Icon className="w-5 h-5 text-white/40 group-hover:text-lime-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm text-white/60 leading-relaxed">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          PAYMENTS — UPI / Cash visual
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 border-t border-white/10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-lime-400/5 blur-[140px] rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-lime-400 mb-4">
              Built for Indian payment reality
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
              Cash <span className="text-white/40 font-light">and</span> UPI{' '}
              <span className="text-white/40 font-light">in the same flow.</span>
            </h2>
            <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-lg">
              Most gym software assumes everyone pays online. India doesn't work like that.
              ActiveHQ tracks every rupee — cash at the counter, UPI on PhonePe / GPay / Paytm,
              card swipes — all in one ledger.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                'Record cash + UPI side by side',
                'WhatsApp UPI link for renewals (Razorpay-ready)',
                'Daily collection report — owner gets it on WhatsApp',
                'Pending dues, member-by-member, one click away',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-white/80">
                  <CheckCircle2 className="w-5 h-5 text-lime-400 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual: Payments mock */}
          <div>
            <PaymentsMock />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          WHATSAPP DIFFERENTIATOR
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 border-t border-white/10 bg-gradient-to-b from-black via-emerald-950/20 to-black">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-16 items-center">
          {/* Phone mock first on mobile, second on desktop */}
          <div className="order-2 lg:order-1 flex justify-center">
            <WhatsAppMock />
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-xs tracking-[0.3em] uppercase text-[#25D366] mb-4">
              Where your members already are
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
              Everything on{' '}
              <span className="text-[#25D366]">WhatsApp.</span>
            </h2>
            <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-lg">
              Renewal nudges, payment links, attendance updates, birthday wishes —
              all on the one app every member already checks 60 times a day.
              No new apps to download. No SMS that nobody opens.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                'Renewal reminders',
                'UPI payment links',
                'Welcome messages',
                'Daily collection',
                'Birthday wishes',
                'Custom broadcasts',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-white/80"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                  {item}
                </div>
              ))}
            </div>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('cta_click', { location: 'whatsapp_block', cta: 'whatsapp' })}
              className="inline-flex items-center gap-2 mt-10 px-6 py-3 rounded-full bg-[#25D366] text-white font-semibold hover:bg-[#1ebd5a] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              See it in action — message us
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          WHY ACTIVEHQ
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-lime-400 mb-4">
              Why ActiveHQ
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
              Built by people who get
              <br />
              <span className="text-lime-400">Indian gym life.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                title: 'Cash-first, UPI-fluent',
                body: 'Reconcile cash bundles + UPI screenshots without ever opening Excel.',
                Icon: IndianRupee,
              },
              {
                title: 'Works on any device',
                body: 'Owner on iPhone, staff on a ₹10,000 Android, biometric at the gate — one system.',
                Icon: Smartphone,
              },
              {
                title: 'WhatsApp is the channel',
                body: 'Every reminder, receipt and renewal nudge lands where members live — WhatsApp.',
                Icon: MessageCircle,
              },
              {
                title: 'Biometric you already own',
                body: 'Plug in ZKTeco or Essl devices. Attendance flows into ActiveHQ automatically.',
                Icon: Fingerprint,
              },
              {
                title: 'Migrate from anything',
                body: 'On AdviceFit, an Excel sheet, or a notebook? We bring it all in on the demo call.',
                Icon: Sparkles,
              },
              {
                title: 'Honest pricing',
                body: 'No per-member fees. No per-message fees. One yearly price, locked for founding gyms.',
                Icon: CheckCircle2,
              },
            ].map(({ title, body, Icon }, idx) => (
              <Reveal key={title} variant="up" delay={idx * 60}>
                <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-lime-400/40 transition-colors tilt">
                  <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center group-hover:bg-lime-400/20 transition-colors">
                    <Icon className="w-5 h-5 text-lime-400" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FOUNDING-GYM PRICING
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 border-t border-white/10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-lime-400/10 blur-[180px] rounded-full" />
        </div>

        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime-400/30 bg-lime-400/5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-xs tracking-[0.2em] uppercase text-lime-400 font-medium">
              Founding gyms · limited spots
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
            One price. <span className="text-white/40 font-light">No surprises.</span>
          </h2>
          <p className="mt-5 text-lg text-white/60 max-w-xl mx-auto">
            We migrate your old data on the demo call itself. You only pay once you're convinced.
          </p>

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
                'Cash + UPI tracking',
                'WhatsApp automation',
                'Biometric integration',
                'Free data migration',
                'Lifetime price-lock',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-lime-400 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/contact"
                onClick={() =>
                  trackEvent('cta_click', { location: 'pricing', cta: 'book_demo' })
                }
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-lime-400 text-black font-bold hover:bg-lime-300 transition-colors"
              >
                Book a 15-min demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent('cta_click', { location: 'pricing', cta: 'whatsapp' })
                }
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-white/20 text-white font-semibold hover:border-lime-400/60 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Talk on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FOUNDER BLOCK
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-lime-400 mb-5">
            A note from the founder
          </p>
          <p className="text-xl sm:text-2xl font-light text-white/90 leading-relaxed">
            "Indian gym owners juggle cash, UPI, biometric, WhatsApp and Excel — every single day.
            ActiveHQ exists so that juggling becomes one screen.
            If you run a gym, I'd love to do the demo myself."
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent('cta_click', { location: 'founder', cta: 'whatsapp' })
            }
            className="mt-8 inline-flex items-center gap-2 text-lime-400 font-semibold hover:text-lime-300 transition-colors"
          >
            Message the founder on WhatsApp
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 border-t border-white/10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-lime-400/10 blur-[180px] rounded-full" />
        </div>

        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <h2 className="text-5xl sm:text-6xl font-bold leading-tight">
            Ready in <span className="text-lime-400">15 minutes.</span>
          </h2>
          <p className="mt-6 text-lg text-white/60">
            We bring your old data in on the call. You walk away with a working dashboard the same day.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/contact"
              onClick={() =>
                trackEvent('cta_click', { location: 'final_cta', cta: 'book_demo' })
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
                trackEvent('cta_click', { location: 'final_cta', cta: 'whatsapp' })
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

/* ────────────────────────────────────────────────────────────────────────
   Mocks — small, self-contained, illustrative
   ──────────────────────────────────────────────────────────────────────── */

function DashboardMock() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-4 bg-lime-400/20 blur-[60px] rounded-3xl" />

      <div className="relative rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <div className="text-[10px] text-white/40 font-mono">activehq.fit/dashboard</div>
          <span className="w-8" />
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-white/40 uppercase tracking-wide">Today</div>
              <div className="text-lg font-semibold text-white">Sample Gym</div>
            </div>
            <span className="text-[10px] text-lime-400 bg-lime-400/10 px-2 py-1 rounded-full border border-lime-400/20">
              Live
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-black/40 border border-white/5 p-3">
              <div className="text-[10px] text-white/40">Check-ins</div>
              <div className="text-2xl font-bold text-white mt-1">47</div>
            </div>
            <div className="rounded-xl bg-black/40 border border-white/5 p-3">
              <div className="text-[10px] text-white/40">Collected</div>
              <div className="text-2xl font-bold text-lime-400 mt-1">₹12.5K</div>
            </div>
            <div className="rounded-xl bg-black/40 border border-white/5 p-3">
              <div className="text-[10px] text-white/40">Active</div>
              <div className="text-2xl font-bold text-white mt-1">247</div>
            </div>
            <div className="rounded-xl bg-black/40 border border-white/5 p-3">
              <div className="text-[10px] text-white/40">Expiring (7d)</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">18</div>
            </div>
          </div>

          {/* Activity feed */}
          <div className="rounded-xl bg-black/40 border border-white/5 p-3 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-wide">
              <span>Recent activity</span>
              <span>just now</span>
            </div>
            {[
              { dot: 'bg-lime-400', text: 'Member #2147 · checked in', t: '2m' },
              { dot: 'bg-emerald-400', text: 'UPI ₹5,000 · Member #2102', t: '8m' },
              { dot: 'bg-[#25D366]', text: 'WhatsApp renewal sent · 18 members', t: '14m' },
            ].map((row) => (
              <div key={row.text} className="flex items-center gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full ${row.dot}`} />
                <span className="text-xs text-white/80 flex-1 truncate">{row.text}</span>
                <span className="text-[10px] text-white/40">{row.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-4 -left-4 px-3 py-2 rounded-xl bg-lime-400 text-black text-xs font-bold shadow-xl flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />
        Illustrative preview
      </div>
    </div>
  );
}

function PaymentsMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-emerald-500/10 blur-[80px] rounded-full" />
      <div className="relative rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wide">Today's collection</div>
            <div className="text-3xl font-bold text-lime-400 mt-1">₹24,500</div>
          </div>
          <span className="text-[10px] text-lime-400 bg-lime-400/10 px-2 py-1 rounded-full border border-lime-400/20">
            6 payments
          </span>
        </div>

        <div className="space-y-2.5">
          {[
            { method: 'UPI', icon: Smartphone, name: 'Member #2102', amount: '₹5,000', color: 'text-emerald-400' },
            { method: 'Cash', icon: Banknote, name: 'Member #2189', amount: '₹3,000', color: 'text-lime-400' },
            { method: 'UPI', icon: Smartphone, name: 'Member #2055', amount: '₹7,500', color: 'text-emerald-400' },
            { method: 'Cash', icon: Banknote, name: 'Member #2210', amount: '₹4,000', color: 'text-lime-400' },
            { method: 'UPI', icon: Smartphone, name: 'Member #1842', amount: '₹5,000', color: 'text-emerald-400' },
          ].map((row, i) => {
            const Icon = row.icon;
            return (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center ${row.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm text-white">{row.name}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wide">{row.method}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-white">{row.amount}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-white/40">Cash · ₹7,000</span>
          <span className="text-white/40">UPI · ₹17,500</span>
        </div>
      </div>
    </div>
  );
}

function CoachHomeMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 bg-lime-400/15 blur-[80px] rounded-full" />
      <div className="relative rounded-3xl border border-white/10 bg-zinc-950 p-6 sm:p-7 shadow-2xl shadow-black/60 overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-400 to-transparent animate-scan"
          aria-hidden
        />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-lime-400" />
            <span className="text-xs tracking-[0.25em] uppercase text-white/50">AI Coach</span>
          </div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-lime-400 bg-lime-400/10 px-2 py-1 rounded-full border border-lime-400/20">
            Live
          </span>
        </div>

        <div className="text-[10px] tracking-[0.2em] uppercase text-white/40">Your plan</div>
        <div className="text-2xl font-bold text-white mt-1">12-week lean cut</div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            { l: 'BMI', v: '23.4', c: 'text-lime-400' },
            { l: 'BMR', v: '1.6k', c: 'text-white' },
            { l: 'TDEE', v: '2.6k', c: 'text-white' },
            { l: 'kcal', v: '2.1k', c: 'text-lime-400' },
          ].map((s) => (
            <div key={s.l} className="rounded-lg bg-black/40 border border-white/5 p-2.5 text-center">
              <div className="text-[9px] text-white/40 uppercase tracking-wide">{s.l}</div>
              <div className={`text-base font-bold ${s.c} mt-0.5`}>{s.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 h-2.5 w-full rounded-full overflow-hidden flex bg-white/5">
          <div className="bg-lime-400" style={{ width: '30%' }} />
          <div className="bg-emerald-400" style={{ width: '45%' }} />
          <div className="bg-amber-400" style={{ width: '25%' }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-white/40">
          <span><span className="text-lime-400">●</span> P 156g</span>
          <span><span className="text-emerald-400">●</span> C 234g</span>
          <span><span className="text-amber-400">●</span> F 58g</span>
        </div>

        <div className="mt-5 rounded-xl bg-black/40 border border-white/5 p-3 space-y-2">
          {[
            { dot: 'bg-lime-400', label: 'Breakfast · 3-egg omelette + rotis', kcal: '420' },
            { dot: 'bg-emerald-400', label: 'Workout · Push (chest, shoulders)', kcal: '~280' },
            { dot: 'bg-cyan-400', label: 'Water · 3.2 L · 1.4 L done', kcal: '' },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2.5">
              <span className={`w-1.5 h-1.5 rounded-full ${row.dot}`} />
              <span className="text-xs text-white/80 flex-1 truncate">{row.label}</span>
              {row.kcal && <span className="text-[10px] text-white/40">{row.kcal}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-4 -right-4 px-3 py-2 rounded-xl bg-lime-400 text-black text-xs font-bold shadow-xl flex items-center gap-1.5 animate-float">
        <Sparkles className="w-3.5 h-3.5" />
        Free · No signup
      </div>
    </div>
  );
}

function WhatsAppMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-[#25D366]/10 blur-[80px] rounded-full" />
      <div className="relative w-72 sm:w-80 rounded-[2.5rem] bg-zinc-950 border border-white/10 p-3 shadow-2xl shadow-black/60">
        {/* Phone screen */}
        <div className="rounded-[2rem] bg-[#0b141a] overflow-hidden">
          {/* WhatsApp header */}
          <div className="px-4 py-3 bg-[#075e54] flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-lime-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="text-white text-sm font-semibold">Sample Gym</div>
              <div className="text-white/70 text-[10px]">via ActiveHQ</div>
            </div>
          </div>

          {/* Chat */}
          <div className="p-4 space-y-3 min-h-[340px] bg-[#0b141a]">
            <div className="max-w-[80%] bg-[#005c4b] text-white text-sm rounded-2xl rounded-tr-sm px-3 py-2">
              Hi! Your membership ends in 3 days. Renew now → upi.activehq.fit/r/2102
              <div className="text-[9px] text-white/50 mt-1 text-right">9:24 AM ✓✓</div>
            </div>
            <div className="max-w-[80%] bg-white/5 text-white text-sm rounded-2xl rounded-tl-sm px-3 py-2">
              Done, paid ₹5,000 ✅
              <div className="text-[9px] text-white/40 mt-1">9:26 AM</div>
            </div>
            <div className="max-w-[80%] bg-[#005c4b] text-white text-sm rounded-2xl rounded-tr-sm px-3 py-2">
              Got it 🙌 Receipt + new validity sent. See you at the gym!
              <div className="text-[9px] text-white/50 mt-1 text-right">9:26 AM ✓✓</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-[#25D366] text-white text-[10px] font-bold uppercase tracking-wide shadow-xl">
        Real WhatsApp
      </div>
    </div>
  );
}
