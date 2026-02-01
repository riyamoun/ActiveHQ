import { 
  Users, 
  CalendarCheck, 
  CreditCard, 
  Bell, 
  BarChart3, 
  Building2
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Members',
    description: 'Add, search, manage in seconds',
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: CalendarCheck,
    title: 'Attendance',
    description: 'One-tap check-ins, full history',
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500/10',
  },
  {
    icon: CreditCard,
    title: 'Payments',
    description: 'Track every rupee, chase dues',
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Bell,
    title: 'WhatsApp',
    description: 'Auto-remind renewals & dues',
    gradient: 'from-green-500 to-green-600',
    bg: 'bg-green-500/10',
  },
  {
    icon: BarChart3,
    title: 'Reports',
    description: 'Revenue, trends, insights',
    gradient: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: Building2,
    title: 'Multi-Branch',
    description: 'One dashboard, all locations',
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-500/10',
  },
];

export function FeatureGrid() {
  return (
    <section className="relative py-32 bg-slate-950 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Everything.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              One Place.
            </span>
          </h2>
          <p className="text-xl text-slate-400">
            No more juggling apps and spreadsheets.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group relative rounded-3xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-8 transition-all duration-500 hover:border-slate-600/50 hover:scale-[1.02] overflow-hidden"
            >
              {/* Hover gradient */}
              <div className={`absolute inset-0 ${feature.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>

                {/* Text */}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-lg">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
