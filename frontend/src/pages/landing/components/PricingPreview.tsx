import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { formatInr, PRICING } from '@/constants/pricing';

const features = [
  'Unlimited members',
  'WhatsApp reminders',
  'Payment tracking',
  'Attendance system',
  'Reports & analytics',
  'Priority support',
];

export function PricingPreview() {
  const { normal, founding } = PRICING;

  return (
    <section className="relative py-32 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Simple{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-slate-400">Standard and founding plans. No per-member fees.</p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <PricingCard
            title="Standard"
            yearly={normal.yearlyInr}
            setup={normal.setupInr}
            yearlyNote="/year"
          />
          <PricingCard
            title="Founding gym"
            badge="Founding offer"
            yearly={founding.yearlyInr}
            setup={founding.setupInr}
            yearlyNote="first year"
            highlighted
            compareYearly={normal.yearlyInr}
          />
        </div>

        <div className="max-w-3xl mx-auto mt-10">
          <FeaturesGridInner />
        </div>

        <div className="text-center mt-8">
          <p className="text-amber-400 font-medium">Limited founding spots available</p>
        </div>
      </div>
    </section>
  );
}

function FeaturesGridInner() {
  return (
    <div className="grid sm:grid-cols-2 gap-4 p-8 rounded-2xl border border-slate-700/50 bg-slate-900/50">
      {features.map((feature) => (
        <div key={feature} className="flex items-center gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="h-4 w-4 text-emerald-500" />
          </div>
          <span className="text-white">{feature}</span>
        </div>
      ))}
      <a
        href="#demo"
        className="sm:col-span-2 group mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-5 text-lg font-semibold text-white shadow-2xl shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50 hover:scale-[1.02]"
      >
        Get Started
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </a>
    </div>
  );
}

function PricingCard({
  title,
  badge,
  yearly,
  setup,
  yearlyNote,
  highlighted,
  compareYearly,
}: {
  title: string;
  badge?: string;
  yearly: number;
  setup: number;
  yearlyNote: string;
  highlighted?: boolean;
  compareYearly?: number;
}) {
  return (
    <div
      className={`relative rounded-[32px] border p-10 overflow-hidden ${
        highlighted
          ? 'border-emerald-500/40 bg-gradient-to-b from-slate-800/80 to-slate-900/80'
          : 'border-slate-700/50 bg-slate-900/60'
      }`}
    >
      {badge && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-6 py-3 rounded-bl-2xl flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {badge}
          </div>
        </div>
      )}
      <p className="text-sm uppercase tracking-widest text-slate-400">{title}</p>
      <div className="mt-6 text-center">
        {compareYearly != null && (
          <span className="text-slate-500 line-through text-xl mr-2">
            ₹{formatInr(compareYearly)}
          </span>
        )}
        <span className="text-5xl font-bold text-white">₹{formatInr(yearly)}</span>
        <span className="text-slate-400 text-lg"> {yearlyNote}</span>
        <p className="text-slate-500 text-sm mt-3">+ ₹{formatInr(setup)} one-time setup</p>
      </div>
    </div>
  );
}
