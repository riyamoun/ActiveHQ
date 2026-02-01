const gymImages = [
  {
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
    alt: 'Modern gym equipment',
  },
  {
    url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&h=400&fit=crop',
    alt: 'Fitness center interior',
  },
  {
    url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=400&fit=crop',
    alt: 'Gym workout area',
  },
  {
    url: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=600&h=400&fit=crop',
    alt: 'Weight training section',
  },
];

export function GymShowcase() {
  return (
    <section className="relative py-24 bg-slate-950 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Built for Gyms Like Yours
          </h2>
          <p className="text-lg text-slate-400">
            From boutique studios to multi-branch chains
          </p>
        </div>

        {/* Image grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {gymImages.map((img, i) => (
            <div
              key={i}
              className={`relative rounded-2xl overflow-hidden group ${
                i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''
              }`}
            >
              <img
                src={img.url}
                alt={img.alt}
                className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  i === 0 ? 'h-64 lg:h-full' : 'h-48 lg:h-56'
                }`}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              
              {/* Shine effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: '50+', label: 'Gyms Onboarded' },
            { value: '10,000+', label: 'Members Managed' },
            { value: '₹2Cr+', label: 'Payments Tracked' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
