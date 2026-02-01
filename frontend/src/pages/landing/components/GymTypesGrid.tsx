const gymTypes = [
  {
    id: 1,
    bg: 'from-slate-800 to-emerald-900/30',
    title: 'Neighborhood Gym',
    members: '100–300 members',
    description: 'Daily tracking, renewals, cash payments',
  },
  {
    id: 2,
    bg: 'from-slate-800 to-blue-900/30',
    title: 'Premium Fitness Studio',
    members: '200–500 members',
    description: 'Multiple plans, group classes, analytics',
  },
  {
    id: 3,
    bg: 'from-slate-800 to-amber-900/30',
    title: 'Strength / CrossFit Gym',
    members: '50–200 members',
    description: 'Batch tracking, PT sessions, specialized plans',
  },
  {
    id: 4,
    bg: 'from-slate-800 to-purple-900/30',
    title: 'Multi-Branch Gym',
    members: '500+ members',
    description: 'Unified dashboard, branch-wise reports',
  },
];

export function GymTypesGrid() {
  return (
    <section className="bg-slate-950 py-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-white text-xl font-medium mb-2">Is this for my gym?</h2>
          <p className="text-slate-400">We work with gyms of all sizes across India</p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gymTypes.map((gym) => (
            <div
              key={gym.id}
              className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
            >
              {/* Snapshot placeholder (no stock photos) */}
              <div className="relative h-40 overflow-hidden">
                <div className={`w-full h-full bg-gradient-to-br ${gym.bg} transition-transform duration-500 group-hover:scale-[1.02]`} />
                <div
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
                  Live snapshot
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-white font-medium mb-1">{gym.title}</h3>
                <p className="text-emerald-400 text-sm mb-2">{gym.members}</p>
                <p className="text-slate-500 text-sm">{gym.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
