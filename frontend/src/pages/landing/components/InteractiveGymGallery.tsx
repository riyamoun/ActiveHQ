import { useState } from 'react';
import { Users, IndianRupee, Bell, CheckCircle } from 'lucide-react';

const gymPhotos = [
  {
    id: 1,
    bg: 'from-slate-800 via-slate-900 to-emerald-900/40',
    label: 'Gym Floor — Live Snapshot',
    overlay: {
      icon: Users,
      stat: '47',
      label: 'check-ins recorded today',
    },
  },
  {
    id: 2,
    bg: 'from-slate-800 via-slate-900 to-blue-900/40',
    label: 'Cash Counter — Live Snapshot',
    overlay: {
      icon: IndianRupee,
      stat: '₹12,500',
      label: 'collected — auto logged',
    },
  },
  {
    id: 3,
    bg: 'from-slate-800 via-slate-900 to-amber-900/40',
    label: 'Renewals Desk — Live Snapshot',
    overlay: {
      icon: Bell,
      stat: '18',
      label: 'renewal reminders sent',
    },
  },
  {
    id: 4,
    bg: 'from-slate-800 via-slate-900 to-purple-900/40',
    label: 'Memberships — Live Snapshot',
    overlay: {
      icon: CheckCircle,
      stat: '89%',
      label: 'renewal rate this month',
    },
  },
];

export function InteractiveGymGallery() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <section className="bg-slate-950 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* Simple one-liner */}
        <div className="text-center mb-10">
          <p className="text-slate-400 text-lg">
            Members, attendance, payments, renewals —{' '}
            <span className="text-white">everything your gym runs on.</span>
          </p>
          <a
            href="#demo"
            className="inline-block mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
          >
            See how this works for your gym →
          </a>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {gymPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer group"
              onMouseEnter={() => setHoveredId(photo.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Snapshot placeholder (no stock images) */}
              <div
                className={`w-full h-full bg-gradient-to-br ${photo.bg} transition-all duration-500 ${
                  hoveredId === photo.id ? 'scale-[1.02] blur-[2px]' : ''
                }`}
              >
                {/* Subtle grid to feel like a real feed */}
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                  }}
                />
                {/* Snapshot label */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
                  {photo.label}
                </div>
              </div>

              {/* Dark overlay */}
              <div className={`absolute inset-0 bg-slate-950/60 transition-opacity duration-300 ${
                hoveredId === photo.id ? 'opacity-90' : 'opacity-40'
              }`} />

              {/* Hover content */}
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                hoveredId === photo.id ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}>
                <div className="text-center px-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 mb-4">
                    <photo.overlay.icon className="h-7 w-7 text-emerald-400" />
                  </div>
                  <p className="text-white text-2xl font-bold mb-1">{photo.overlay.stat}</p>
                  <p className="text-slate-300 text-sm">{photo.overlay.label}</p>
                </div>
              </div>

              {/* Always visible badge */}
              <div className={`absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300 ${
                hoveredId === photo.id ? 'opacity-0' : 'opacity-100'
              }`}>
                <photo.overlay.icon className="h-4 w-4 text-emerald-400" />
                <span className="text-white text-xs font-medium">{photo.overlay.stat}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
