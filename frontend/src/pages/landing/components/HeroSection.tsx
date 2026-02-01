import { ArrowRight, Play, Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950 pt-20 flex items-center">
      {/* Premium background */}
      <div className="absolute inset-0">
        {/* Gradient mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-20 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            {/* Premium badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 px-5 py-2.5 mb-10 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                Trusted by 50+ gyms
              </span>
            </div>

            {/* Headline - shorter, punchier */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              Your Gym.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400">
                Supercharged.
              </span>
            </h1>

            {/* Subheading - concise */}
            <p className="mt-8 text-xl text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Members. Payments. Attendance. One dashboard.
              <span className="text-slate-300"> Built for India.</span>
            </p>

            {/* CTAs */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="#demo"
                className="group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50 hover:scale-[1.02] overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center gap-2">
                  Start Free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </a>
              <a
                href="#demo"
                className="group inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm px-8 py-4 text-base font-semibold text-white transition-all hover:bg-slate-800/50 hover:border-slate-600"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 group-hover:bg-emerald-500/20 transition-colors">
                  <Play className="h-4 w-4 text-emerald-400 ml-0.5" fill="currentColor" />
                </div>
                Watch Demo
              </a>
            </div>

            {/* Quick stats */}
            <div className="mt-16 flex items-center justify-center lg:justify-start gap-12">
              {[
                { value: '50+', label: 'Gyms' },
                { value: '10K+', label: 'Members' },
                { value: '99.9%', label: 'Uptime' },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Premium Dashboard Preview */}
          <div className="relative lg:pl-8">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/30 via-cyan-500/20 to-emerald-500/30 rounded-3xl blur-3xl opacity-60" />
            
            {/* Main dashboard card */}
            <div className="relative rounded-3xl border border-slate-700/50 bg-slate-900/90 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 bg-slate-800/50">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400">app.activehq.in</span>
                </div>
                <div className="w-16" />
              </div>

              {/* Dashboard content */}
              <div className="p-6">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Good Morning, Rajesh</h3>
                    <p className="text-sm text-slate-500">Friday, 31 Jan 2026</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">Live</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'Check-ins Today', value: '47', change: '+12%', color: 'emerald' },
                    { label: 'Active Members', value: '247', change: '+8', color: 'blue' },
                    { label: 'Revenue (Jan)', value: '₹2.4L', change: '+18%', color: 'purple' },
                    { label: 'Expiring Soon', value: '18', change: 'Action', color: 'amber' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className={`rounded-2xl p-4 border ${
                        stat.color === 'emerald' ? 'bg-emerald-500/5 border-emerald-500/20' :
                        stat.color === 'blue' ? 'bg-blue-500/5 border-blue-500/20' :
                        stat.color === 'purple' ? 'bg-purple-500/5 border-purple-500/20' :
                        'bg-amber-500/5 border-amber-500/20'
                      }`}
                    >
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                      <div className={`text-xs mt-2 font-medium ${
                        stat.color === 'emerald' ? 'text-emerald-400' :
                        stat.color === 'blue' ? 'text-blue-400' :
                        stat.color === 'purple' ? 'text-purple-400' :
                        'text-amber-400'
                      }`}>{stat.change}</div>
                    </div>
                  ))}
                </div>

                {/* Mini chart */}
                <div className="rounded-2xl bg-slate-800/30 border border-slate-700/30 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-white">This Week</span>
                    <span className="text-xs text-emerald-400">+23% vs last week</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-16">
                    {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all hover:from-emerald-500 hover:to-cyan-400"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating notification card */}
            <div className="absolute -right-4 top-1/3 rounded-2xl bg-slate-900/95 border border-slate-700/50 p-4 shadow-2xl backdrop-blur-xl animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <span className="text-lg">🔔</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">New Payment</p>
                  <p className="text-xs text-slate-400">₹5,000 from Rahul S.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
    </section>
  );
}
