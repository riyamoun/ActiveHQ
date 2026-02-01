import { Shield, Cloud, MapPin, MessageCircle, Zap, Lock } from 'lucide-react';

const indicators = [
  { icon: Shield, label: 'Bank-Grade Security' },
  { icon: Cloud, label: 'Cloud-Based' },
  { icon: MapPin, label: 'Made for India' },
  { icon: MessageCircle, label: 'WhatsApp Built-in' },
  { icon: Zap, label: 'Lightning Fast' },
  { icon: Lock, label: 'Your Data, Your Control' },
];

const testimonials = [
  {
    quote: "Finally, software that actually understands how Indian gyms work.",
    name: "Vikram Mehta",
    role: "Owner, FitZone Gym",
    city: "Bangalore",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  },
  {
    quote: "Cut my admin work by 70%. More time for what matters.",
    name: "Priya Sharma",
    role: "Manager, PowerHouse Fitness",
    city: "Mumbai",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  },
  {
    quote: "The WhatsApp reminders alone paid for itself in renewals.",
    name: "Arjun Singh",
    role: "Owner, Iron Temple",
    city: "Delhi",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  },
];

export function TrustIndicators() {
  return (
    <section className="relative py-24 bg-slate-900">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }} />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Trust badges - horizontal scroll on mobile */}
        <div className="flex flex-wrap justify-center gap-4 lg:gap-6 mb-20">
          {indicators.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm"
            >
              <item.icon className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="group relative rounded-3xl bg-gradient-to-b from-slate-800/50 to-slate-800/20 border border-slate-700/50 p-8 transition-all hover:border-emerald-500/30"
            >
              {/* Quote */}
              <p className="text-lg text-white font-medium leading-relaxed mb-8">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/20"
                />
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-sm text-slate-400">{t.role}</p>
                  <p className="text-xs text-emerald-500">{t.city}</p>
                </div>
              </div>

              {/* Decorative quote mark */}
              <div className="absolute top-6 right-6 text-6xl font-serif text-emerald-500/10">
                "
              </div>
            </div>
          ))}
        </div>

        {/* Cities */}
        <div className="mt-20 text-center">
          <p className="text-slate-500 text-sm mb-6 uppercase tracking-wider">Powering gyms in</p>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
            {['Bangalore', 'Mumbai', 'Delhi', 'Pune', 'Hyderabad', 'Chennai'].map((city, i) => (
              <span 
                key={city} 
                className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-300"
              >
                {city}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
