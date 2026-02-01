import { ArrowRight, MessageCircle } from 'lucide-react';

export function CTASection() {
  return (
    <section className="relative py-32 bg-slate-950 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[200px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 lg:px-8 text-center">
        {/* Headline */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-8">
          Stop Managing.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400">
            Start Growing.
          </span>
        </h2>

        {/* Subheading */}
        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
          Join 50+ gym owners who chose to work smarter.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#demo"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-10 py-5 text-lg font-semibold text-white shadow-2xl shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50 hover:scale-[1.02]"
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm px-10 py-5 text-lg font-semibold text-white transition-all hover:bg-slate-800/50 hover:border-slate-600"
          >
            <MessageCircle className="h-5 w-5 text-green-500" />
            WhatsApp Us
          </a>
        </div>

        {/* Trust line */}
        <div className="mt-16 flex items-center justify-center gap-4 text-slate-500">
          <span className="text-sm">Trusted by gyms in</span>
          <div className="flex -space-x-2">
            {['🇮🇳', '💪', '🏋️'].map((emoji, i) => (
              <span key={i} className="text-2xl">{emoji}</span>
            ))}
          </div>
          <span className="text-sm">Bangalore, Mumbai, Delhi & more</span>
        </div>
      </div>
    </section>
  );
}
