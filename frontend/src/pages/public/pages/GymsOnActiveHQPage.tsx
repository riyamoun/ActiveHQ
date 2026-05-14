import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, MessageCircle } from 'lucide-react';
import { SeoMeta } from '@/components/seo/SeoMeta';
import { trackEvent } from '@/lib/analytics';

const WHATSAPP_LINK =
  'https://wa.me/919354349118?text=Hi%20ActiveHQ%2C%20I%20run%20a%20gym%20and%20want%20to%20book%20a%20demo.';

const stories = [
  {
    name: 'Neighborhood gym',
    location: 'Tier-2 cities · 100–250 members',
    members: '250+',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    quote:
      'Designed so renewals and reminders run automatically — owners reclaim hours every week.',
    owner: 'Built for gyms of this size',
  },
  {
    name: 'Strength studio',
    location: 'Metro suburbs · 150–200 members',
    members: '180+',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80',
    quote:
      'Cash + UPI reconciliation in one screen, so daily closing takes minutes, not hours.',
    owner: 'Built for studios like this',
  },
  {
    name: 'Multi-trainer gym',
    location: 'High street · 250–400 members',
    members: '320+',
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
    quote:
      'One dashboard for every trainer, every shift — built so owners can scale without losing control.',
    owner: 'Built for growing teams',
  },
  {
    name: 'New launch',
    location: 'Just opened · 50–150 members',
    members: '150+',
    image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&q=80',
    quote:
      'Start organised from day one — every member, plan and payment tracked from the first signup.',
    owner: 'Built for new gyms',
  },
];

const stats = [
  { value: '50+', label: 'Pilot gym capacity' },
  { value: '15,000+', label: 'Members per gym' },
  { value: '₹3 Cr+', label: 'Revenue trackable / yr' },
  { value: '40%', label: 'Target renewal lift' },
];

export function GymsOnActiveHQPage() {
  return (
    <div className="bg-black text-white">
      <SeoMeta
        title="Built for Indian Gyms | ActiveHQ"
        description="ActiveHQ is designed for the gyms that run India — neighborhood centers, strength studios, multi-trainer setups and new launches. Founding access now open."
        path="/gyms"
      />

      {/* HERO */}
      <section className="relative pt-24 pb-16 sm:pb-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] bg-lime-400/10 blur-[180px] rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime-400/30 bg-lime-400/5 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-xs tracking-[0.2em] uppercase text-lime-400 font-medium">
              Founding access
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight max-w-3xl">
            Built for the gyms
            <br />
            <span className="text-lime-400">that run India.</span>
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-white/60 max-w-2xl leading-relaxed">
            From neighborhood fitness centers to multi-trainer studios, ActiveHQ is
            designed for every kind of gym operating in India today.
          </p>
          <p className="mt-4 text-sm text-white/40">
            Profiles below represent the gym archetypes ActiveHQ is built for. Founding-access
            partners welcome.
          </p>
        </div>
      </section>

      {/* STORIES GRID */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {stories.map((story) => (
              <div
                key={story.name}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] hover:border-lime-400/40 hover:bg-white/[0.04] transition-all overflow-hidden"
              >
                <div
                  className="aspect-[16/9] bg-cover bg-center"
                  style={{ backgroundImage: `url('${story.image}')` }}
                >
                  <div className="w-full h-full bg-black/40 group-hover:bg-black/30 transition-colors" />
                </div>
                <div className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{story.name}</h3>
                      <div className="flex items-center gap-1.5 text-white/50 text-sm mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {story.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lime-400 font-bold">{story.members}</div>
                      <div className="text-white/40 text-xs">members</div>
                    </div>
                  </div>
                  <blockquote className="text-white/70 italic text-sm leading-relaxed">
                    "{story.quote}"
                  </blockquote>
                  <div className="mt-4 text-white/40 text-xs tracking-wide">{story.owner}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-white/10 py-14">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-bold text-lime-400">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMISE */}
      <section className="py-24 sm:py-28">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-lime-400 mb-6">
            The promise
          </p>
          <blockquote className="text-3xl sm:text-4xl font-light text-white/90 leading-relaxed">
            "ActiveHQ isn't built to just organise a gym — it's built so an owner can run the
            whole business from one screen and stay in control."
          </blockquote>
          <div className="mt-8 text-white/50">
            <div className="font-semibold text-white">The ActiveHQ promise</div>
            <div className="text-sm mt-1">For Indian gym owners · Founding access open</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 sm:py-32 border-t border-white/10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-lime-400/10 blur-[180px] rounded-full" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <h2 className="text-5xl sm:text-6xl font-bold leading-tight">
            Your gym could be{' '}
            <span className="text-lime-400">next.</span>
          </h2>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/contact"
              onClick={() =>
                trackEvent('cta_click', { location: 'stories_final_cta', cta: 'book_demo' })
              }
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-lime-400 text-black font-bold hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(163,230,53,0.5)] transition-all"
            >
              Book a 15-min demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent('cta_click', { location: 'stories_final_cta', cta: 'whatsapp' })
              }
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white font-semibold hover:border-lime-400/60 hover:text-lime-400 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Talk on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
