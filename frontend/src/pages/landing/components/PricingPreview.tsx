import { Check, Sparkles, ArrowRight } from 'lucide-react';

const features = [
  'Unlimited members',
  'WhatsApp reminders',
  'Payment tracking',
  'Attendance system',
  'Reports & analytics',
  'Priority support',
];

export function PricingPreview() {
  return (
    <section className="relative py-32 bg-slate-950 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Simple{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-slate-400">
            One plan. Everything included. No surprises.
          </p>
        </div>

        {/* Pricing card */}
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-[32px] border border-slate-700/50 bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-xl overflow-hidden">
            {/* Founding offer badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-6 py-3 rounded-bl-2xl flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                50% OFF — Founding Offer
              </div>
            </div>

            <div className="p-10 lg:p-12">
              {/* Price display */}
              <div className="text-center mb-10">
                <div className="inline-flex items-baseline gap-2 mb-4">
                  <span className="text-slate-500 line-through text-2xl">₹10,000</span>
                  <span className="text-6xl lg:text-7xl font-bold text-white">₹5,500</span>
                </div>
                <p className="text-slate-400 text-lg">First year all-inclusive</p>
                <p className="text-slate-500 text-sm mt-2">Setup + 12 months subscription</p>
              </div>

              {/* Features grid */}
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-white">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <a
                href="#demo"
                className="group w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-5 text-lg font-semibold text-white shadow-2xl shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50 hover:scale-[1.02]"
              >
                Get Started
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>

              {/* Guarantee */}
              <p className="text-center text-slate-500 text-sm mt-6">
                30-day money-back guarantee. No questions asked.
              </p>
            </div>
          </div>

          {/* Limited spots */}
          <div className="text-center mt-8">
            <p className="text-amber-400 font-medium">
              Only 10 founding spots left this month
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
