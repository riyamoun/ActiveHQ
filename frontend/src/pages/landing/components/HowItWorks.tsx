import { Building2, UserPlus, Sparkles } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Building2,
    title: 'Setup',
    description: 'Add your gym details',
    time: '2 min',
  },
  {
    number: '02',
    icon: UserPlus,
    title: 'Import',
    description: 'Add existing members',
    time: '5 min',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Done',
    description: 'Start tracking',
    time: 'Forever',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-32 bg-slate-900 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-slate-900 to-slate-900" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Live in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              10 Minutes
            </span>
          </h2>
          <p className="text-xl text-slate-400">
            No IT team needed. No training required.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

          <div className="grid lg:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative group">
                {/* Card */}
                <div className="relative rounded-3xl bg-slate-800/50 border border-slate-700/50 p-8 text-center group-hover:border-emerald-500/30 transition-all">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-500/30">
                      {i + 1}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 mb-6 mt-4 group-hover:scale-110 transition-transform">
                    <step.icon className="h-10 w-10 text-emerald-400" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 mb-4">{step.description}</p>
                  
                  {/* Time badge */}
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-sm font-medium text-emerald-400">{step.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <a
            href="#demo"
            className="inline-flex items-center gap-2 text-lg font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>We'll help you get started — free</span>
          </a>
        </div>
      </div>
    </section>
  );
}
